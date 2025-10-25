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
    origin: v.string(),
    destination: v.string(),
    pickup_datetime: v.string(), // ISO 8601 date string
    delivery_datetime: v.string(), // ISO 8601 date string
    equipment_type: v.string(), // e.g., dry_van, reefer, flatbed
    loadboard_rate: v.number(), // decimal for currency
    weight: v.number(), // integer in lbs
    commodity_type: v.string(),
    notes: v.string(), // Additional information
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
});
