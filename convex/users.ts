import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getLoggedInUserOrNull, adminQuery, adminMutation } from "./auth";
import { ConvexDBRole } from "./lib/internal_schema";
import { paginationOptsValidator } from "convex/server";
import { authenticatedMutation } from "./auth";

/*
 * Get current user info.
 *
 * RBAC: Any user can view their own information.
 * RLS: Any user can view their own information.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getLoggedInUserOrNull(ctx);
    return user;
  },
});

/*
 * Get paginated list of users.
 *
 * This query will be used to display a table with all the users in the platform.
 *
 * RBAC: Requires admin role to be executed.
 * RLS: Admins can view the full list of users.
 */
export const listUsers = adminQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Use Convex's built-in pagination
    return await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/*
 * Search users.
 *
 * RBAC: Requires admin role to be executed.
 * RLS: Admins can search for any user in the platform.
 */
export const searchUsers = adminQuery({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();

    // Note: This fetches all users and filters in memory
    // In production, you might want to implement proper search indexes
    const allUsers = await ctx.db.query("users").collect();

    return allUsers
      .filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower),
      )
      .slice(0, 50); // Limit results to prevent huge responses
  },
});

/*
 * Update user role.
 *
 * RBAC: Requires admin role to be executed.
 * RLS: Admins may modify the role of any user within the platform, except their own role.
 */
export const updateRole = adminMutation({
  args: {
    userId: v.id("users"),
    role: ConvexDBRole,
  },
  handler: async (ctx, args) => {
    // Prevent admin from changing their own role
    const currentUser = await getLoggedInUserOrNull(ctx);
    if (currentUser?._id === args.userId) {
      throw new Error("Cannot change your own role");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true };
  },
});

/*
 * Get total user count for admin dashboard.
 *
 * RBAC: Requires admin role to be executed.
 * RLS: Admins can view the total user count.
 */
export const getUserCount = adminQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

// Get role-based statistics
export const getRoleStats = adminQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const stats = {
      total: users.length,
      admin: 0,
      editor: 0,
      viewer: 0,
      unauthenticated: 0,
    };

    users.forEach((user) => {
      const role = user.role || "viewer";
      switch (role) {
        case "admin":
          stats.admin++;
          break;
        case "editor":
          stats.editor++;
          break;
        case "viewer":
          stats.viewer++;
          break;
      }
    });

    return stats;
  },
});

// Admin only: Get filtered and paginated list of users
export const getFilteredUsers = adminQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("users").order("desc");

    // If we have filters or search, we need to collect all and filter
    if (args.searchTerm?.trim() || args.roles?.length) {
      const allUsers = await query.collect();
      let filteredUsers = allUsers;

      // Apply search filter
      if (args.searchTerm?.trim()) {
        const searchLower = args.searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.name?.toLowerCase().includes(searchLower),
        );
      }

      // Apply role filter
      if (args.roles?.length) {
        filteredUsers = filteredUsers.filter((user) =>
          args.roles!.includes(user.role || "viewer"),
        );
      }

      // Manual pagination
      const startIndex = args.paginationOpts.cursor
        ? parseInt(args.paginationOpts.cursor)
        : 0;
      const endIndex = startIndex + args.paginationOpts.numItems;
      const page = filteredUsers.slice(startIndex, endIndex);

      return {
        page,
        isDone: endIndex >= filteredUsers.length,
        continueCursor:
          endIndex >= filteredUsers.length ? null : endIndex.toString(),
      };
    }

    // No filters, use efficient pagination
    return await query.paginate(args.paginationOpts);
  },
});

/**
 * Update the current user's profile
 *
 * @param args.name - The user's display name
 * @param args.phone - The user's phone number
 * @param args.image - URL to the user's profile image
 */
export const updateProfile = authenticatedMutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate phone format if provided (basic validation)
    if (args.phone && !args.phone.match(/^\+?[\d\s-()]+$/)) {
      throw new ConvexError("Invalid phone format");
    }

    // Remove empty strings and undefined values
    const updates: Partial<{
      name: string;
      phone: string;
      image: string;
    }> = {};
    if (args.name !== undefined && args.name.trim() !== "") {
      updates.name = args.name.trim();
    }
    if (args.phone !== undefined && args.phone.trim() !== "") {
      updates.phone = args.phone.trim();
    }
    if (args.image !== undefined && args.image.trim() !== "") {
      updates.image = args.image.trim();
    }

    // Only update if there are actual changes
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(ctx.user._id, updates);
    }

    return null;
  },
});
