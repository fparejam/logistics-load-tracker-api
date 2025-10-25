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
      if (req.query.origin) queryArgs.origin = req.query.origin as string;
      if (req.query.destination)
        queryArgs.destination = req.query.destination as string;
      if (req.query.equipment_type)
        queryArgs.equipment_type = req.query.equipment_type as string;

      // Date filters (convert ISO strings to timestamps)
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

      // Convert timestamps back to ISO strings for the response
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

  // Default to using CONVEX for API routes, prefix with /api.
  return createServer(app);
}
