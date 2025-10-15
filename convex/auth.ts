import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import {
  MutationCtx,
  query,
  QueryCtx,
  mutation,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";

import {
  customQuery,
  customCtx,
  customMutation,
  customAction,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { roleHierarchy, UserRole, VALID_ROLES } from "./lib/internal_schema";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        if (!/[a-zA-Z]/.test(password)) {
          throw new Error("Password must contain at least one letter");
        }
        if (!/[0-9]/.test(password)) {
          throw new Error("Password must contain at least one number");
        }
      },
    }),
  ],
  callbacks: {
    /**
     * This callback runs after a user signs in or updates their auth info.
     * We use it to set default permissions for new users and handle user data.
     *
     * @param ctx - Convex context for database operations
     * @param args - Contains userId and flags for new/existing users
     */
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId) return;

      const allUsers = await ctx.db.query("users").collect();
      const isFirstUser = allUsers.length === 1;

      const role = isFirstUser ? VALID_ROLES.ADMIN : VALID_ROLES.VIEWER;

      await ctx.db.patch(args.userId, { role });
    },
  },
});

/**
 * Gets the authenticated user row from the database or null if not logged in.
 * Meant to be used inside queries and mutations.
 *
 * @param ctx - Query or mutation context
 * @returns User document or null
 */
export async function getLoggedInUserOrNull(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }
  return user;
}

/**
 * Frontend query to get the current user.
 * Returns null if not authenticated.
 */
export const loggedInUser = query({
  handler: async (ctx) => {
    const user = await getLoggedInUserOrNull(ctx);
    if (!user) {
      return null;
    }
    return user;
  },
});

/**
 * Query wrapper that requires authentication. Throws if user not logged in.
 * Provides `ctx.user` containing the authenticated user document.
 *
 * @example
 * export const getUserTodos = authenticatedQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return await ctx.db.query("todos")
 *       .withIndex("by_userId", q => q.eq("userId", ctx.user._id))
 *       .collect();
 *   },
 * });
 */
export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getLoggedInUserOrNull(ctx);
    if (!user) {
      throw new ConvexError("User must be authenticated to run this query");
    }
    return { user };
  }),
);

/**
 * Mutation wrapper that requires authentication. Throws if user not logged in.
 * Provides `ctx.user` containing the authenticated user document.
 *
 * @example
 * export const createTodo = authenticatedMutation({
 *   args: { text: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("todos", {
 *       text: args.text,
 *       userId: ctx.user._id,
 *       completed: false,
 *     });
 *   },
 * });
 */
export const authenticatedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getLoggedInUserOrNull(ctx);
    if (!user) {
      throw new ConvexError("User must be authenticated to run this mutation");
    }
    return { user };
  }),
);

/**
 * Action wrapper that requires authentication. Throws if user not logged in.
 * Actions run in a different context than queries/mutations, so we need
 * to fetch user info using a query.
 *
 * @example
 * export const sendEmail = authenticatedAction({
 *   args: { message: v.string() },
 *   handler: async (ctx, args) => {
 *     const user = await ctx.runQuery(loggedInUser);
 *     await sendEmail({ to: user.email, message: args.message });
 *   },
 * });
 */
export const authenticatedAction = customAction(
  action,
  customCtx(async (ctx) => {
    // We'll use runQuery with the api.lib.auth.loggedInUser query directly
    // @ts-expect-error - This is a valid use of runQuery, the loggedInUser is defined in the convex/auth.ts
    const user = (await ctx.runQuery(internal.auth.loggedInUser)) as User;
    if (!user) {
      throw new ConvexError("User must be authenticated to run this action");
    }
    return { user };
  }),
);

/**
 * Creates a custom query wrapper that requires a specific minimum role.
 * The wrapper checks both authentication and authorization before allowing access.
 *
 * @param requiredRole - The minimum role required to access this query
 * @returns A custom query function that enforces the role requirement
 *
 * @example
 * ```typescript
 * // Create a query that only viewers and above can access
 * export const getContent = createRoleQuery(VALID_ROLES.VIEWER)({
 *   args: { contentId: v.id("content") },
 *   returns: v.object({...}),
 *   handler: async (ctx, args) => {
 *     // Only viewers, editors, and admins reach this point
 *     // ctx.user and ctx.requiredRole are available
 *     return await ctx.db.get(args.contentId);
 *   },
 * });
 * ```
 */
export const createRoleQuery = (requiredRole: UserRole) =>
  customQuery(
    query,
    customCtx(async (ctx) => {
      const user = await getLoggedInUserOrNull(ctx);
      /*
       * If the user doesn't exist, or the role is not valid, throw error
       * This handles cases where:
       * 1. The user ID is invalid or the user was deleted
       * 2. The user object doesn't have a role field
       * 3. The user's role is not one of the valid roles
       */
      if (!user) {
        throw new ConvexError("User must be authenticated to run this query");
      }
      if (!user.role || !(user.role in roleHierarchy)) {
        throw new ConvexError(
          `User does not have a valid role (required: ${requiredRole})`,
        );
      } else if (
        roleHierarchy[user.role as UserRole] < roleHierarchy[requiredRole]
      ) {
        throw new ConvexError(
          `User does not have sufficient permissions (required: ${requiredRole})`,
        );
      }
      return { user, requiredRole };
    }),
  );

/**
 * Creates a custom mutation wrapper that requires a specific minimum role.
 * The wrapper checks both authentication and authorization before allowing access.
 *
 * @param requiredRole - The minimum role required to access this mutation
 * @returns A custom mutation function that enforces the role requirement
 *
 * @example
 * ```typescript
 * // Create a mutation that only editors and admins can access
 * export const updateContent = createRoleMutation(VALID_ROLES.EDITOR)({
 *   args: { contentId: v.id("content"), newText: v.string() },
 *   returns: v.null(),
 *   handler: async (ctx, args) => {
 *     // Only editors and admins reach this point
 *     // ctx.user and ctx.requiredRole are available
 *     await ctx.db.patch(args.contentId, { text: args.newText });
 *     return null;
 *   },
 * });
 * ```
 */
export const createRoleMutation = (requiredRole: UserRole) =>
  customMutation(
    mutation,
    customCtx(async (ctx) => {
      const user = await getLoggedInUserOrNull(ctx);
      /*
       * If the user doesn't exist, or the role is not valid, throw error
       * This handles cases where:
       * 1. The user ID is invalid or the user was deleted
       * 2. The user object doesn't have a role field
       * 3. The user's role is not one of the valid roles
       */
      if (!user) {
        throw new ConvexError(
          "User must be authenticated to run this mutation",
        );
      }
      if (!user.role || !(user.role in roleHierarchy)) {
        throw new ConvexError(
          `User does not have a valid role (required: ${requiredRole})`,
        );
      } else if (
        roleHierarchy[user.role as UserRole] < roleHierarchy[requiredRole]
      ) {
        throw new ConvexError(
          `User does not have sufficient permissions (required: ${requiredRole})`,
        );
      }
      return { user, requiredRole };
    }),
  );

/**
 * Creates a custom action wrapper that requires a specific minimum role.
 * The wrapper checks both authentication and authorization before allowing access.
 *
 * @param requiredRole - The minimum role required to access this action
 * @returns A custom action function that enforces the role requirement
 *
 * @example
 * ```typescript
 * // Create an action that only admins can access
 * export const resetSystem = createRoleAction(VALID_ROLES.ADMIN)({
 *   args: {},
 *   returns: v.null(),
 *   handler: async (ctx) => {
 *     // Only admins reach this point
 *     // ctx.user and ctx.requiredRole are available
 *     await resetSystemService();
 *     return null;
 *   },
 * });
 * ```
 */
export const createRoleAction = (requiredRole: UserRole) =>
  customAction(
    action,
    customCtx(async (ctx) => {
      // Actions don't have direct db access, so we use runQuery to get user info
      // @ts-expect-error - This is a valid use of runQuery, the loggedInUser is defined in auth.ts
      const user = (await ctx.runQuery(internal.auth.loggedInUser)) as User;
      if (!user) {
        throw new ConvexError("User must be authenticated to run this action");
      }
      if (!user.role || !(user.role in roleHierarchy)) {
        throw new ConvexError(
          `User does not have a valid role (required: ${requiredRole})`,
        );
      } else if (
        roleHierarchy[user.role as UserRole] < roleHierarchy[requiredRole]
      ) {
        throw new ConvexError(
          `User does not have sufficient permissions (required: ${requiredRole})`,
        );
      }
      return { user, requiredRole };
    }),
  );

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Pre-configured query wrapper that requires admin role.
 * Equivalent to `createRoleQuery(VALID_ROLES.ADMIN)`.
 *
 * @example
 * ```typescript
 * export const deleteAllUsers = adminQuery({
 *   args: {},
 *   returns: v.null(),
 *   handler: async (ctx) => {
 *     // Only admins can access this
 *     const users = await ctx.db.query("users").collect();
 *     for (const user of users) {
 *       await ctx.db.delete(user._id);
 *     }
 *     return null;
 *   },
 * });
 * ```
 */
export const adminQuery = createRoleQuery(VALID_ROLES.ADMIN);
export const editorQuery = createRoleQuery(VALID_ROLES.EDITOR);
export const viewerQuery = createRoleQuery(VALID_ROLES.VIEWER);

/**
 * Pre-configured mutation wrapper that requires editor role or higher.
 * Equivalent to `createRoleMutation(VALID_ROLES.EDITOR)`.
 *
 * @example
 * ```typescript
 * export const updateContent = editorMutation({
 *   args: { contentId: v.id("content"), updates: v.object({...}) },
 *   returns: v.null(),
 *   handler: async (ctx, args) => {
 *     // Editors and admins can update content
 *     await ctx.db.patch(args.contentId, args.updates);
 *     return null;
 *   },
 * });
 * ```
 */
export const adminMutation = createRoleMutation(VALID_ROLES.ADMIN);
export const editorMutation = createRoleMutation(VALID_ROLES.EDITOR);
export const viewerMutation = createRoleMutation(VALID_ROLES.VIEWER);

/**
 * Pre-configured action wrapper that requires viewer role or higher.
 * Equivalent to `createRoleAction(VALID_ROLES.VIEWER)`.
 *
 * @example
 * ```typescript
 * export const downloadContent = viewerAction({
 *   args: { contentId: v.id("content") },
 *   returns: v.string(),
 *   handler: async (ctx, args) => {
 *     // All authenticated users can download content
 *     return await generateDownloadLink(args.contentId);
 *   },
 * });
 * ```
 */
export const adminAction = createRoleAction(VALID_ROLES.ADMIN);
export const editorAction = createRoleAction(VALID_ROLES.EDITOR);
export const viewerAction = createRoleAction(VALID_ROLES.VIEWER);
