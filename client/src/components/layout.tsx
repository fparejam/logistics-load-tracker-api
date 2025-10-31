import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/50 backdrop-blur-sm">
        <nav className="flex items-center justify-start py-3 px-3 w-full">
          {/* Logo and Brand */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <img src="/og-image.png" alt="ACME Logo" className="h-6 w-auto object-contain" />
          </button>

          <button
            onClick={() => navigate("/acme-dashboard")}
            className="px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-100 rounded-md"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/acme-map")}
            className="px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-100 rounded-md"
          >
            Map
          </button>
          <button
            onClick={() => navigate("/acme-report")}
            className="px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-100 rounded-md"
          >
            Report
          </button>
        </nav>
      </header>
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
