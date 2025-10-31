import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * Query to get load routes (origin to destination pairs) for successful loads only
 */
export const getLoadsRoutes = query({
  args: {
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    equipment: v.optional(v.string()),
    agent_name: v.optional(v.string()),
    outcome_tag: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Get all successful calls (won_transferred)
    let allCalls = await ctx.db
      .query("call_metrics")
      .filter((q) => q.eq(q.field("outcome_tag"), "won_transferred"))
      .collect();
    
    // Filter to only calls with a related_load_id (handle both null and undefined)
    let calls = allCalls.filter((c) => c.related_load_id != null && c.related_load_id !== "");
    
    // Apply all filters
    calls = calls.filter((c) => {
      // Date filters
      if (args.start_date || args.end_date) {
        if (args.start_date && c.timestamp_utc < args.start_date) return false;
        if (args.end_date && c.timestamp_utc > args.end_date) return false;
      }
      
      // Equipment filter
      if (args.equipment && args.equipment !== "all" && c.equipment_type !== args.equipment) {
        return false;
      }
      
      // Agent filter
      if (args.agent_name && args.agent_name !== "all" && c.agent_name !== args.agent_name) {
        return false;
      }
      
      // Outcome filter (only won_transferred are in this query anyway)
      if (args.outcome_tag && args.outcome_tag !== "all" && args.outcome_tag !== "won_transferred") {
        return false;
      }
      
      return true;
    });
    
    // Get unique load IDs from successful calls
    const loadIds = Array.from(new Set(calls.map((c) => c.related_load_id).filter((id): id is string => id !== null && id !== undefined)));
    
    // Get geo_points for these loads
    const allPoints = await ctx.db
      .query("geo_points")
      .withIndex("by_entity", (q) => q.eq("entity_type", "load"))
      .collect();
    
    // Filter to only points for successful loads and group by load_id
    const pointsByLoad = new Map<string, { origin?: typeof allPoints[number]; destination?: typeof allPoints[number] }>();
    
    for (const point of allPoints) {
      if (!loadIds.includes(point.entity_id)) continue;
      
      if (!pointsByLoad.has(point.entity_id)) {
        pointsByLoad.set(point.entity_id, {});
      }
      const loadData = pointsByLoad.get(point.entity_id)!;
      if (point.role === "origin") {
        loadData.origin = point;
      } else if (point.role === "destination") {
        loadData.destination = point;
      }
    }
    
    // Create route pairs for loads that have both origin and destination
    const routes: Array<{
      load_id: string;
      origin: { lng: number; lat: number; city: string; state: string };
      destination: { lng: number; lat: number; city: string; state: string };
      equipment_type?: string;
      loadboard_rate?: number;
      miles?: number;
    }> = [];
    
    for (const loadId of loadIds) {
      const loadPoints = pointsByLoad.get(loadId);
      if (!loadPoints?.origin || !loadPoints?.destination) continue;
      
      routes.push({
        load_id: loadId,
        origin: {
          lng: loadPoints.origin.lng,
          lat: loadPoints.origin.lat,
          city: loadPoints.origin.city || "",
          state: loadPoints.origin.state || "",
        },
        destination: {
          lng: loadPoints.destination.lng,
          lat: loadPoints.destination.lat,
          city: loadPoints.destination.city || "",
          state: loadPoints.destination.state || "",
        },
        equipment_type: (loadPoints.origin.extras as any)?.equipment_type,
        loadboard_rate: (loadPoints.origin.extras as any)?.loadboard_rate,
        miles: (loadPoints.origin.extras as any)?.miles,
      });
    }
    
    return routes;
  },
});


/**
 * City coordinates lookup for major US cities
 * Format: "City, ST" -> { lat, lng, city, state }
 */
const CITY_COORDINATES: Record<string, { lat: number; lng: number; city: string; state: string }> = {
  "Los Angeles, CA": { lat: 34.0522, lng: -118.2437, city: "Los Angeles", state: "CA" },
  "Phoenix, AZ": { lat: 33.4484, lng: -112.0740, city: "Phoenix", state: "AZ" },
  "Chicago, IL": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL" },
  "New York, NY": { lat: 40.7128, lng: -74.0060, city: "New York", state: "NY" },
  "Dallas, TX": { lat: 32.7767, lng: -96.7970, city: "Dallas", state: "TX" },
  "Atlanta, GA": { lat: 33.7490, lng: -84.3880, city: "Atlanta", state: "GA" },
  "Seattle, WA": { lat: 47.6062, lng: -122.3321, city: "Seattle", state: "WA" },
  "Portland, OR": { lat: 45.5152, lng: -122.6784, city: "Portland", state: "OR" },
  "Miami, FL": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
  "Houston, TX": { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
  "Denver, CO": { lat: 39.7392, lng: -104.9903, city: "Denver", state: "CO" },
  "Salt Lake City, UT": { lat: 40.7608, lng: -111.8910, city: "Salt Lake City", state: "UT" },
  "Boston, MA": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
  "Washington, DC": { lat: 38.9072, lng: -77.0369, city: "Washington", state: "DC" },
  "San Francisco, CA": { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA" },
  "Las Vegas, NV": { lat: 36.1699, lng: -115.1398, city: "Las Vegas", state: "NV" },
  "Philadelphia, PA": { lat: 39.9526, lng: -75.1652, city: "Philadelphia", state: "PA" },
  "Charlotte, NC": { lat: 35.2271, lng: -80.8431, city: "Charlotte", state: "NC" },
  "Detroit, MI": { lat: 42.3314, lng: -83.0458, city: "Detroit", state: "MI" },
  "Indianapolis, IN": { lat: 39.7684, lng: -86.1581, city: "Indianapolis", state: "IN" },
  "San Diego, CA": { lat: 32.7157, lng: -117.1611, city: "San Diego", state: "CA" },
  "Nashville, TN": { lat: 36.1627, lng: -86.7816, city: "Nashville", state: "TN" },
  "Memphis, TN": { lat: 35.1495, lng: -90.0490, city: "Memphis", state: "TN" },
  "Sacramento, CA": { lat: 38.5816, lng: -121.4944, city: "Sacramento", state: "CA" },
  "Orlando, FL": { lat: 28.5383, lng: -81.3792, city: "Orlando", state: "FL" },
  "Minneapolis, MN": { lat: 44.9778, lng: -93.2650, city: "Minneapolis", state: "MN" },
  "Kansas City, MO": { lat: 39.0997, lng: -94.5786, city: "Kansas City", state: "MO" },
  "Columbus, OH": { lat: 39.9612, lng: -82.9988, city: "Columbus", state: "OH" },
  "Milwaukee, WI": { lat: 43.0389, lng: -87.9065, city: "Milwaukee", state: "WI" },
  "Louisville, KY": { lat: 38.2527, lng: -85.7585, city: "Louisville", state: "KY" },
  "Tampa, FL": { lat: 27.9506, lng: -82.4572, city: "Tampa", state: "FL" },
  "Jacksonville, FL": { lat: 30.3322, lng: -81.6557, city: "Jacksonville", state: "FL" },
  "Baltimore, MD": { lat: 39.2904, lng: -76.6122, city: "Baltimore", state: "MD" },
  "Raleigh, NC": { lat: 35.7796, lng: -78.6382, city: "Raleigh", state: "NC" },
  "Austin, TX": { lat: 30.2672, lng: -97.7431, city: "Austin", state: "TX" },
  "San Antonio, TX": { lat: 29.4241, lng: -98.4936, city: "San Antonio", state: "TX" },
  "Oklahoma City, OK": { lat: 35.4676, lng: -97.5164, city: "Oklahoma City", state: "OK" },
  "Tulsa, OK": { lat: 36.1540, lng: -95.9928, city: "Tulsa", state: "OK" },
  "Omaha, NE": { lat: 41.2565, lng: -95.9345, city: "Omaha", state: "NE" },
  "Wichita, KS": { lat: 37.6872, lng: -97.3301, city: "Wichita", state: "KS" },
  "Cleveland, OH": { lat: 41.4993, lng: -81.6944, city: "Cleveland", state: "OH" },
  "Pittsburgh, PA": { lat: 40.4406, lng: -79.9959, city: "Pittsburgh", state: "PA" },
  "Cincinnati, OH": { lat: 39.1031, lng: -84.5120, city: "Cincinnati", state: "OH" },
  "Buffalo, NY": { lat: 42.8864, lng: -78.8784, city: "Buffalo", state: "NY" },
  "Rochester, NY": { lat: 43.1566, lng: -77.6088, city: "Rochester", state: "NY" },
  "Richmond, VA": { lat: 37.5407, lng: -77.4360, city: "Richmond", state: "VA" },
  "Norfolk, VA": { lat: 36.8468, lng: -76.2852, city: "Norfolk", state: "VA" },
  "Greensboro, NC": { lat: 36.0726, lng: -79.7920, city: "Greensboro", state: "NC" },
  "Birmingham, AL": { lat: 33.5207, lng: -86.8025, city: "Birmingham", state: "AL" },
  "Jackson, MS": { lat: 32.2988, lng: -90.1848, city: "Jackson", state: "MS" },
  "Little Rock, AR": { lat: 34.7465, lng: -92.2896, city: "Little Rock", state: "AR" },
  "Des Moines, IA": { lat: 41.5868, lng: -93.6250, city: "Des Moines", state: "IA" },
  "Fargo, ND": { lat: 46.8772, lng: -96.7898, city: "Fargo", state: "ND" },
  "Sioux Falls, SD": { lat: 43.5446, lng: -96.7311, city: "Sioux Falls", state: "SD" },
  "Rapid City, SD": { lat: 44.0805, lng: -103.2310, city: "Rapid City", state: "SD" },
};

/**
 * Simple geohash generation based on lat/lng
 */
function generateGeohash(lat: number, lng: number): string {
  const latStr = lat.toFixed(4);
  const lngStr = lng.toFixed(4);
  return `${latStr}_${lngStr}`.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Internal mutation to seed geo_points from loads
 */
export const seedGeoPointsFromLoads = internalMutation({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({
    processed: v.number(),
    originPoints: v.number(),
    destinationPoints: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if we already have geo_points (unless force is true)
    if (!args.force) {
      const existingPoints = await ctx.db.query("geo_points").take(1);
      if (existingPoints.length > 0) {
        return { processed: 0, originPoints: 0, destinationPoints: 0, skipped: 0 };
      }
    } else {
      // Clear existing geo_points for loads
      const existing = await ctx.db
        .query("geo_points")
        .withIndex("by_entity", (q) => q.eq("entity_type", "load"))
        .collect();
      for (const point of existing) {
        await ctx.db.delete(point._id);
      }
    }

    // Get all loads
    const loads = await ctx.db.query("loads").collect();
    if (loads.length === 0) {
      return { processed: 0, originPoints: 0, destinationPoints: 0, skipped: 0 };
    }

    let originCount = 0;
    let destCount = 0;
    let skipped = 0;

    for (const load of loads) {
      const timestamp = new Date(load.pickup_datetime).toISOString();

      // Process origin
      const originCoords = CITY_COORDINATES[load.origin];
      if (originCoords) {
        const geohash = generateGeohash(originCoords.lat, originCoords.lng);
        await ctx.db.insert("geo_points", {
          entity_type: "load",
          entity_id: load.load_id,
          role: "origin",
          lng: originCoords.lng,
          lat: originCoords.lat,
          geohash: geohash,
          country: "US",
          state: originCoords.state,
          city: originCoords.city,
          timestamp_utc: timestamp,
          extras: {
            equipment_type: load.equipment_type,
            loadboard_rate: load.loadboard_rate,
          },
        });
        originCount++;
      } else {
        skipped++;
      }

      // Process destination
      const destCoords = CITY_COORDINATES[load.destination];
      if (destCoords) {
        const geohash = generateGeohash(destCoords.lat, destCoords.lng);
        const destTimestamp = new Date(load.delivery_datetime).toISOString();
        await ctx.db.insert("geo_points", {
          entity_type: "load",
          entity_id: load.load_id,
          role: "destination",
          lng: destCoords.lng,
          lat: destCoords.lat,
          geohash: geohash,
          country: "US",
          state: destCoords.state,
          city: destCoords.city,
          timestamp_utc: destTimestamp,
          extras: {
            equipment_type: load.equipment_type,
            loadboard_rate: load.loadboard_rate,
          },
        });
        destCount++;
      } else {
        skipped++;
      }
    }

    return {
      processed: loads.length,
      originPoints: originCount,
      destinationPoints: destCount,
      skipped,
    };
  },
});


