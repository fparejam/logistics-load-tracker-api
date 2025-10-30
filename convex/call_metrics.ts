import { v } from "convex/values";
import { query, internalMutation, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { OutcomeTag, SentimentTag } from "./types";

/**
 * Query to get call metrics summary with filters
 */

export const getSummary = query({
  args: {
    start_date: v.string(), // ISO string
    end_date: v.string(), // ISO string
    equipment_type: v.optional(v.string()),
    agent_name: v.optional(v.string()),
    outcome_tag: v.optional(v.string()),
  },
  returns: v.object({
    total_calls: v.number(),
    win_rate: v.number(), // 0-1 decimal
    avg_negotiation_rounds: v.number(),
    pct_no_agreement_price: v.number(), // 0-1 decimal
    pct_no_fit_found: v.number(), // 0-1 decimal
    sentiment_score: v.number(), // -1 to +1 scale
    avg_listed: v.number(),
    avg_final: v.number(),
    avg_uplift_pct: v.number(), // 0-1 decimal
  }),
  handler: async (ctx, args) => {
    let allCalls = await ctx.db.query("call_metrics").collect();

    // Apply filters
    const filteredCalls = allCalls.filter((call) => {
      // Date filter - use inclusive boundaries (>= start and <= end)
      const callDate = call.timestamp_utc;
      if (callDate < args.start_date || callDate > args.end_date) {
        return false;
      }

      // Equipment filter
      if (args.equipment_type && args.equipment_type !== "all" && call.equipment_type !== args.equipment_type) {
        return false;
      }

      // Agent filter
      if (args.agent_name && args.agent_name !== "all" && call.agent_name !== args.agent_name) {
        return false;
      }

      // Outcome filter
      if (args.outcome_tag && args.outcome_tag !== "all" && call.outcome_tag !== args.outcome_tag) {
        return false;
      }

      return true;
    });

    const totalCalls = filteredCalls.length;

    if (totalCalls === 0) {
      return {
        total_calls: 0,
        win_rate: 0,
        avg_negotiation_rounds: 0,
        pct_no_agreement_price: 0,
        pct_no_fit_found: 0,
        sentiment_score: 0,
        avg_listed: 0,
        avg_final: 0,
        avg_uplift_pct: 0,
      };
    }

    // Calculate KPIs
    const wonCalls = filteredCalls.filter((c) => c.outcome_tag === OutcomeTag.WonTransferred).length;
    const winRate = wonCalls / totalCalls;

    const avgRounds = filteredCalls.reduce((sum, c) => sum + c.negotiation_rounds, 0) / totalCalls;

    const priceDisagreements = filteredCalls.filter((c) => c.outcome_tag === OutcomeTag.NoAgreementPrice).length;
    const pctPriceDisagreements = priceDisagreements / totalCalls;

    const noFitCalls = filteredCalls.filter((c) => c.outcome_tag === OutcomeTag.NoFitFound).length;
    const pctNoFit = noFitCalls / totalCalls;

    // Convert sentiment tags to numeric scores
    const sentimentMap: Record<string, number> = {
      [SentimentTag.VeryPositive]: 2,
      [SentimentTag.Positive]: 1,
      [SentimentTag.Neutral]: 0,
      [SentimentTag.Negative]: -1,
      [SentimentTag.VeryNegative]: -2,
    };

    const totalSentiment = filteredCalls.reduce((sum, c) => sum + sentimentMap[c.sentiment_tag], 0);
    const avgSentiment = totalSentiment / totalCalls;
    // Scale from -2..+2 to -1..+1
    const sentimentScore = avgSentiment / 2;

    // Calculate financial metrics
    // Only compare wins (calls with final_rate) for both listed and final
    // This ensures fair comparison - we're comparing the same subset of calls
    const callsWithFinalRate = filteredCalls.filter((c) => c.final_rate !== null);
    
    // For accurate comparison, calculate avgListed from the SAME calls that have final_rate (wins only)
    // This way we're comparing apples to apples: listed rate of wins vs final rate of wins
    const avgListed = callsWithFinalRate.length > 0
      ? callsWithFinalRate.reduce((sum, c) => sum + c.loadboard_rate, 0) / callsWithFinalRate.length
      : 0;
    const avgFinal = callsWithFinalRate.length > 0
      ? callsWithFinalRate.reduce((sum, c) => sum + (c.final_rate as number), 0) / callsWithFinalRate.length
      : 0;
    const avgUpliftPct = avgListed > 0 ? (avgFinal - avgListed) / avgListed : 0;

    return {
      total_calls: totalCalls,
      win_rate: winRate,
      avg_negotiation_rounds: avgRounds,
      pct_no_agreement_price: pctPriceDisagreements,
      pct_no_fit_found: pctNoFit,
      sentiment_score: sentimentScore,
      avg_listed: avgListed,
      avg_final: avgFinal,
      avg_uplift_pct: avgUpliftPct,
    };
  },
});

/**
 * Query to get unique agents
 */
export const getAgents = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const calls = await ctx.db.query("call_metrics").collect();
    const agents = new Set(calls.map((call) => call.agent_name));
    return Array.from(agents).sort();
  },
});

/**
 * Internal mutation to seed sample call metrics data
 */
export const seedCallMetrics = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Clear existing data first to ensure fresh seed
    const existing = await ctx.db.query("call_metrics").collect();
    if (existing.length > 0) {
      for (const call of existing) {
        await ctx.db.delete(call._id);
      }
    }
    const agents = ["Pablo", "Katya"];
    const equipmentTypes = ["dry_van", "reefer", "flatbed"];
    const sampleCalls: Array<Omit<Doc<"call_metrics">, "_id" | "_creationTime">> = [];

    // Generate 60 days of data
    const now = Date.now();
    const daysToGenerate = 60;

    // Outcome distribution:
    // - 70% wins (won_transferred)
    // - 30% non-wins: 35% price disagreements (10.5% total) + 65% no fit (19.5% total)
    const pickOutcome = (): Doc<"call_metrics">["outcome_tag"] => {
      const rand = Math.random();
      if (rand < 0.70) return OutcomeTag.WonTransferred;      // 70% wins
      if (rand < 0.805) return OutcomeTag.NoAgreementPrice;  // 10.5% price disagreements (0.70 + 0.105 = 0.805)
      return OutcomeTag.NoFitFound;                           // 19.5% no fit (remaining)
    };

    // Negotiation rounds: avg ~2.1
    // Distribution: 0 rounds (3%), 1 round (18%), 2 rounds (47%), 3 rounds (32%)
    // Expected: 0×0.03 + 1×0.18 + 2×0.47 + 3×0.32 = 2.08 ≈ 2.1
    const getNegotiationRounds = (): number => {
      const rand = Math.random();
      if (rand < 0.03) return 0;
      if (rand < 0.21) return 1;  // 0.03 + 0.18 = 0.21
      if (rand < 0.68) return 2;  // 0.21 + 0.47 = 0.68
      return 3;                    // remaining 32%
    };

    // Sentiment: always positive/very_positive
    const getSentiment = (outcome: Doc<"call_metrics">["outcome_tag"]): Doc<"call_metrics">["sentiment_tag"] => {
      if (outcome === OutcomeTag.WonTransferred) {
        return Math.random() < 0.85 ? SentimentTag.VeryPositive : SentimentTag.Positive;
      } else if (outcome === OutcomeTag.NoAgreementPrice) {
        const rand = Math.random();
        if (rand < 0.5) return SentimentTag.Positive;
        if (rand < 0.85) return SentimentTag.Neutral;
        return SentimentTag.VeryPositive;
      } else {
        // no_fit_found
        const rand = Math.random();
        if (rand < 0.6) return SentimentTag.Positive;
        if (rand < 0.9) return SentimentTag.VeryPositive;
        return SentimentTag.Neutral;
      }
    };

    // Uplift for wins: avg ~10% higher than listed rate
    // Distribution: 15% at 5-8%, 60% at 8-12%, 25% at 12-18%
    // Expected: 0.15×6.5 + 0.60×10 + 0.25×15 = 10.725 ≈ 10%
    const calculateFinalRate = (listedRate: number): number => {
      const rand = Math.random();
      let upliftPercent: number;
      if (rand < 0.15) {
        upliftPercent = 5 + Math.random() * 3;      // 5-8%
      } else if (rand < 0.75) {
        upliftPercent = 8 + Math.random() * 4;      // 8-12%
      } else {
        upliftPercent = 12 + Math.random() * 6;      // 12-18%
      }
      const finalRate = Math.round(listedRate * (1 + upliftPercent / 100));
      // Safety: ensure final > listed
      return finalRate > listedRate ? finalRate : Math.round(listedRate * 1.01) + 1;
    };

    // Generate calls
    for (let day = 0; day < daysToGenerate; day++) {
      const callsPerDay = Math.floor(Math.random() * 8) + 5; // 5-12 calls per day

      for (let i = 0; i < callsPerDay; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const outcome = pickOutcome();
        const sentiment = getSentiment(outcome);
        const negotiationRounds = getNegotiationRounds();
        const loadboardRate = Math.floor(Math.random() * 2000) + 500; // $500-$2,499
        const finalRate = outcome === OutcomeTag.WonTransferred ? calculateFinalRate(loadboardRate) : null;
        const callDate = new Date(now - day * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);

        sampleCalls.push({
          timestamp_utc: callDate.toISOString(),
          agent_name: agent,
          equipment_type: equipment,
          outcome_tag: outcome,
          sentiment_tag: sentiment,
          negotiation_rounds: negotiationRounds,
          loadboard_rate: loadboardRate,
          final_rate: finalRate,
        });
      }
    }

    // Insert all calls
    for (const call of sampleCalls) {
      await ctx.db.insert("call_metrics", call);
    }

    // Verify the data was inserted
    const verifyCount = await ctx.db.query("call_metrics").collect();
    const outcomeCounts = {
      [OutcomeTag.WonTransferred]: 0,
      [OutcomeTag.NoAgreementPrice]: 0,
      [OutcomeTag.NoFitFound]: 0,
      [OutcomeTag.Ineligible]: 0,
      [OutcomeTag.Other]: 0,
    } as Record<OutcomeTag, number>;
    for (const call of verifyCount) {
      outcomeCounts[call.outcome_tag]++;
    }
    return null;
  },
});

/**
 * Query to debug/inspect call metrics data
 */
export const inspectData = query({
  args: {},
  returns: v.object({
    total_calls: v.number(),
    outcome_counts: v.object({
      won_transferred: v.number(),
      no_agreement_price: v.number(),
      no_fit_found: v.number(),
      ineligible: v.number(),
      other: v.number(),
    }),
    win_rate: v.number(),
    avg_negotiation_rounds: v.number(),
    price_disagreements_pct: v.number(),
    no_fit_pct: v.number(),
    sentiment_counts: v.object({
      very_positive: v.number(),
      positive: v.number(),
      neutral: v.number(),
      negative: v.number(),
      very_negative: v.number(),
    }),
    avg_listed: v.number(),
    avg_final: v.number(),
    avg_uplift_pct: v.number(),
    date_range: v.object({
      oldest: v.string(),
      newest: v.string(),
    }),
    sample_calls: v.array(v.object({
      timestamp: v.string(),
      outcome: v.string(),
      sentiment: v.string(),
      rounds: v.number(),
      listed: v.number(),
      final: v.union(v.number(), v.null()),
    })),
  }),
  handler: async (ctx) => {
    const allCalls = await ctx.db.query("call_metrics").collect();
    
    if (allCalls.length === 0) {
      return {
        total_calls: 0,
        outcome_counts: { won_transferred: 0, no_agreement_price: 0, no_fit_found: 0, ineligible: 0, other: 0 },
        win_rate: 0,
        avg_negotiation_rounds: 0,
        price_disagreements_pct: 0,
        no_fit_pct: 0,
        sentiment_counts: { very_positive: 0, positive: 0, neutral: 0, negative: 0, very_negative: 0 },
        avg_listed: 0,
        avg_final: 0,
        avg_uplift_pct: 0,
        date_range: { oldest: "", newest: "" },
        sample_calls: [],
      };
    }

    const outcomeCounts = {
      won_transferred: 0,
      no_agreement_price: 0,
      no_fit_found: 0,
      ineligible: 0,
      other: 0,
    };

    const sentimentCounts = {
      [SentimentTag.VeryPositive]: 0,
      [SentimentTag.Positive]: 0,
      [SentimentTag.Neutral]: 0,
      [SentimentTag.Negative]: 0,
      [SentimentTag.VeryNegative]: 0,
    } as Record<SentimentTag, number>;

    let totalRounds = 0;
    let totalListed = 0;
    let totalFinal = 0;
    let winsCount = 0;
    const timestamps: string[] = [];

    for (const call of allCalls) {
      outcomeCounts[call.outcome_tag]++;
      sentimentCounts[call.sentiment_tag]++;
      totalRounds += call.negotiation_rounds;
      timestamps.push(call.timestamp_utc);
      
      if (call.outcome_tag === OutcomeTag.WonTransferred && call.final_rate !== null) {
        totalListed += call.loadboard_rate;
        totalFinal += call.final_rate;
        winsCount++;
      }
    }

    const winRate = outcomeCounts.won_transferred / allCalls.length;
    const avgRounds = totalRounds / allCalls.length;
    const priceDisagreementsPct = outcomeCounts[OutcomeTag.NoAgreementPrice] / allCalls.length;
    const noFitPct = outcomeCounts[OutcomeTag.NoFitFound] / allCalls.length;

    const avgListed = winsCount > 0 ? totalListed / winsCount : 0;
    const avgFinal = winsCount > 0 ? totalFinal / winsCount : 0;
    const avgUpliftPct = avgListed > 0 ? (avgFinal - avgListed) / avgListed : 0;

    timestamps.sort();
    const sampleCalls = allCalls.slice(0, 5).map(c => ({
      timestamp: c.timestamp_utc,
      outcome: c.outcome_tag,
      sentiment: c.sentiment_tag,
      rounds: c.negotiation_rounds,
      listed: c.loadboard_rate,
      final: c.final_rate,
    }));

    return {
      total_calls: allCalls.length,
      outcome_counts: outcomeCounts,
      win_rate: winRate,
      avg_negotiation_rounds: avgRounds,
      price_disagreements_pct: priceDisagreementsPct,
      no_fit_pct: noFitPct,
      sentiment_counts: sentimentCounts,
      avg_listed: avgListed,
      avg_final: avgFinal,
      avg_uplift_pct: avgUpliftPct,
      date_range: {
        oldest: timestamps[0] || "",
        newest: timestamps[timestamps.length - 1] || "",
      },
      sample_calls: sampleCalls,
    };
  },
});

/**
 * Public mutation to create a single call metric
 * Used by API endpoint to create call metrics
 */
export const createCallMetric = mutation({
  args: {
    timestamp_utc: v.optional(v.string()),
    agent_name: v.string(),
    equipment_type: v.string(),
    outcome_tag: v.union(
      v.literal(OutcomeTag.WonTransferred),
      v.literal(OutcomeTag.NoAgreementPrice),
      v.literal(OutcomeTag.NoFitFound),
      v.literal(OutcomeTag.Ineligible),
      v.literal(OutcomeTag.Other)
    ),
    sentiment_tag: v.union(
      v.literal(SentimentTag.VeryPositive),
      v.literal(SentimentTag.Positive),
      v.literal(SentimentTag.Neutral),
      v.literal(SentimentTag.Negative),
      v.literal(SentimentTag.VeryNegative)
    ),
    negotiation_rounds: v.number(),
    loadboard_rate: v.number(),
    final_rate: v.union(v.number(), v.null()),
  },
  returns: v.id("call_metrics"),
  handler: async (ctx, args) => {
    // Validate final_rate based on outcome
    if (args.outcome_tag === OutcomeTag.WonTransferred && args.final_rate === null) {
      throw new Error("final_rate must be provided when outcome_tag is 'won_transferred'");
    }
    if (args.outcome_tag !== OutcomeTag.WonTransferred && args.final_rate !== null) {
      throw new Error("final_rate must be null when outcome_tag is not 'won_transferred'");
    }

    // Use provided timestamp or generate current UTC timestamp
    const timestamp = args.timestamp_utc || new Date().toISOString();

    const id = await ctx.db.insert("call_metrics", {
      timestamp_utc: timestamp,
      agent_name: args.agent_name,
      equipment_type: args.equipment_type,
      outcome_tag: args.outcome_tag,
      sentiment_tag: args.sentiment_tag,
      negotiation_rounds: args.negotiation_rounds,
      loadboard_rate: args.loadboard_rate,
      final_rate: args.final_rate,
    });

    return id;
  },
});

/**
 * Internal mutation to clear all call metrics
 */
export const clearCallMetrics = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const calls = await ctx.db.query("call_metrics").collect();
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    console.log(`Cleared ${calls.length} call metrics`);
    return null;
  },
});
