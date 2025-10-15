/*
 * Internal schema for the application.
 * This is the internal schema for the auth tables.
 *
 * RULES:
 * a) AVOID MODIFYING THIS FILE.
 * b) DO NOT ADD QUERIES OR MUTATIONS TO THIS FILE, ONLY TYPE DEFINITIONS ARE ALLOWED.
 * c) DO NOT IMPORT FROM OTHER FILES, THE LOGIC MUST BE SELF CONTAINED IN THIS FILE.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const VALID_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type UserRole = (typeof VALID_ROLES)[keyof typeof VALID_ROLES];

// Role hierarchy - higher numbers mean more permissions.
export const roleHierarchy: Record<UserRole, number> = {
  [VALID_ROLES.ADMIN]: 300,
  [VALID_ROLES.EDITOR]: 200,
  [VALID_ROLES.VIEWER]: 100,
};

/**
 * Check if a user has the required permission level
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if the user has sufficient permissions
 */
export function checkUserPermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export const ConvexDBRole = v.union(
  v.literal(VALID_ROLES.VIEWER),
  v.literal(VALID_ROLES.EDITOR),
  v.literal(VALID_ROLES.ADMIN),
);

/*
 * Internal schema for the application.
 * This is the internal schema for the auth tables.
 * DO NOT MODIFY THIS SECTION
 */
export function getInternalSchema() {
  return {
    ...authTables,
    /*
     * Replace the default users table from authTables so we can add our own fields
     * New fields must be optional as they are not known when the user is created
     * from the Oauth Provider.
     */
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.float64()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.float64()),
      isAnonymous: v.optional(v.boolean()),
      // User role for RBAC.
      role: v.optional(ConvexDBRole),
    }),
  };
}
