import type { Express } from "express";
import { createServer, type Server } from "http";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL environment variable is not set");
}

const convex = new ConvexHttpClient(convexUrl);

export async function registerRoutes(app: Express): Promise<Server> {
  // All routes should be prefixed with /api
  // DO NOT MODIFY THIS: API Health Check
  app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
  });

  // Load Management API - GET /loads
  app.get("/loads", async (req, res) => {
    try {
      // Check API key
      const apiKey = req.headers["x-api-key"];
      const expectedApiKey = process.env.API_KEY;

      if (!expectedApiKey) {
        return res.status(500).json({
          error: "Server configuration error: API_KEY not set",
        });
      }

      if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({
          error: "Unauthorized: Invalid or missing API key",
        });
      }

      // Parse query parameters
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

      // String filters
      if (req.query.load_id) queryArgs.load_id = req.query.load_id as string;
      if (req.query.origin) queryArgs.origin = req.query.origin as string;
      if (req.query.destination)
        queryArgs.destination = req.query.destination as string;
      if (req.query.equipment_type)
        queryArgs.equipment_type = req.query.equipment_type as string;

      // Date filters - convert ISO strings to timestamps
      if (req.query.pickup_from) {
        const date = new Date(req.query.pickup_from as string);
        if (!isNaN(date.getTime())) {
          queryArgs.pickup_from = date.getTime();
        }
      }
      if (req.query.pickup_to) {
        const date = new Date(req.query.pickup_to as string);
        if (!isNaN(date.getTime())) {
          queryArgs.pickup_to = date.getTime();
        }
      }
      if (req.query.delivery_from) {
        const date = new Date(req.query.delivery_from as string);
        if (!isNaN(date.getTime())) {
          queryArgs.delivery_from = date.getTime();
        }
      }
      if (req.query.delivery_to) {
        const date = new Date(req.query.delivery_to as string);
        if (!isNaN(date.getTime())) {
          queryArgs.delivery_to = date.getTime();
        }
      }

      // Rate filters
      if (req.query.min_rate) {
        const minRate = parseFloat(req.query.min_rate as string);
        if (!isNaN(minRate)) {
          queryArgs.min_rate = minRate;
        }
      }
      if (req.query.max_rate) {
        const maxRate = parseFloat(req.query.max_rate as string);
        if (!isNaN(maxRate)) {
          queryArgs.max_rate = maxRate;
        }
      }

      // Pagination
      if (req.query.limit) {
        const limit = parseInt(req.query.limit as string);
        if (!isNaN(limit) && limit > 0) {
          queryArgs.limit = Math.min(limit, 100); // Cap at 100
        }
      }
      if (req.query.offset) {
        const offset = parseInt(req.query.offset as string);
        if (!isNaN(offset) && offset >= 0) {
          queryArgs.offset = offset;
        }
      }

      // Sorting
      if (req.query.sort_by) {
        const sortBy = req.query.sort_by as string;
        if (sortBy === "pickup_datetime" || sortBy === "loadboard_rate") {
          queryArgs.sort_by = sortBy;
        }
      }
      if (req.query.sort_order) {
        const sortOrder = req.query.sort_order as string;
        if (sortOrder === "asc" || sortOrder === "desc") {
          queryArgs.sort_order = sortOrder;
        }
      }

      // Call the Convex query
      const result = await convex.query(api.loads.listLoads, queryArgs);

      // Convert timestamps to ISO 8601 strings for the response
      const formattedItems = result.items.map((item) => ({
        ...item,
        pickup_datetime: new Date(item.pickup_datetime).toISOString(),
        delivery_datetime: new Date(item.delivery_datetime).toISOString(),
      }));

      res.json({
        items: formattedItems,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error) {
      console.error("Error querying loads:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Call Metrics API - POST /call-metrics
  app.post("/call-metrics", async (req, res) => {
    try {
      // Check API key
      const apiKey = req.headers["x-api-key"];
      const expectedApiKey = process.env.API_KEY;

      if (!expectedApiKey) {
        return res.status(500).json({
          error: "Server configuration error: API_KEY not set",
        });
      }

      if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({
          error: "Unauthorized: Invalid or missing API key",
        });
      }

      // Validate request body
      const body = req.body;
      if (!body || typeof body !== "object") {
        return res.status(400).json({
          error: "Validation error",
          details: "Request body must be a JSON object",
        });
      }

      // Required fields
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
          return res.status(400).json({
            error: "Validation error",
            details: `Missing required field: ${field}`,
          });
        }
      }

      // Validate outcome_tag
      const validOutcomes = [
        "won_transferred",
        "no_agreement_price",
        "no_fit_found",
      ];
      if (!validOutcomes.includes(body.outcome_tag)) {
        return res.status(400).json({
          error: "Validation error",
          details: `Invalid outcome_tag. Must be one of: ${validOutcomes.join(", ")}`,
        });
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
        return res.status(400).json({
          error: "Validation error",
          details: `Invalid sentiment_tag. Must be one of: ${validSentiments.join(", ")}`,
        });
      }

      // Validate final_rate logic
      if (body.outcome_tag === "won_transferred") {
        if (body.final_rate === null || body.final_rate === undefined) {
          return res.status(400).json({
            error: "Validation error",
            details: "final_rate must be provided when outcome_tag is 'won_transferred'",
          });
        }
        if (typeof body.final_rate !== "number" || body.final_rate <= 0) {
          return res.status(400).json({
            error: "Validation error",
            details: "final_rate must be a positive number when outcome_tag is 'won_transferred'",
          });
        }
      } else {
        // For non-wins, final_rate must be null
        if (body.final_rate !== null && body.final_rate !== undefined) {
          return res.status(400).json({
            error: "Validation error",
            details: "final_rate must be null when outcome_tag is not 'won_transferred'",
          });
        }
      }

      // Validate other fields
      if (typeof body.agent_name !== "string" || body.agent_name.trim() === "") {
        return res.status(400).json({
          error: "Validation error",
          details: "agent_name must be a non-empty string",
        });
      }

      if (typeof body.equipment_type !== "string" || body.equipment_type.trim() === "") {
        return res.status(400).json({
          error: "Validation error",
          details: "equipment_type must be a non-empty string",
        });
      }

      if (
        typeof body.negotiation_rounds !== "number" ||
        body.negotiation_rounds < 0 ||
        !Number.isInteger(body.negotiation_rounds)
      ) {
        return res.status(400).json({
          error: "Validation error",
          details: "negotiation_rounds must be a non-negative integer",
        });
      }

      if (typeof body.loadboard_rate !== "number" || body.loadboard_rate <= 0) {
        return res.status(400).json({
          error: "Validation error",
          details: "loadboard_rate must be a positive number",
        });
      }

      // Validate optional fields if provided
      if (body.rejected_rate !== null && body.rejected_rate !== undefined) {
        if (typeof body.rejected_rate !== "number" || body.rejected_rate <= 0) {
          return res.status(400).json({
            error: "Validation error",
            details: "rejected_rate must be a positive number if provided",
          });
        }
      }

      if (body.loads_offered !== null && body.loads_offered !== undefined) {
        if (
          typeof body.loads_offered !== "number" ||
          body.loads_offered < 0 ||
          !Number.isInteger(body.loads_offered)
        ) {
          return res.status(400).json({
            error: "Validation error",
            details: "loads_offered must be a non-negative integer if provided",
          });
        }
      }

      // Generate timestamp automatically (don't allow client to set it)
      const timestamp = new Date().toISOString();

      // Call the Convex mutation
      const id = await convex.mutation(api.call_metrics.createCallMetric, {
        timestamp_utc: timestamp,
        agent_name: body.agent_name.trim(),
        equipment_type: body.equipment_type.trim(),
        outcome_tag: body.outcome_tag,
        sentiment_tag: body.sentiment_tag,
        negotiation_rounds: body.negotiation_rounds,
        loadboard_rate: body.loadboard_rate,
        final_rate: body.outcome_tag === "won_transferred" ? body.final_rate : null,
        rejected_rate: body.rejected_rate ?? null,
        loads_offered: body.loads_offered ?? null,
      });

      res.status(201).json({
        id,
        message: "Call metric created successfully",
      });
    } catch (error) {
      console.error("Error creating call metric:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Default to using CONVEX for API routes, prefix with /api.
  return createServer(app);
}
