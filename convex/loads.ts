import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Query loads with filtering, pagination, and sorting
 * This is a public query that will be called via HTTP endpoint
 */
export const listLoads = query({
  args: {
    // Filtering
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    equipment_type: v.optional(v.string()),
    pickup_from: v.optional(v.number()), // UTC timestamp
    pickup_to: v.optional(v.number()), // UTC timestamp
    delivery_from: v.optional(v.number()), // UTC timestamp
    delivery_to: v.optional(v.number()), // UTC timestamp
    min_rate: v.optional(v.number()),
    max_rate: v.optional(v.number()),
    // Pagination
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    // Sorting
    sort_by: v.optional(v.union(v.literal("pickup_datetime"), v.literal("loadboard_rate"))),
    sort_order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    items: v.array(
      v.object({
        _id: v.id("loads"),
        _creationTime: v.number(),
        origin: v.string(),
        destination: v.string(),
        pickup_datetime: v.number(),
        delivery_datetime: v.number(),
        equipment_type: v.string(),
        loadboard_rate: v.number(),
        weight: v.number(),
        commodity_type: v.string(),
        dimensions: v.string(),
      })
    ),
    total: v.number(),
    limit: v.number(),
    offset: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    const sortBy = args.sort_by ?? "pickup_datetime";
    const sortOrder = args.sort_order ?? "asc";

    // Collect all loads - we'll filter in memory for simplicity
    // For production with large datasets, consider using more sophisticated indexing
    let loads = await ctx.db.query("loads").collect();

    // Apply filters
    if (args.origin) {
      loads = loads.filter((load) => load.origin === args.origin);
    }
    if (args.destination) {
      loads = loads.filter((load) => load.destination === args.destination);
    }
    if (args.equipment_type) {
      loads = loads.filter((load) => load.equipment_type === args.equipment_type);
    }
    if (args.pickup_from !== undefined) {
      loads = loads.filter((load) => load.pickup_datetime >= args.pickup_from!);
    }
    if (args.pickup_to !== undefined) {
      loads = loads.filter((load) => load.pickup_datetime <= args.pickup_to!);
    }
    if (args.delivery_from !== undefined) {
      loads = loads.filter((load) => load.delivery_datetime >= args.delivery_from!);
    }
    if (args.delivery_to !== undefined) {
      loads = loads.filter((load) => load.delivery_datetime <= args.delivery_to!);
    }
    if (args.min_rate !== undefined) {
      loads = loads.filter((load) => load.loadboard_rate >= args.min_rate!);
    }
    if (args.max_rate !== undefined) {
      loads = loads.filter((load) => load.loadboard_rate <= args.max_rate!);
    }

    // Sort
    loads.sort((a, b) => {
      const aVal = sortBy === "pickup_datetime" ? a.pickup_datetime : a.loadboard_rate;
      const bVal = sortBy === "pickup_datetime" ? b.pickup_datetime : b.loadboard_rate;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    const total = loads.length;

    // Apply pagination
    const paginatedLoads = loads.slice(offset, offset + limit);

    return {
      items: paginatedLoads,
      total,
      limit,
      offset,
    };
  },
});

/**
 * Internal mutation to seed the database with sample loads
 */
export const seedLoads = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if we already have loads
    const existingLoads = await ctx.db.query("loads").take(1);
    if (existingLoads.length > 0) {
      console.log("Loads already seeded, skipping...");
      return null;
    }

    const sampleLoads: Array<Omit<Doc<"loads">, "_id" | "_creationTime">> = [
      {
        origin: "Los Angeles, CA",
        destination: "Phoenix, AZ",
        pickup_datetime: new Date("2024-02-15T08:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-15T18:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 850.0,
        weight: 42000,
        commodity_type: "Electronics",
        dimensions: "48x102",
      },
      {
        origin: "Chicago, IL",
        destination: "New York, NY",
        pickup_datetime: new Date("2024-02-16T06:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-17T14:00:00Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1850.0,
        weight: 38000,
        commodity_type: "Frozen Foods",
        dimensions: "53x102",
      },
      {
        origin: "Dallas, TX",
        destination: "Atlanta, GA",
        pickup_datetime: new Date("2024-02-17T10:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-18T16:00:00Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 1200.0,
        weight: 45000,
        commodity_type: "Steel Beams",
        dimensions: "40ft tarp",
      },
      {
        origin: "Seattle, WA",
        destination: "Portland, OR",
        pickup_datetime: new Date("2024-02-18T09:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-18T15:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 450.0,
        weight: 25000,
        commodity_type: "Furniture",
        dimensions: "48x96",
      },
      {
        origin: "Miami, FL",
        destination: "Houston, TX",
        pickup_datetime: new Date("2024-02-19T07:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-20T19:00:00Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1650.0,
        weight: 40000,
        commodity_type: "Pharmaceuticals",
        dimensions: "53x102",
      },
      {
        origin: "Denver, CO",
        destination: "Salt Lake City, UT",
        pickup_datetime: new Date("2024-02-20T08:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-20T20:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 750.0,
        weight: 35000,
        commodity_type: "Consumer Goods",
        dimensions: "48x102",
      },
      {
        origin: "Boston, MA",
        destination: "Washington, DC",
        pickup_datetime: new Date("2024-02-21T06:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-21T18:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 950.0,
        weight: 30000,
        commodity_type: "Paper Products",
        dimensions: "53x102",
      },
      {
        origin: "San Francisco, CA",
        destination: "Las Vegas, NV",
        pickup_datetime: new Date("2024-02-22T10:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-22T22:00:00Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 1100.0,
        weight: 48000,
        commodity_type: "Construction Materials",
        dimensions: "48ft flatbed",
      },
      {
        origin: "Philadelphia, PA",
        destination: "Charlotte, NC",
        pickup_datetime: new Date("2024-02-23T07:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-24T13:00:00Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1400.0,
        weight: 37000,
        commodity_type: "Dairy Products",
        dimensions: "53x102",
      },
      {
        origin: "Minneapolis, MN",
        destination: "Kansas City, MO",
        pickup_datetime: new Date("2024-02-24T08:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-25T14:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 900.0,
        weight: 32000,
        commodity_type: "Automotive Parts",
        dimensions: "48x102",
      },
      {
        origin: "Phoenix, AZ",
        destination: "San Diego, CA",
        pickup_datetime: new Date("2024-02-25T09:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-25T17:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 650.0,
        weight: 28000,
        commodity_type: "Textiles",
        dimensions: "48x96",
      },
      {
        origin: "Nashville, TN",
        destination: "Memphis, TN",
        pickup_datetime: new Date("2024-02-26T10:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-26T16:00:00Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 550.0,
        weight: 44000,
        commodity_type: "Machinery",
        dimensions: "40ft tarp",
      },
      {
        origin: "Detroit, MI",
        destination: "Cleveland, OH",
        pickup_datetime: new Date("2024-02-27T07:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-27T13:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 500.0,
        weight: 26000,
        commodity_type: "Appliances",
        dimensions: "48x102",
      },
      {
        origin: "Portland, OR",
        destination: "Sacramento, CA",
        pickup_datetime: new Date("2024-02-28T08:00:00Z").getTime(),
        delivery_datetime: new Date("2024-02-29T14:00:00Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1300.0,
        weight: 39000,
        commodity_type: "Fresh Produce",
        dimensions: "53x102",
      },
      {
        origin: "Indianapolis, IN",
        destination: "Columbus, OH",
        pickup_datetime: new Date("2024-03-01T09:00:00Z").getTime(),
        delivery_datetime: new Date("2024-03-01T15:00:00Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 450.0,
        weight: 24000,
        commodity_type: "Retail Goods",
        dimensions: "48x96",
      },
    ];

    // Insert all sample loads
    for (const load of sampleLoads) {
      await ctx.db.insert("loads", load);
    }

    console.log(`Seeded ${sampleLoads.length} loads successfully`);
    return null;
  },
});

/**
 * Internal mutation to clear all loads (useful for testing)
 */
export const clearLoads = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const loads = await ctx.db.query("loads").collect();
    for (const load of loads) {
      await ctx.db.delete(load._id);
    }
    console.log(`Cleared ${loads.length} loads`);
    return null;
  },
});
