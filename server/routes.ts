import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // All routes should be prefixed with /api
  // DO NOT MODIFY THIS: API Health Check
  app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
  });

  // Default to using CONVEX for API routes, prefix with /api.
  return createServer(app);
}
