import { v } from "convex/values";
import { ConvexDBRole } from "./internal_schema";
import { adminMutation } from "../auth";
import { ConvexError } from "convex/values";

/**
 * Mutation to update any user's role within the admin's organization.
 *
 * RBAC: Only admins can update user roles.
 * RLS: Admins may modify the role of any user within the platform.
 *
 * @throws ConvexError if user is not signed in, not an admin, or target user not found
 *
 * @example
 * // In your React component, conditionally render this by checking the user's role
 * const updateUserRole = useMutation(api.lib.roles.updateUserRole);
 * await updateUserRole({ userId: "user123", role: "editor" });
 */
export const updateUserRole = adminMutation({
  args: {
    userId: v.id("users"),
    role: ConvexDBRole,
  },
  handler: async (ctx, args) => {
    // Get the target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError(
        "The user who you are trying to update was not found",
      );
    }

    // Update the target user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});
