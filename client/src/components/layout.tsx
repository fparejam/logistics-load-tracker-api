import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import UserDropdown from "@/components/user-dropdown";
import { Globe } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/50 backdrop-blur-sm">
        <nav className="flex items-center justify-between p-1.5 md:max-w-[1200px] mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              {/* TODO: Edit the icon and app title  */}
              <Globe className="size-5 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">
                App Title
              </span>
            </button>
          </div>
          <UserDropdown />
        </nav>
      </header>
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
