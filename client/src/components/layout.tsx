import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/50 backdrop-blur-sm">
        <nav className="flex items-center justify-between py-3 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Brand */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <img src="/og-image.png" alt="ACME Logo" className="h-6 w-auto object-contain" />
            <span className="text-base font-medium text-foreground">
              ACME Logistics
            </span>
          </button>
        </nav>
      </header>
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
