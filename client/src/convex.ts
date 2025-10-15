import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL is not set. Please add it to your .env file. You can get this value by running `npx convex dev`",
  );
}

export const convex = new ConvexReactClient(convexUrl);
