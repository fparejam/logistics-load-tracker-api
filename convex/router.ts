import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * GET /loads - Retrieve loads with filtering, pagination, and sorting
 * Requires X-API-Key header for authentication
 */
http.route({
  path: "/loads",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    // Check API key
    const apiKey = req.headers.get("X-API-Key");
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error: API_KEY not set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized: Invalid or missing API key",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const params = url.searchParams;

    // Build query arguments
    const queryArgs: {
      origin?: string;
      destination?: string;
      equipment_type?: string;
      pickup_from?: string;
      pickup_to?: string;
      delivery_from?: string;
      delivery_to?: string;
      min_rate?: number;
      max_rate?: number;
      limit?: number;
      offset?: number;
      sort_by?: "pickup_datetime" | "loadboard_rate";
      sort_order?: "asc" | "desc";
    } = {};

    // String filters
    if (params.has("origin")) queryArgs.origin = params.get("origin")!;
    if (params.has("destination")) queryArgs.destination = params.get("destination")!;
    if (params.has("equipment_type")) queryArgs.equipment_type = params.get("equipment_type")!;

    // Date filters (pass ISO 8601 strings directly)
    if (params.has("pickup_from")) queryArgs.pickup_from = params.get("pickup_from")!;
    if (params.has("pickup_to")) queryArgs.pickup_to = params.get("pickup_to")!;
    if (params.has("delivery_from")) queryArgs.delivery_from = params.get("delivery_from")!;
    if (params.has("delivery_to")) queryArgs.delivery_to = params.get("delivery_to")!;

    // Rate filters
    if (params.has("min_rate")) {
      const minRate = parseFloat(params.get("min_rate")!);
      if (!isNaN(minRate)) {
        queryArgs.min_rate = minRate;
      }
    }
    if (params.has("max_rate")) {
      const maxRate = parseFloat(params.get("max_rate")!);
      if (!isNaN(maxRate)) {
        queryArgs.max_rate = maxRate;
      }
    }

    // Pagination
    if (params.has("limit")) {
      const limit = parseInt(params.get("limit")!);
      if (!isNaN(limit) && limit > 0) {
        queryArgs.limit = Math.min(limit, 100); // Cap at 100
      }
    }
    if (params.has("offset")) {
      const offset = parseInt(params.get("offset")!);
      if (!isNaN(offset) && offset >= 0) {
        queryArgs.offset = offset;
      }
    }

    // Sorting
    if (params.has("sort_by")) {
      const sortBy = params.get("sort_by")!;
      if (sortBy === "pickup_datetime" || sortBy === "loadboard_rate") {
        queryArgs.sort_by = sortBy;
      }
    }
    if (params.has("sort_order")) {
      const sortOrder = params.get("sort_order")!;
      if (sortOrder === "asc" || sortOrder === "desc") {
        queryArgs.sort_order = sortOrder;
      }
    }

    try {
      // Call the query
      const result = await ctx.runQuery(api.loads.listLoads, queryArgs);

      // Dates are already in ISO 8601 format, return directly
      return new Response(
        JSON.stringify({
          items: result.items,
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error querying loads:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
