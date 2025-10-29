import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NotFound from "./pages/not-found";
import AcmeDashboard from "./pages/acme-dashboard";

export function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route redirects to ACME Dashboard */}
          <Route path="/" element={<Navigate to="/acme-dashboard" replace />} />

          {/* ACME Dashboard page - main dashboard */}
          <Route path="/acme-dashboard" element={<AcmeDashboard />} />

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/acme-dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
