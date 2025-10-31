import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AcmeDashboard from "./pages/acme-dashboard";
import AcmeMap from "./pages/acme-map";
import AcmeReport from "./pages/acme-report";

export function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route redirects to ACME Dashboard */}
          <Route path="/" element={<Navigate to="/acme-dashboard" replace />} />

          {/* ACME Dashboard page - main dashboard */}
          <Route path="/acme-dashboard" element={<AcmeDashboard />} />
          {/* ACME Map */}
          <Route path="/acme-map" element={<AcmeMap />} />
          {/* ACME Report */}
          <Route path="/acme-report" element={<AcmeReport />} />

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/acme-dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
