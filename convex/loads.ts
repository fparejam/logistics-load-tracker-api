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
    load_id: v.optional(v.string()),
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
        load_id: v.string(),
        origin: v.string(),
        destination: v.string(),
        pickup_datetime: v.number(),
        delivery_datetime: v.number(),
        equipment_type: v.string(),
        loadboard_rate: v.number(),
        notes: v.string(),
        weight: v.number(),
        commodity_type: v.string(),
        num_of_pieces: v.number(),
        miles: v.number(),
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
    if (args.load_id) {
      loads = loads.filter((load) => load.load_id === args.load_id);
    }
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
      if (sortBy === "pickup_datetime") {
        // Compare timestamps (numbers)
        return sortOrder === "asc" 
          ? a.pickup_datetime - b.pickup_datetime
          : b.pickup_datetime - a.pickup_datetime;
      } else {
        // Compare numbers for loadboard_rate
        return sortOrder === "asc" ? a.loadboard_rate - b.loadboard_rate : b.loadboard_rate - a.loadboard_rate;
      }
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
  args: { force: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if we already have loads (unless force is true)
    if (!args.force) {
      const existingLoads = await ctx.db.query("loads").take(1);
      if (existingLoads.length > 0) {
        console.log("Loads already seeded, skipping...");
        return null;
      }
    }

    const sampleLoads: Array<Omit<Doc<"loads">, "_id" | "_creationTime">> = [
      {
        load_id: "LOAD-001",
        origin: "Los Angeles, CA",
        destination: "Phoenix, AZ",
        pickup_datetime: new Date("2024-02-15T08:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-15T18:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 850.0,
        notes: "Fragile - handle with care",
        weight: 42000,
        commodity_type: "Electronics",
        num_of_pieces: 50,
        miles: 370,
        dimensions: "48x102",
      },
      {
        load_id: "LOAD-002",
        origin: "Chicago, IL",
        destination: "New York, NY",
        pickup_datetime: new Date("2024-02-16T06:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-17T14:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1850.0,
        notes: "Maintain temperature below freezing",
        weight: 38000,
        commodity_type: "Frozen Foods",
        num_of_pieces: 120,
        miles: 800,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-003",
        origin: "Dallas, TX",
        destination: "Atlanta, GA",
        pickup_datetime: new Date("2024-02-17T10:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-18T16:00:00.000Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 1200.0,
        notes: "Requires certified driver",
        weight: 45000,
        commodity_type: "Steel Beams",
        num_of_pieces: 25,
        miles: 925,
        dimensions: "40ft tarp",
      },
      {
        load_id: "LOAD-004",
        origin: "Seattle, WA",
        destination: "Portland, OR",
        pickup_datetime: new Date("2024-02-18T09:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-18T15:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 450.0,
        notes: "White glove delivery",
        weight: 25000,
        commodity_type: "Furniture",
        num_of_pieces: 45,
        miles: 175,
        dimensions: "48x96",
      },
      {
        load_id: "LOAD-005",
        origin: "Miami, FL",
        destination: "Houston, TX",
        pickup_datetime: new Date("2024-02-19T07:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-20T19:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1650.0,
        notes: "Medical grade storage required",
        weight: 40000,
        commodity_type: "Pharmaceuticals",
        num_of_pieces: 85,
        miles: 1195,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-006",
        origin: "Denver, CO",
        destination: "Salt Lake City, UT",
        pickup_datetime: new Date("2024-02-20T08:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-20T20:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 750.0,
        notes: "Standard delivery",
        weight: 35000,
        commodity_type: "Consumer Goods",
        num_of_pieces: 60,
        miles: 525,
        dimensions: "48x102",
      },
      {
        load_id: "LOAD-007",
        origin: "Boston, MA",
        destination: "Washington, DC",
        pickup_datetime: new Date("2024-02-21T06:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-21T18:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 950.0,
        notes: "Office hours delivery only",
        weight: 30000,
        commodity_type: "Paper Products",
        num_of_pieces: 75,
        miles: 440,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-008",
        origin: "San Francisco, CA",
        destination: "Las Vegas, NV",
        pickup_datetime: new Date("2024-02-22T10:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-22T22:00:00.000Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 1100.0,
        notes: "Oversized load permit needed",
        weight: 48000,
        commodity_type: "Construction Materials",
        num_of_pieces: 30,
        miles: 570,
        dimensions: "48ft flatbed",
      },
      {
        load_id: "LOAD-009",
        origin: "Philadelphia, PA",
        destination: "Charlotte, NC",
        pickup_datetime: new Date("2024-02-23T07:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-24T13:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1400.0,
        notes: "Cold chain compliance",
        weight: 37000,
        commodity_type: "Dairy Products",
        num_of_pieces: 95,
        miles: 545,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-010",
        origin: "Detroit, MI",
        destination: "Indianapolis, IN",
        pickup_datetime: new Date("2024-02-24T09:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-24T17:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 600.0,
        notes: "Pre-loaded pallets",
        weight: 28000,
        commodity_type: "Auto Parts",
        num_of_pieces: 55,
        miles: 290,
        dimensions: "48x102",
      },
      {
        load_id: "LOAD-011",
        origin: "Phoenix, AZ",
        destination: "San Diego, CA",
        pickup_datetime: new Date("2024-02-25T08:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-25T18:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 900.0,
        notes: "Climate controlled",
        weight: 32000,
        commodity_type: "Produce",
        num_of_pieces: 110,
        miles: 355,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-012",
        origin: "Nashville, TN",
        destination: "Memphis, TN",
        pickup_datetime: new Date("2024-02-26T10:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-26T16:00:00.000Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 550.0,
        notes: "Heavy machinery - rigging equipment",
        weight: 46000,
        commodity_type: "Industrial Equipment",
        num_of_pieces: 15,
        miles: 210,
        dimensions: "48ft flatbed",
      },
      {
        load_id: "LOAD-013",
        origin: "Portland, OR",
        destination: "Sacramento, CA",
        pickup_datetime: new Date("2024-02-27T07:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-27T13:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 800.0,
        notes: "Standard appliance delivery",
        weight: 33000,
        commodity_type: "Appliances",
        num_of_pieces: 40,
        miles: 585,
        dimensions: "48x102",
      },
      {
        load_id: "LOAD-014",
        origin: "Atlanta, GA",
        destination: "Orlando, FL",
        pickup_datetime: new Date("2024-02-28T08:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-29T14:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1300.0,
        notes: "Fresh produce - quick delivery",
        weight: 36000,
        commodity_type: "Fresh Produce",
        num_of_pieces: 100,
        miles: 440,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-015",
        origin: "Minneapolis, MN",
        destination: "Kansas City, MO",
        pickup_datetime: new Date("2024-03-01T09:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-03-01T15:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 700.0,
        notes: "Standard retail delivery",
        weight: 29000,
        commodity_type: "Retail Goods",
        num_of_pieces: 65,
        miles: 465,
        dimensions: "48x102",
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
 * This will delete ALL documents in the loads table, even if they don't match the current schema
 */
export const clearLoads = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Query all loads - this will work even with schema mismatches
    const loads = await ctx.db.query("loads").collect();
    let count = 0;
    for (const load of loads) {
      await ctx.db.delete(load._id);
      count++;
    }
    console.log(`Cleared ${count} loads`);
    return null;
  },
});

/**
 * Internal mutation to clear and reseed the database in one transaction
 */
export const clearAndSeedLoads = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // First, clear all existing loads
    const existingLoads = await ctx.db.query("loads").collect();
    for (const load of existingLoads) {
      await ctx.db.delete(load._id);
    }
    console.log(`Cleared ${existingLoads.length} loads`);

    // Then, insert new loads
    const sampleLoads: Array<Omit<Doc<"loads">, "_id" | "_creationTime">> = [
      {
        load_id: "LOAD-001",
        origin: "Los Angeles, CA",
        destination: "Phoenix, AZ",
        pickup_datetime: new Date("2024-02-15T08:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-15T18:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 850.0,
        notes: "Fragile - handle with care",
        weight: 42000,
        commodity_type: "Electronics",
        num_of_pieces: 50,
        miles: 370,
        dimensions: "48x102",
      },
      {
        load_id: "LOAD-002",
        origin: "Chicago, IL",
        destination: "New York, NY",
        pickup_datetime: new Date("2024-02-16T06:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-17T14:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1850.0,
        notes: "Maintain temperature below freezing",
        weight: 38000,
        commodity_type: "Frozen Foods",
        num_of_pieces: 120,
        miles: 800,
        dimensions: "53x102",
      },
      {
        load_id: "LOAD-003",
        origin: "Dallas, TX",
        destination: "Atlanta, GA",
        pickup_datetime: new Date("2024-02-17T10:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-18T16:00:00.000Z").getTime(),
        equipment_type: "flatbed",
        loadboard_rate: 1200.0,
        notes: "Requires certified driver",
        weight: 45000,
        commodity_type: "Steel Beams",
        num_of_pieces: 25,
        miles: 925,
        dimensions: "40ft tarp",
      },
      {
        load_id: "LOAD-004",
        origin: "Seattle, WA",
        destination: "Portland, OR",
        pickup_datetime: new Date("2024-02-18T09:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-18T15:00:00.000Z").getTime(),
        equipment_type: "dry_van",
        loadboard_rate: 450.0,
        notes: "White glove delivery",
        weight: 25000,
        commodity_type: "Furniture",
        num_of_pieces: 45,
        miles: 175,
        dimensions: "48x96",
      },
      {
        load_id: "LOAD-005",
        origin: "Miami, FL",
        destination: "Houston, TX",
        pickup_datetime: new Date("2024-02-19T07:00:00.000Z").getTime(),
        delivery_datetime: new Date("2024-02-20T19:00:00.000Z").getTime(),
        equipment_type: "reefer",
        loadboard_rate: 1650.0,
        notes: "Medical grade storage required",
        weight: 40000,
        commodity_type: "Pharmaceuticals",
        num_of_pieces: 85,
        miles: 1195,
        dimensions: "53x102",
      },
    ];

    for (const load of sampleLoads) {
      await ctx.db.insert("loads", load);
    }

    console.log(`Seeded ${sampleLoads.length} loads successfully`);
    return null;
  },
});
import { internalQuery } from "./_generated/server";

export const queryAllLoads = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const loads = await ctx.db.query("loads").collect();
    return loads.map(load => ({
      id: load._id,
      load_id: (load as any).load_id || "MISSING",
      origin: (load as any).origin,
      destination: (load as any).destination,
      commodity_type: (load as any).commodity_type,
    }));
  },
});
