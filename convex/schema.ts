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
    .index("by_outcome", ["outcome_tag"]),
});
