import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Query to get carrier call analytics with filters
 */
export const getAnalytics = query({
  args: {
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
    equipment_type: v.optional(v.string()),
    agent_name: v.optional(v.string()),
    outcome: v.optional(v.string()),
  },
  returns: v.object({
    calls: v.array(
      v.object({
        _id: v.id("carrier_calls"),
        _creationTime: v.number(),
        call_date: v.number(),
        agent_name: v.string(),
        equipment_type: v.string(),
        origin_city: v.string(),
        origin_state: v.string(),
        destination_city: v.string(),
        destination_state: v.string(),
        outcome: v.string(),
        negotiation_rounds: v.number(),
        listed_rate: v.optional(v.number()),
        final_rate: v.optional(v.number()),
        sentiment_score: v.number(),
        call_duration_seconds: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("carrier_calls");

    // Apply date filter
    if (args.start_date) {
      query = query.filter((q) => q.gte(q.field("call_date"), args.start_date!));
    }
    if (args.end_date) {
      query = query.filter((q) => q.lte(q.field("call_date"), args.end_date!));
    }

    // Apply equipment filter
    if (args.equipment_type && args.equipment_type !== "all") {
      query = query.filter((q) => q.eq(q.field("equipment_type"), args.equipment_type!));
    }

    // Apply agent filter
    if (args.agent_name && args.agent_name !== "all") {
      query = query.filter((q) => q.eq(q.field("agent_name"), args.agent_name!));
    }

    // Apply outcome filter
    if (args.outcome && args.outcome !== "all") {
      query = query.filter((q) => q.eq(q.field("outcome"), args.outcome!));
    }

    const calls = await query.collect();

    return { calls };
  },
});

/**
 * Query to get unique agents
 */
export const getAgents = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const calls = await ctx.db.query("carrier_calls").collect();
    const agents = new Set(calls.map((call) => call.agent_name));
    return Array.from(agents).sort();
  },
});

/**
 * Internal mutation to seed sample carrier call data
 */
export const seedCarrierCalls = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if we already have data
    const existing = await ctx.db.query("carrier_calls").take(1);
    if (existing.length > 0) {
      console.log("Carrier calls already seeded, skipping...");
      return null;
    }

    const agents = ["Pablo", "Katya", "Marcus", "Sofia"];
    const equipmentTypes = ["dry_van", "reefer", "flatbed"];
    const outcomes = [
      "won_transferred",
      "no_agreement_price",
      "no_fit_found",
      "ineligible",
      "other",
    ];
    
    const lanes = [
      { origin: "Chicago", state: "IL", dest: "Dallas", destState: "TX" },
      { origin: "Los Angeles", state: "CA", dest: "Phoenix", destState: "AZ" },
      { origin: "Atlanta", state: "GA", dest: "Miami", destState: "FL" },
      { origin: "New York", state: "NY", dest: "Boston", destState: "MA" },
      { origin: "Seattle", state: "WA", dest: "Portland", destState: "OR" },
      { origin: "Denver", state: "CO", dest: "Salt Lake City", destState: "UT" },
      { origin: "Houston", state: "TX", dest: "New Orleans", destState: "LA" },
      { origin: "Detroit", state: "MI", dest: "Cleveland", destState: "OH" },
    ];

    const sampleCalls: Array<Omit<Doc<"carrier_calls">, "_id" | "_creationTime">> = [];

    // Generate 60 days of data
    const now = Date.now();
    const daysToGenerate = 60;

    for (let day = 0; day < daysToGenerate; day++) {
      const callsPerDay = Math.floor(Math.random() * 8) + 5; // 5-12 calls per day
      
      for (let i = 0; i < callsPerDay; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        const listedRate = Math.floor(Math.random() * 2000) + 500;
        const finalRate = outcome === "won_transferred" 
          ? listedRate + Math.floor(Math.random() * 200) - 100
          : undefined;
        
        const sentimentScore = outcome === "won_transferred"
          ? Math.random() * 2 - 0.5 // -0.5 to 1.5
          : outcome === "no_agreement_price"
          ? Math.random() * 2 - 2 // -2 to 0
          : Math.random() * 2 - 1; // -1 to 1

        sampleCalls.push({
          call_date: now - (day * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000),
          agent_name: agent,
          equipment_type: equipment,
          origin_city: lane.origin,
          origin_state: lane.state,
          destination_city: lane.dest,
          destination_state: lane.destState,
          outcome,
          negotiation_rounds: Math.floor(Math.random() * 5) + 1,
          listed_rate: listedRate,
          final_rate: finalRate,
          sentiment_score: Math.round(sentimentScore * 10) / 10,
          call_duration_seconds: Math.floor(Math.random() * 600) + 120,
        });
      }
    }

    // Insert all calls
    for (const call of sampleCalls) {
      await ctx.db.insert("carrier_calls", call);
    }

    console.log(`Seeded ${sampleCalls.length} carrier calls successfully`);
    return null;
  },
});

/**
 * Internal mutation to clear all carrier calls
 */
export const clearCarrierCalls = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const calls = await ctx.db.query("carrier_calls").collect();
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    console.log(`Cleared ${calls.length} carrier calls`);
    return null;
  },
});
