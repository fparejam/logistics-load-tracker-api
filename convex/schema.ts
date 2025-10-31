import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { OutcomeTag, SentimentTag } from "./types";

export default defineSchema({
  /* APPLICATION TABLES */
  
  loads: defineTable({
    load_id: v.string(), // Unique identifier for the load
    origin: v.string(), // Starting location
    destination: v.string(), // Delivery location
    pickup_datetime: v.number(), // Date and time for pickup (UTC timestamp)
    delivery_datetime: v.number(), // Date and time for delivery (UTC timestamp)
    equipment_type: v.string(), // Type of equipment needed
    loadboard_rate: v.number(), // Listed rate for the load
    notes: v.string(), // Additional information
    weight: v.number(), // Load weight
    commodity_type: v.string(), // Type of goods
    num_of_pieces: v.number(), // Number of items
    miles: v.number(), // Distance to travel
    dimensions: v.string(), // Size measurements
  })
    .index("by_origin", ["origin"])
    .index("by_destination", ["destination"])
    .index("by_equipment_type", ["equipment_type"])
    .index("by_pickup_datetime", ["pickup_datetime"])
    .index("by_delivery_datetime", ["delivery_datetime"])
    .index("by_loadboard_rate", ["loadboard_rate"]),

  // Call metrics table for ACME Dashboard
  call_metrics: defineTable({
    timestamp_utc: v.string(), // ISO string
    agent_name: v.string(),
    equipment_type: v.string(),
    related_load_id: v.optional(v.union(v.string(), v.null())),
    outcome_tag: v.union(
      v.literal(OutcomeTag.WonTransferred),
      v.literal(OutcomeTag.NoAgreementPrice),
      v.literal(OutcomeTag.NoFitFound)
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
    rejected_rate: v.optional(v.union(v.number(), v.null())),
    loads_offered: v.optional(v.union(v.number(), v.null())),
  })
    .index("by_timestamp", ["timestamp_utc"])
    .index("by_agent", ["agent_name"])
    .index("by_equipment", ["equipment_type"])
    .index("by_outcome", ["outcome_tag"]) 
    .index("by_related_load", ["related_load_id"]),
  
  // Geospatial points linked to loads and call_metrics
  geo_points: defineTable({
    entity_type: v.union(v.literal("load"), v.literal("call")),
    entity_id: v.string(),
    role: v.union(v.literal("origin"), v.literal("destination"), v.literal("point")),
    lng: v.number(),
    lat: v.number(),
    geohash: v.string(),
    country: v.union(v.string(), v.null()),
    state: v.union(v.string(), v.null()),
    city: v.union(v.string(), v.null()),
    timestamp_utc: v.string(),
    extras: v.optional(v.any()),
  })
    .index("by_entity", ["entity_type", "entity_id"]) 
    .index("by_role", ["entity_type", "role"]) 
    .index("by_time", ["timestamp_utc"]) 
    .index("by_geohash", ["geohash"]),

  // Pre-computed map points for fast rendering
  // Updated incrementally when calls are created
  map_loads_points: defineTable({
    call_id: v.string(), // ID of the call_metrics document
    load_id: v.string(), // related_load_id
    lng: v.number(),
    lat: v.number(),
    equipment: v.string(), // equipment_type from call
    loadboard_rate: v.number(),
    final_rate: v.union(v.number(), v.null()),
    agent_name: v.string(),
    timestamp_utc: v.string(),
    // Additional metadata for tooltips/filtering
    origin_city: v.union(v.string(), v.null()),
    origin_state: v.union(v.string(), v.null()),
  })
    .index("by_call_id", ["call_id"])
    .index("by_load_id", ["load_id"])
    .index("by_timestamp", ["timestamp_utc"]),
});
