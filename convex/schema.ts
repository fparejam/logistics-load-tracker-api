import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { getInternalSchema } from "./lib/internal_schema";

export default defineSchema({
  /*
   * CAPITAL: DO NOT MODIFY THIS SECTION
   * INTERNAL AUTH SCHEMA
   */
  ...getInternalSchema(),

  /* APPLICATION TABLES
   *
   * These are the tables that are used by the application, feel free to delete
   * them as you see fit.
   */
  /* ADD ANY NEW TABLES HERE */
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

  // Carrier call analytics table
  carrier_calls: defineTable({
    call_date: v.number(), // UTC timestamp
    agent_name: v.string(),
    equipment_type: v.string(), // dry_van, reefer, flatbed
    origin_city: v.string(),
    origin_state: v.string(),
    destination_city: v.string(),
    destination_state: v.string(),
    outcome: v.string(), // won_transferred, no_agreement_price, no_fit_found, ineligible, other
    negotiation_rounds: v.number(),
    listed_rate: v.optional(v.number()),
    final_rate: v.optional(v.number()),
    sentiment_score: v.number(), // -2 to +2
    call_duration_seconds: v.optional(v.number()),
  })
    .index("by_call_date", ["call_date"])
    .index("by_agent", ["agent_name"])
    .index("by_equipment", ["equipment_type"])
    .index("by_outcome", ["outcome"]),

  // Call metrics table for ACME Dashboard
  call_metrics: defineTable({
    timestamp_utc: v.string(), // ISO string
    agent_name: v.string(),
    equipment_type: v.string(),
    outcome_tag: v.union(
      v.literal("won_transferred"),
      v.literal("no_agreement_price"),
      v.literal("no_fit_found"),
      v.literal("ineligible"),
      v.literal("other")
    ),
    sentiment_tag: v.union(
      v.literal("very_positive"),
      v.literal("positive"),
      v.literal("neutral"),
      v.literal("negative"),
      v.literal("very_negative")
    ),
    negotiation_rounds: v.number(),
    loadboard_rate: v.number(),
    final_rate: v.union(v.number(), v.null()),
  })
    .index("by_timestamp", ["timestamp_utc"])
    .index("by_agent", ["agent_name"])
    .index("by_equipment", ["equipment_type"])
    .index("by_outcome", ["outcome_tag"]),
});
