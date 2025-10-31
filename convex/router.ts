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
      load_id?: string;
      origin?: string;
      destination?: string;
      equipment_type?: string;
      pickup_from?: number;
      pickup_to?: number;
      delivery_from?: number;
      delivery_to?: number;
      min_rate?: number;
      max_rate?: number;
      limit?: number;
      offset?: number;
      sort_by?: "pickup_datetime" | "loadboard_rate";
      sort_order?: "asc" | "desc";
    } = {};

    // String filters - decode URL-encoded values
    if (params.has("load_id")) queryArgs.load_id = decodeURIComponent(params.get("load_id")!);
    if (params.has("origin")) queryArgs.origin = decodeURIComponent(params.get("origin")!);
    if (params.has("destination")) queryArgs.destination = decodeURIComponent(params.get("destination")!);
    if (params.has("equipment_type")) queryArgs.equipment_type = decodeURIComponent(params.get("equipment_type")!);

    // Date filters - convert ISO strings to timestamps
    if (params.has("pickup_from")) {
      const date = new Date(params.get("pickup_from")!);
      if (!isNaN(date.getTime())) {
        queryArgs.pickup_from = date.getTime();
      }
    }
    if (params.has("pickup_to")) {
      const date = new Date(params.get("pickup_to")!);
      if (!isNaN(date.getTime())) {
        queryArgs.pickup_to = date.getTime();
      }
    }
    if (params.has("delivery_from")) {
      const date = new Date(params.get("delivery_from")!);
      if (!isNaN(date.getTime())) {
        queryArgs.delivery_from = date.getTime();
      }
    }
    if (params.has("delivery_to")) {
      const date = new Date(params.get("delivery_to")!);
      if (!isNaN(date.getTime())) {
        queryArgs.delivery_to = date.getTime();
      }
    }

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

      // Convert timestamps to ISO 8601 strings for the response
      const formattedItems = result.items.map((item) => ({
        ...item,
        pickup_datetime: new Date(item.pickup_datetime).toISOString(),
        delivery_datetime: new Date(item.delivery_datetime).toISOString(),
      }));

      return new Response(
        JSON.stringify({
          items: formattedItems,
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
      console.error("❌ [GET /loads] Error querying loads:", error);
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

/**
 * POST /call-metrics - Create a new call metric
 * Requires X-API-Key header for authentication
 */
http.route({
  path: "/call-metrics",
  method: "POST",
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

    try {
      // Parse request body
      const body = await req.json();

      // Validate required fields
      const requiredFields = [
        "agent_name",
        "equipment_type",
        "outcome_tag",
        "sentiment_tag",
        "negotiation_rounds",
        "loadboard_rate",
      ];
      for (const field of requiredFields) {
        if (!(field in body)) {
          return new Response(
            JSON.stringify({
              error: "Validation error",
              details: `Missing required field: ${field}`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Validate outcome_tag
      const validOutcomes = [
        "won_transferred",
        "no_agreement_price",
        "no_fit_found",
      ];
      if (!validOutcomes.includes(body.outcome_tag)) {
        return new Response(
          JSON.stringify({
            error: "Validation error",
            details: `Invalid outcome_tag. Must be one of: ${validOutcomes.join(", ")}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate sentiment_tag
      const validSentiments = [
        "very_positive",
        "positive",
        "neutral",
        "negative",
        "very_negative",
      ];
      if (!validSentiments.includes(body.sentiment_tag)) {
        return new Response(
          JSON.stringify({
            error: "Validation error",
            details: `Invalid sentiment_tag. Must be one of: ${validSentiments.join(", ")}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate final_rate logic
      if (body.outcome_tag === "won_transferred") {
        if (body.final_rate === null || body.final_rate === undefined) {
          return new Response(
            JSON.stringify({
              error: "Validation error",
              details: "final_rate must be provided when outcome_tag is 'won_transferred'",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else {
        // For non-wins, final_rate must be null
        if (body.final_rate !== null && body.final_rate !== undefined) {
          return new Response(
            JSON.stringify({
              error: "Validation error",
              details: "final_rate must be null when outcome_tag is not 'won_transferred'",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Generate timestamp automatically
      const timestamp = new Date().toISOString();

      // Call the Convex mutation
      const id = await ctx.runMutation(api.call_metrics.createCallMetric, {
        timestamp_utc: timestamp,
        agent_name: body.agent_name.trim(),
        equipment_type: body.equipment_type.trim(),
        outcome_tag: body.outcome_tag,
        sentiment_tag: body.sentiment_tag,
        negotiation_rounds: body.negotiation_rounds,
        loadboard_rate: body.loadboard_rate,
        final_rate: body.outcome_tag === "won_transferred" ? body.final_rate : null,
        related_load_id: body.related_load_id ?? null,
        rejected_rate: body.rejected_rate ?? null,
        loads_offered: body.loads_offered ?? null,
      });

      return new Response(
        JSON.stringify({
          id,
          message: "Call metric created successfully",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ [POST /call-metrics] Error creating call metric:", error);
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
