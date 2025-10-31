/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as call_metrics from "../call_metrics.js";
import type * as geo_points from "../geo_points.js";
import type * as http from "../http.js";
import type * as loads from "../loads.js";
import type * as map_points from "../map_points.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  call_metrics: typeof call_metrics;
  geo_points: typeof geo_points;
  http: typeof http;
  loads: typeof loads;
  map_points: typeof map_points;
  router: typeof router;
  seed: typeof seed;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
