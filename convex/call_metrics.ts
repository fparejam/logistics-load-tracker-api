import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

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
      // Date filter
      if (call.timestamp_utc < args.start_date || call.timestamp_utc > args.end_date) {
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
    const wonCalls = filteredCalls.filter((c) => c.outcome_tag === "won_transferred").length;
    const winRate = wonCalls / totalCalls;

    const avgRounds = filteredCalls.reduce((sum, c) => sum + c.negotiation_rounds, 0) / totalCalls;

    const priceDisagreements = filteredCalls.filter((c) => c.outcome_tag === "no_agreement_price").length;
    const pctPriceDisagreements = priceDisagreements / totalCalls;

    const noFitCalls = filteredCalls.filter((c) => c.outcome_tag === "no_fit_found").length;
    const pctNoFit = noFitCalls / totalCalls;

    // Convert sentiment tags to numeric scores
    const sentimentMap: Record<string, number> = {
      very_positive: 2,
      positive: 1,
      neutral: 0,
      negative: -1,
      very_negative: -2,
    };

    const totalSentiment = filteredCalls.reduce((sum, c) => sum + sentimentMap[c.sentiment_tag], 0);
    const avgSentiment = totalSentiment / totalCalls;
    // Scale from -2..+2 to -1..+1
    const sentimentScore = avgSentiment / 2;

    // Calculate financial metrics (only for calls with final_rate)
    const callsWithFinalRate = filteredCalls.filter((c) => c.final_rate !== null);
    const avgListed = filteredCalls.reduce((sum, c) => sum + c.loadboard_rate, 0) / totalCalls;
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
    // Check if we already have data
    const existing = await ctx.db.query("call_metrics").take(1);
    if (existing.length > 0) {
      console.log("Call metrics already seeded, skipping...");
      return null;
    }

    const agents = ["Pablo", "Katya"];
    const equipmentTypes = ["dry_van", "reefer", "flatbed"];
    const outcomes: Array<Doc<"call_metrics">["outcome_tag"]> = [
      "won_transferred",
      "no_agreement_price",
      "no_fit_found",
      "ineligible",
      "other",
    ];

    const sampleCalls: Array<Omit<Doc<"call_metrics">, "_id" | "_creationTime">> = [];

    // Generate 60 days of data
    const now = Date.now();
    const daysToGenerate = 60;

    for (let day = 0; day < daysToGenerate; day++) {
      const callsPerDay = Math.floor(Math.random() * 8) + 5; // 5-12 calls per day

      for (let i = 0; i < callsPerDay; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

        // Sentiment correlates with outcome
        let sentiment: Doc<"call_metrics">["sentiment_tag"];
        if (outcome === "won_transferred") {
          sentiment = Math.random() > 0.3 ? "positive" : "very_positive";
        } else if (outcome === "no_agreement_price") {
          sentiment = Math.random() > 0.5 ? "negative" : "very_negative";
        } else {
          sentiment = "neutral";
        }

        const loadboardRate = Math.floor(Math.random() * 2000) + 500;
        const finalRate = outcome === "won_transferred"
          ? loadboardRate + Math.floor(Math.random() * 200) - 100
          : null;

        const callDate = new Date(now - day * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);

        sampleCalls.push({
          timestamp_utc: callDate.toISOString(),
          agent_name: agent,
          equipment_type: equipment,
          outcome_tag: outcome,
          sentiment_tag: sentiment,
          negotiation_rounds: Math.floor(Math.random() * 5) + 1,
          loadboard_rate: loadboardRate,
          final_rate: finalRate,
        });
      }
    }

    // Insert all calls
    for (const call of sampleCalls) {
      await ctx.db.insert("call_metrics", call);
    }

    console.log(`Seeded ${sampleCalls.length} call metrics successfully`);
    return null;
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
