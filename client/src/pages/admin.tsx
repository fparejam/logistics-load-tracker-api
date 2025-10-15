import { useState, useEffect } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useDebounce } from "@uidotdev/usehooks";
import { api } from "@/convex/_generated/api";
import { useQueryWithStatus } from "@/lib/hooks";
import { Layout } from "@/components/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  AlertCircle,
  Copy,
} from "lucide-react";
import { VALID_ROLES } from "@/convex/lib/internal_schema";
import { Id } from "@/convex/_generated/dataModel";
import { cn, getUserColor } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type SortField = "name" | "email" | "role";
type SortDirection = "asc" | "desc";

type User = {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email?: string;
  role?: string;
  image?: string;
  emailVerificationTime?: number;
  phone?: string;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
}

function StatsCard({ title, value, icon, className }: StatsCardProps) {
  return (
    <div className="rounded-xl p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-medium text-foreground">{value}</p>
        </div>
        {icon && <div className={cn("p-2 rounded-lg", className)}>{icon}</div>}
      </div>
    </div>
  );
}

interface RoleFilterDropdownProps {
  selectedRoles: string[];
  onRoleChange: (roles: string[]) => void;
  onSort: () => void;
  getSortIcon: () => React.ReactNode;
}

const ROLES = [
  { value: VALID_ROLES.ADMIN, label: "Admin", color: "bg-purple-500" },
  { value: VALID_ROLES.EDITOR, label: "Editor", color: "bg-blue-500" },
  { value: VALID_ROLES.VIEWER, label: "Viewer", color: "bg-gray-500" },
] as const;

function RoleFilterDropdown({
  selectedRoles,
  onRoleChange,
  onSort,
  getSortIcon,
}: RoleFilterDropdownProps) {
  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      onRoleChange(selectedRoles.filter((r) => r !== role));
    } else {
      onRoleChange([...selectedRoles, role]);
    }
  };

  const allSelected = selectedRoles.length === ROLES.length;
  const hasFilters = selectedRoles.length < 3;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSort}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors"
      >
        Role
        {getSortIcon()}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "size-5 p-0 hover:bg-muted transition-colors",
              hasFilters && "bg-blue-50 hover:bg-blue-100",
            )}
          >
            <ChevronDown
              className={cn(
                "size-3",
                hasFilters ? "text-blue-600" : "text-gray-400",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">
            Filter by Role
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onRoleChange(ROLES.map((r) => r.value));
              } else {
                onRoleChange([]);
              }
            }}
            className="font-medium"
          >
            All Roles
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {ROLES.map((role) => (
            <DropdownMenuCheckboxItem
              key={role.value}
              checked={selectedRoles.includes(role.value)}
              onCheckedChange={() => handleRoleToggle(role.value)}
            >
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", role.color)} />
                {role.label}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          {hasFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => onRoleChange(ROLES.map((r) => r.value))}
                className="text-muted-foreground text-sm"
              >
                Clear Filters
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
interface UserRowProps {
  user: User;
  currentUserId?: string;
  onRoleUpdate: (userId: Id<"users">, newRole: string) => void;
}

function UserRow({ user, currentUserId, onRoleUpdate }: UserRowProps) {
  const getRoleBadgeStyles = (role?: string) => {
    switch (role) {
      case VALID_ROLES.ADMIN:
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      case VALID_ROLES.EDITOR:
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case VALID_ROLES.VIEWER:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const isCurrentUser = currentUserId === user._id;

  return (
    <TableRow className="h-8">
      <TableCell className="py-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-gray-200 flex-shrink-0">
            <AvatarImage
              src={user.image}
              alt={user.name || "User"}
              className="object-cover"
            />
            <AvatarFallback
              className={cn(
                "text-sm font-medium text-white",
                getUserColor(user.email),
              )}
            >
              {getUserInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm truncate">
                {user.name || "Unnamed User"}
              </span>
              {isCurrentUser && <Badge variant="outline">You</Badge>}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2">
        <div className="group flex items-center gap-1 max-w-full">
          <span className="text-sm font-mono text-muted-foreground truncate">
            {user._id.slice(0, 8)}...
          </span>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(user._id);
                toast("ID copied to clipboard");
              } catch (err) {
                toast.error("Failed to copy ID");
              }
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded flex-shrink-0"
            title="Copy full ID"
          >
            <Copy className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground py-2">
        <span className="truncate block">{user.email || "No email"}</span>
      </TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          {isCurrentUser ? (
            <Badge
              className={cn(
                "text-xs font-medium border cursor-default",
                getRoleBadgeStyles(user.role),
              )}
            >
              {user.role || "viewer"}
            </Badge>
          ) : (
            <Select
              value={user.role || "viewer"}
              onValueChange={(value) => onRoleUpdate(user._id, value)}
            >
              <SelectTrigger className="h-8 w-24 text-xs border-none text-muted-foreground border border-border hover:bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VALID_ROLES.ADMIN}>Admin</SelectItem>
                <SelectItem value={VALID_ROLES.EDITOR}>Editor</SelectItem>
                <SelectItem value={VALID_ROLES.VIEWER}>Viewer</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right py-2">
        <span className="text-xs">
          {formatDistanceToNow(new Date(user._creationTime), {
            addSuffix: true,
          })}
        </span>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    VALID_ROLES.ADMIN,
    VALID_ROLES.EDITOR,
    VALID_ROLES.VIEWER,
  ]);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const roleStats = useQueryWithStatus(api.users.getRoleStats);
  const currentUser = useQueryWithStatus(api.users.me);
  const updateRole = useMutation(api.users.updateRole);

  const { results, status, loadMore } = usePaginatedQuery(
    api.users.listUsers,
    {},
    { initialNumItems: 15 },
  );

  const searchResults = useQueryWithStatus(
    api.users.searchUsers,
    isSearching && debouncedSearchTerm.trim()
      ? { searchTerm: debouncedSearchTerm }
      : "skip",
  );

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm]);

  const handleRoleUpdate = async (userId: Id<"users">, newRole: string) => {
    try {
      await updateRole({
        userId,
        role: newRole as (typeof VALID_ROLES)[keyof typeof VALID_ROLES],
      });
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error("Failed to update user role");
      console.error("Role update error:", error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 text-gray-700" />
    ) : (
      <ArrowDown className="h-4 w-4 text-gray-700" />
    );
  };

  const getRolePriority = (role?: string) => {
    switch (role) {
      case VALID_ROLES.ADMIN:
        return 3;
      case VALID_ROLES.EDITOR:
        return 2;
      case VALID_ROLES.VIEWER:
        return 1;
      default:
        return 0;
    }
  };

  const sortedUsers = (() => {
    const users = isSearching ? searchResults.data : results;
    if (!users) return [];

    let filteredUsers = users;
    if (selectedRoles.length < 3) {
      filteredUsers = users.filter((user) =>
        selectedRoles.includes(user.role || "viewer"),
      );
    }

    return [...filteredUsers].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name": {
          const nameA = (a.name || a.email || "").toLowerCase();
          const nameB = (b.name || b.email || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "email": {
          const emailA = (a.email || "").toLowerCase();
          const emailB = (b.email || "").toLowerCase();
          comparison = emailA.localeCompare(emailB);
          break;
        }
        case "role": {
          comparison = getRolePriority(a.role) - getRolePriority(b.role);
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  })();

  const isLoading = isSearching
    ? searchResults.isPending
    : status === "LoadingFirstPage";
  const hasFilters = isSearching || selectedRoles.length < 3;

  if (roleStats.isError || currentUser.isError || searchResults.isError) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Error Loading Data
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {roleStats.error?.message ||
                currentUser.error?.message ||
                searchResults.error?.message ||
                "An error occurred while loading the admin panel"}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-foreground tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roleStats.isPending ? (
            // Skeleton loading state for stats
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-muted rounded-xl p-6 w-full min-h-[120px] h-full animate-pulse"
                />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total Users"
                value={roleStats.data?.total ?? 0}
              />
              <StatsCard
                title="Admins"
                value={roleStats.data?.admin ?? 0}
                className="bg-emerald-50"
              />
              <StatsCard
                title="Editors"
                value={roleStats.data?.editor ?? 0}
                className="bg-blue-50"
              />
              <StatsCard title="Viewers" value={roleStats.data?.viewer ?? 0} />
            </>
          )}
        </div>
        {/* Users Table */}
        <div>
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-base font-medium text-foreground mb-2">
                Users
              </h2>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer transition-colors w-[30%]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    User
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground transition-colors w-[15%]">
                  ID
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer transition-colors w-[25%]"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-2">
                    Email
                    {getSortIcon("email")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground transition-colors w-[20%]">
                  <RoleFilterDropdown
                    selectedRoles={selectedRoles}
                    onRoleChange={setSelectedRoles}
                    onSort={() => handleSort("role")}
                    getSortIcon={() => getSortIcon("role")}
                  />
                </TableHead>
                <TableHead className="text-xs truncate font-medium text-muted-foreground h-12 text-right w-[10%]">
                  Joined At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading users...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="size-10 text-muted-foreground" />
                      <div>
                        <p className="text-base font-medium text-foreground">
                          No users found
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    currentUserId={currentUser.data?._id}
                    onRoleUpdate={handleRoleUpdate}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {sortedUsers && sortedUsers.length > 0 && (
          <div className="px-6 py-4 min-h-[4rem] flex items-center">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">{sortedUsers.length}</span> users
                {hasFilters && (
                  <span className="text-muted-foreground"> (filtered)</span>
                )}
              </p>
              <div className="flex items-center gap-3">
                {!isSearching && status === "CanLoadMore" && (
                  <Button
                    onClick={() => loadMore(15)}
                    variant="outline"
                    size="sm"
                    className="text-sm border-border hover:bg-white"
                  >
                    Load more
                  </Button>
                )}
                {!isSearching && status === "LoadingMore" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
