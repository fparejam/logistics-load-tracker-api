/* Displays the user's avatar, email, role, and logout button in a dropdown menu.
 * Already added to the navigation bar in the Layout.tsx.
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getUserColor } from "@/lib/utils";
import { LogOut, Shield, Cog, Home } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { VALID_ROLES } from "@/convex/lib/internal_schema";

type UserDropdownProps = {
  className?: string;
};

export default function UserDropdown({ className }: UserDropdownProps) {
  const user = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const isLoading = user === undefined;

  if (isLoading) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  function UserAvatar({
    className,
    fallbackClassName,
  }: {
    className?: string;
    fallbackClassName?: string;
  }) {
    return (
      <Avatar className={cn("transition-all duration-200", className)}>
        {user?.image && <AvatarImage src={user.image} alt={user.email || ""} />}
        <AvatarFallback
          className={cn(
            "text-white font-medium",
            getUserColor(user?.email),
            fallbackClassName,
          )}
        >
          {user?.name?.slice(0, 1).toUpperCase() ||
            user?.email?.slice(0, 1).toUpperCase()}
          {user?.name?.split(" ")[1]?.slice(0, 1).toUpperCase() ||
            user?.email?.slice(1, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }

  const getRoleBadgeStyles = (role?: string) => {
    switch (role) {
      case VALID_ROLES.ADMIN:
        return "bg-purple-100 text-purple-700";
      case VALID_ROLES.EDITOR:
        return "bg-blue-100 text-blue-700";
      case VALID_ROLES.VIEWER:
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("focus:outline-none cursor-pointer", className)}
      >
        <UserAvatar className="size-8" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" sideOffset={8}>
        {user ? (
          <>
            <div className="flex items-start justify-between gap-3 p-2">
              <UserAvatar className="size-8" fallbackClassName="text-base" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {user.name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Badge className={cn("text-xs", getRoleBadgeStyles(user.role))}>
                {user.role || "No role"}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              <Home className="mr-2 size-4" />
              <span>Home</span>
            </DropdownMenuItem>
            {user.role === VALID_ROLES.ADMIN && (
              <DropdownMenuItem
                onClick={() => navigate("/admin")}
                className="text-muted-foreground"
              >
                <Shield className="mr-2 size-4" />
                <span>Admin Settings</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="text-muted-foreground"
            >
              <Cog className="mr-2 size-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                signOut();
              }}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4">
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
