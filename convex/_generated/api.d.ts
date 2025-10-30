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
import type * as auth from "../auth.js";
import type * as call_metrics from "../call_metrics.js";
import type * as http from "../http.js";
import type * as lib_internal_schema from "../lib/internal_schema.js";
import type * as lib_roles from "../lib/roles.js";
import type * as loads from "../loads.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  call_metrics: typeof call_metrics;
  http: typeof http;
  "lib/internal_schema": typeof lib_internal_schema;
  "lib/roles": typeof lib_roles;
  loads: typeof loads;
  router: typeof router;
  seed: typeof seed;
  types: typeof types;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
