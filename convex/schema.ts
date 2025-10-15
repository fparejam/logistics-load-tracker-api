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
  // TODO: remove this table
  dummy: defineTable({
    name: v.string(),
  }),
});
