/**
 * Reset and reseed all data in the database
 * 
 * This function performs a complete reset:
 * 1. Clears and seeds loads (foundation)
 * 2. Seeds geo_points from loads (required for map visualization)
 * 3. Clears and seeds call_metrics (links to loads with geo_points)
 * 4. Rebuilds map_points table (pre-computed for fast map rendering)
 * 
 * Usage:
 *   Dev:  npx convex run seed:resetAll
 *   Prod: npx convex run --prod seed:resetAll
 */
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const resetAll = internalMutation({
  args: {},
  returns: v.object({
    loads: v.object({
      cleared: v.number(),
      seeded: v.string(),
    }),
    geoPoints: v.object({
      processed: v.number(),
      originPoints: v.number(),
      destinationPoints: v.number(),
      skipped: v.number(),
    }),
    callMetrics: v.object({
      cleared: v.number(),
      seeded: v.string(),
    }),
    mapPoints: v.object({
      processed: v.number(),
      created: v.number(),
      errors: v.number(),
      missingLoadIds: v.array(v.string()),
    }),
  }),
  handler: async (ctx) => {
    // Step 1: Clear and seed loads
    console.log("🔄 Step 1/4: Clearing and seeding loads...");
    await ctx.runMutation(internal.loads.clearLoads, {});
    await ctx.runMutation(internal.loads.seedLoads, {});
    const loadsCount = (await ctx.db.query("loads").collect()).length;
    console.log(`✅ Seeded ${loadsCount} loads`);

    // Step 2: Seed geo_points from loads (with force to reseed)
    console.log("🔄 Step 2/4: Seeding geo_points from loads...");
    const geoPointsResult = await ctx.runMutation(internal.geo_points.seedGeoPointsFromLoads, { force: true }) as {
      processed: number;
      originPoints: number;
      destinationPoints: number;
      skipped: number;
    };
    console.log(`✅ Processed ${geoPointsResult.processed} loads, ${geoPointsResult.originPoints} origins, ${geoPointsResult.destinationPoints} destinations, ${geoPointsResult.skipped} skipped`);

    // Step 3: Clear and seed call_metrics
    console.log("🔄 Step 3/4: Clearing and seeding call_metrics...");
    await ctx.runMutation(internal.call_metrics.clearCallMetrics, {});
    await ctx.runMutation(internal.call_metrics.seedCallMetrics, {});
    const callsCount = (await ctx.db.query("call_metrics").collect()).length;
    console.log(`✅ Seeded ${callsCount} call metrics`);

    // Step 4: Rebuild map_points table
    console.log("🔄 Step 4/4: Rebuilding map_points table...");
    const mapPointsResult = await ctx.runMutation(internal.map_points.rebuildMapPoints, {}) as {
      processed: number;
      created: number;
      errors: number;
      missingLoadIds: string[];
    };
    console.log(`✅ Processed ${mapPointsResult.processed} calls, created ${mapPointsResult.created} map points, ${mapPointsResult.errors} errors`);

    if (mapPointsResult.errors > 0) {
      console.warn(`⚠️  Warning: ${mapPointsResult.errors} errors during map_points rebuild. Missing load IDs: ${mapPointsResult.missingLoadIds.slice(0, 5).join(", ")}${mapPointsResult.missingLoadIds.length > 5 ? "..." : ""}`);
    }

    console.log("✅ Database reset and reseeding complete!");

    return {
      loads: {
        cleared: 0, // We clear before seeding, so we don't track this separately
        seeded: `${loadsCount} loads`,
      },
      geoPoints: geoPointsResult,
      callMetrics: {
        cleared: 0, // We clear before seeding, so we don't track this separately
        seeded: `${callsCount} calls`,
      },
      mapPoints: mapPointsResult,
    };
  },
});
