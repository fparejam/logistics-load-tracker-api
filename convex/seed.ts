/**
 * Seed script to populate the database with sample loads
 * Run this once to initialize the database with test data
 */

import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export default internalMutation({
  handler: async (ctx) => {
    // Call the seedLoads mutation
    await ctx.runMutation(internal.loads.seedLoads, {});
    // Seed call metrics for ACME Dashboard
    await ctx.runMutation(internal.call_metrics.seedCallMetrics, {});
    console.log("Database seeded successfully!");
  },
});
