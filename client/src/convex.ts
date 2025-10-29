import { ConvexReactClient } from "convex/react";

// Support both build-time (Vite) and runtime (injected) Convex URL
// Runtime injection allows us to use Fly.io secrets without rebuilding
const convexUrl = 
  import.meta.env.VITE_CONVEX_URL || 
  (typeof window !== "undefined" && (window as any).__CONVEX_URL__);

if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Please add it to your .env file or ensure it's injected at runtime. You can get this value by running `npx convex dev`",
  );
}

export const convex = new ConvexReactClient(convexUrl);
