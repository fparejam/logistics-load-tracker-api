import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
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
    const limit = args.limit ?? 5;
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
    // String fields use loose matching (case-insensitive partial match)
    if (args.origin) {
      loads = loads.filter((load) => load.origin.toLowerCase().includes(args.origin!.toLowerCase()));
    }
    if (args.destination) {
      loads = loads.filter((load) => load.destination.toLowerCase().includes(args.destination!.toLowerCase()));
    }
    if (args.equipment_type) {
      loads = loads.filter((load) => load.equipment_type.toLowerCase().includes(args.equipment_type!.toLowerCase()));
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

    // Expanded city list with major US logistics hubs
    const cities = [
      "Los Angeles, CA", "Phoenix, AZ", "Chicago, IL", "New York, NY", "Dallas, TX",
      "Atlanta, GA", "Seattle, WA", "Portland, OR", "Miami, FL", "Houston, TX",
      "Denver, CO", "Salt Lake City, UT", "Boston, MA", "Washington, DC", "San Francisco, CA",
      "Las Vegas, NV", "Philadelphia, PA", "Charlotte, NC", "Detroit, MI", "Indianapolis, IN",
      "San Diego, CA", "Nashville, TN", "Memphis, TN", "Sacramento, CA", "Orlando, FL",
      "Minneapolis, MN", "Kansas City, MO", "Columbus, OH", "Milwaukee, WI", "Louisville, KY",
      "Tampa, FL", "Jacksonville, FL", "Baltimore, MD", "Raleigh, NC", "Austin, TX",
      "San Antonio, TX", "Oklahoma City, OK", "Tulsa, OK", "Omaha, NE", "Wichita, KS",
      "Cleveland, OH", "Pittsburgh, PA", "Cincinnati, OH", "Buffalo, NY", "Rochester, NY",
      "Richmond, VA", "Norfolk, VA", "Greensboro, NC", "Birmingham, AL", "Jackson, MS",
      "Little Rock, AR", "Des Moines, IA", "Fargo, ND", "Sioux Falls, SD", "Rapid City, SD",
    ];

    const equipmentTypes = ["dry_van", "reefer", "flatbed"];
    const commodityTypes = [
      "Electronics", "Frozen Foods", "Steel Beams", "Furniture", "Pharmaceuticals",
      "Consumer Goods", "Paper Products", "Construction Materials", "Dairy Products",
      "Auto Parts", "Produce", "Industrial Equipment", "Appliances", "Fresh Produce",
      "Retail Goods", "Textiles", "Chemicals", "Machinery", "Food Products", "Building Supplies"
    ];

    // Hub cities that connect to many destinations (more traffic)
    const hubCities = ["Chicago, IL", "Dallas, TX", "Atlanta, GA", "Los Angeles, CA", "New York, NY"];

    const sampleLoads: Array<Omit<Doc<"loads">, "_id" | "_creationTime">> = [];
    
    // Generate 100 loads with interconnected routes
    const baseDate = new Date("2024-09-01T00:00:00.000Z");
    const routePairs = new Set<string>(); // Track unique routes to avoid exact duplicates
    
    for (let i = 1; i <= 100; i++) {
      let origin: string;
      let destination: string;
      let routeKey: string = "";
      
      // Create interconnected routes - hub cities connect to many destinations
      do {
        if (Math.random() < 0.4 && hubCities.length > 0) {
          // 40% chance: route from or to a hub city
          const isHubOrigin = Math.random() < 0.5;
          if (isHubOrigin) {
            origin = hubCities[Math.floor(Math.random() * hubCities.length)];
            destination = cities[Math.floor(Math.random() * cities.length)];
          } else {
            origin = cities[Math.floor(Math.random() * cities.length)];
            destination = hubCities[Math.floor(Math.random() * hubCities.length)];
          }
        } else {
          // 60% chance: random route between any cities
          const [origIdx, destIdx] = [
            Math.floor(Math.random() * cities.length),
            Math.floor(Math.random() * cities.length)
          ];
          origin = cities[origIdx];
          destination = cities[destIdx];
        }
        
        // Ensure origin != destination
        if (origin === destination) {
          routeKey = ""; // Reset to force retry
          continue;
        }
        
        routeKey = `${origin}|${destination}`;
      } while (routeKey === "" || routePairs.has(routeKey));
      
      routePairs.add(routeKey);

      const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      const commodity = commodityTypes[Math.floor(Math.random() * commodityTypes.length)];
      
      // Estimate miles (rough approximation - in production you'd use a real distance API)
      const estimatedMiles = 200 + Math.floor(Math.random() * 2000);
      
      // Rate based on miles and equipment type
      const baseRate = estimatedMiles * (equipment === "reefer" ? 1.5 : equipment === "flatbed" ? 1.3 : 1.0);
      const loadboardRate = Math.round(baseRate * (0.8 + Math.random() * 0.4)); // ±20% variation
      
      // Random date within last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const hoursOffset = Math.floor(Math.random() * 24);
      const pickupDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);
      const deliveryDate = new Date(pickupDate.getTime() + (estimatedMiles / 55) * 60 * 60 * 1000); // Assume ~55mph average
      
      const weight = 20000 + Math.floor(Math.random() * 30000);
      const numPieces = 20 + Math.floor(Math.random() * 100);
      const dimensions = equipment === "flatbed" ? "48ft flatbed" : (equipment === "reefer" ? "53x102" : "48x102");
      
      sampleLoads.push({
        load_id: `LOAD-${String(i).padStart(3, "0")}`,
        origin,
        destination,
        pickup_datetime: pickupDate.getTime(),
        delivery_datetime: deliveryDate.getTime(),
        equipment_type: equipment,
        loadboard_rate: loadboardRate,
        notes: `${commodity} - ${equipment === "reefer" ? "Temperature controlled" : equipment === "flatbed" ? "Oversized load" : "Standard delivery"}`,
        weight,
        commodity_type: commodity,
        num_of_pieces: numPieces,
        miles: estimatedMiles,
        dimensions,
      });
    }

    // Insert all loads
    for (const load of sampleLoads) {
      await ctx.db.insert("loads", load);
    }

    console.log(`Seeded ${sampleLoads.length} loads successfully with ${routePairs.size} unique routes`);
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

    // Use the same generator logic as seedLoads
    const cities = [
      "Los Angeles, CA", "Phoenix, AZ", "Chicago, IL", "New York, NY", "Dallas, TX",
      "Atlanta, GA", "Seattle, WA", "Portland, OR", "Miami, FL", "Houston, TX",
      "Denver, CO", "Salt Lake City, UT", "Boston, MA", "Washington, DC", "San Francisco, CA",
      "Las Vegas, NV", "Philadelphia, PA", "Charlotte, NC", "Detroit, MI", "Indianapolis, IN",
      "San Diego, CA", "Nashville, TN", "Memphis, TN", "Sacramento, CA", "Orlando, FL",
      "Minneapolis, MN", "Kansas City, MO", "Columbus, OH", "Milwaukee, WI", "Louisville, KY",
      "Tampa, FL", "Jacksonville, FL", "Baltimore, MD", "Raleigh, NC", "Austin, TX",
      "San Antonio, TX", "Oklahoma City, OK", "Tulsa, OK", "Omaha, NE", "Wichita, KS",
      "Cleveland, OH", "Pittsburgh, PA", "Cincinnati, OH", "Buffalo, NY", "Rochester, NY",
      "Richmond, VA", "Norfolk, VA", "Greensboro, NC", "Birmingham, AL", "Jackson, MS",
      "Little Rock, AR", "Des Moines, IA", "Fargo, ND", "Sioux Falls, SD", "Rapid City, SD",
    ];

    const equipmentTypes = ["dry_van", "reefer", "flatbed"];
    const commodityTypes = [
      "Electronics", "Frozen Foods", "Steel Beams", "Furniture", "Pharmaceuticals",
      "Consumer Goods", "Paper Products", "Construction Materials", "Dairy Products",
      "Auto Parts", "Produce", "Industrial Equipment", "Appliances", "Fresh Produce",
      "Retail Goods", "Textiles", "Chemicals", "Machinery", "Food Products", "Building Supplies"
    ];

    const hubCities = ["Chicago, IL", "Dallas, TX", "Atlanta, GA", "Los Angeles, CA", "New York, NY"];

    const sampleLoads: Array<Omit<Doc<"loads">, "_id" | "_creationTime">> = [];
    
    const baseDate = new Date("2024-09-01T00:00:00.000Z");
    const routePairs = new Set<string>();
    
    for (let i = 1; i <= 100; i++) {
      let origin: string;
      let destination: string;
      let routeKey: string = "";
      
      do {
        if (Math.random() < 0.4 && hubCities.length > 0) {
          const isHubOrigin = Math.random() < 0.5;
          if (isHubOrigin) {
            origin = hubCities[Math.floor(Math.random() * hubCities.length)];
            destination = cities[Math.floor(Math.random() * cities.length)];
          } else {
            origin = cities[Math.floor(Math.random() * cities.length)];
            destination = hubCities[Math.floor(Math.random() * hubCities.length)];
          }
        } else {
          const [origIdx, destIdx] = [
            Math.floor(Math.random() * cities.length),
            Math.floor(Math.random() * cities.length)
          ];
          origin = cities[origIdx];
          destination = cities[destIdx];
        }
        
        if (origin === destination) {
          routeKey = ""; // Reset to force retry
          continue;
        }
        routeKey = `${origin}|${destination}`;
      } while (routeKey === "" || routePairs.has(routeKey));
      
      routePairs.add(routeKey);

      const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      const commodity = commodityTypes[Math.floor(Math.random() * commodityTypes.length)];
      const estimatedMiles = 200 + Math.floor(Math.random() * 2000);
      const baseRate = estimatedMiles * (equipment === "reefer" ? 1.5 : equipment === "flatbed" ? 1.3 : 1.0);
      const loadboardRate = Math.round(baseRate * (0.8 + Math.random() * 0.4));
      
      const daysAgo = Math.floor(Math.random() * 60);
      const hoursOffset = Math.floor(Math.random() * 24);
      const pickupDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);
      const deliveryDate = new Date(pickupDate.getTime() + (estimatedMiles / 55) * 60 * 60 * 1000);
      
      const weight = 20000 + Math.floor(Math.random() * 30000);
      const numPieces = 20 + Math.floor(Math.random() * 100);
      const dimensions = equipment === "flatbed" ? "48ft flatbed" : (equipment === "reefer" ? "53x102" : "48x102");
      
      sampleLoads.push({
        load_id: `LOAD-${String(i).padStart(3, "0")}`,
        origin,
        destination,
        pickup_datetime: pickupDate.getTime(),
        delivery_datetime: deliveryDate.getTime(),
        equipment_type: equipment,
        loadboard_rate: loadboardRate,
        notes: `${commodity} - ${equipment === "reefer" ? "Temperature controlled" : equipment === "flatbed" ? "Oversized load" : "Standard delivery"}`,
        weight,
        commodity_type: commodity,
        num_of_pieces: numPieces,
        miles: estimatedMiles,
        dimensions,
      });
    }

    // Insert all loads
    for (const load of sampleLoads) {
      await ctx.db.insert("loads", load);
    }

    console.log(`Seeded ${sampleLoads.length} loads successfully with ${routePairs.size} unique routes`);
    return null;
  },
});

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
