import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { OutcomeTag } from "./types";

/**
 * Fast query to get all map points - just reads from pre-computed table
 * This is much faster than joining call_metrics + geo_points on every request
 */
export const getMapLoadsPoints = query({
  args: {
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    equipment: v.optional(v.string()),
    agent_name: v.optional(v.string()),
    outcome_tag: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let points = await ctx.db.query("map_loads_points").collect();

    // Apply all filters
    points = points.filter((p) => {
      // Date filters
      if (args.start_date || args.end_date) {
        if (args.start_date && p.timestamp_utc < args.start_date) return false;
        if (args.end_date && p.timestamp_utc > args.end_date) return false;
      }
      
      // Equipment filter
      if (args.equipment && args.equipment !== "all" && p.equipment !== args.equipment) {
        return false;
      }
      
      // Agent filter
      if (args.agent_name && args.agent_name !== "all" && p.agent_name !== args.agent_name) {
        return false;
      }
      
      // Outcome filter - we need to look up the call_metric for this
      // For now, map_loads_points only contains won_transferred calls, so outcome filter only applies to that
      if (args.outcome_tag && args.outcome_tag !== "all" && args.outcome_tag !== "won_transferred") {
        return false; // Only won_transferred calls are in map_loads_points
      }
      
      return true;
    });

    // Convert to GeoJSON FeatureCollection
    return {
      type: "FeatureCollection" as const,
      features: points.map((p) => ({
        type: "Feature" as const,
        properties: {
          call_id: p.call_id,
          load_id: p.load_id,
          equipment: p.equipment,
          loadboard_rate: p.loadboard_rate,
          final_rate: p.final_rate,
          agent_name: p.agent_name,
          timestamp_utc: p.timestamp_utc,
          origin_city: p.origin_city,
          origin_state: p.origin_state,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lng, p.lat] as [number, number],
        },
      })),
    };
  },
});

/**
 * Background mutation to update map points when a successful call is created
 * Called automatically after createCallMetric for won_transferred calls
 */
export const updateMapPointForCall = internalMutation({
  args: {
    call_id: v.id("call_metrics"),
    load_id: v.string(),
    equipment_type: v.string(),
    loadboard_rate: v.number(),
    final_rate: v.union(v.number(), v.null()),
    agent_name: v.string(),
    timestamp_utc: v.string(),
  },
  handler: async (ctx, args) => {
    // Get origin geo_point for this load
    const originPoint = await ctx.db
      .query("geo_points")
      .withIndex("by_entity", (q) => 
        q.eq("entity_type", "load").eq("entity_id", args.load_id)
      )
      .filter((q) => q.eq(q.field("role"), "origin"))
      .first();

    if (!originPoint) {
      // Silently fail - geo_point might not exist yet
      return;
    }

    // Check if map point already exists for this call
    const existing = await ctx.db
      .query("map_loads_points")
      .withIndex("by_call_id", (q) => q.eq("call_id", args.call_id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        load_id: args.load_id,
        lng: originPoint.lng,
        lat: originPoint.lat,
        equipment: args.equipment_type,
        loadboard_rate: args.loadboard_rate,
        final_rate: args.final_rate,
        agent_name: args.agent_name,
        timestamp_utc: args.timestamp_utc,
        origin_city: originPoint.city,
        origin_state: originPoint.state,
      });
    } else {
      // Insert new
      return await ctx.db.insert("map_loads_points", {
        call_id: args.call_id,
        load_id: args.load_id,
        lng: originPoint.lng,
        lat: originPoint.lat,
        equipment: args.equipment_type,
        loadboard_rate: args.loadboard_rate,
        final_rate: args.final_rate,
        agent_name: args.agent_name,
        timestamp_utc: args.timestamp_utc,
        origin_city: originPoint.city,
        origin_state: originPoint.state,
      });
    }
  },
});

/**
 * Internal mutation to rebuild map points from all successful calls
 * Useful for initial population or fixing data inconsistencies
 */
export const rebuildMapPoints = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    created: v.number(),
    errors: v.number(),
    missingLoadIds: v.array(v.string()),
  }),
  handler: async (ctx) => {
    // Clear existing map points
    const existing = await ctx.db.query("map_loads_points").collect();
    for (const point of existing) {
      await ctx.db.delete(point._id);
    }

    // Get all successful calls
    const successfulCalls = await ctx.db
      .query("call_metrics")
      .withIndex("by_outcome", (q) => q.eq("outcome_tag", OutcomeTag.WonTransferred))
      .filter((q) => 
        q.and(
          q.neq(q.field("related_load_id"), null),
          q.neq(q.field("related_load_id"), "")
        )
      )
      .collect();

    let created = 0;
    let errors = 0;
    const missingLoadIds: string[] = [];

    // Get all loads to check which ones exist
    const allLoads = await ctx.db.query("loads").collect();
    const loadIdSet = new Set(allLoads.map(l => l.load_id));

    for (const call of successfulCalls) {
      if (!call.related_load_id) continue;

      // Check if load exists
      if (!loadIdSet.has(call.related_load_id)) {
        errors++;
        missingLoadIds.push(call.related_load_id);
        continue;
      }

      try {
        // Get origin geo_point for this load
        const originPoint = await ctx.db
          .query("geo_points")
          .withIndex("by_entity", (q) => 
            q.eq("entity_type", "load").eq("entity_id", call.related_load_id!)
          )
          .filter((q) => q.eq(q.field("role"), "origin"))
          .first();

        if (!originPoint) {
          errors++;
          missingLoadIds.push(call.related_load_id);
          continue;
        }

        await ctx.db.insert("map_loads_points", {
          call_id: call._id,
          load_id: call.related_load_id!,
          lng: originPoint.lng,
          lat: originPoint.lat,
          equipment: call.equipment_type,
          loadboard_rate: call.loadboard_rate,
          final_rate: call.final_rate,
          agent_name: call.agent_name,
          timestamp_utc: call.timestamp_utc,
          origin_city: originPoint.city,
          origin_state: originPoint.state,
        });
        created++;
      } catch (err) {
        errors++;
        missingLoadIds.push(call.related_load_id);
      }
    }

    return {
      processed: successfulCalls.length,
      created,
      errors,
      missingLoadIds: Array.from(new Set(missingLoadIds)).slice(0, 20), // Return first 20 unique missing IDs
    };
  },
});
