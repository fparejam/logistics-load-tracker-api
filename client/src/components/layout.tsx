import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserDropdown from "@/components/user-dropdown";
import { Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/50 backdrop-blur-sm">
        <nav className="flex items-center justify-between p-1.5 md:max-w-[1600px] mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <Globe className="size-5 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">
                ACME Logistics
              </span>
            </button>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <BarChart3 className="mr-2 size-4" />
                Dashboard
              </Button>
            </div>
          </div>
          <UserDropdown />
        </nav>
      </header>
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
