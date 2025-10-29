import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { VALID_ROLES } from "@/convex/lib/internal_schema";
import Index from "@/pages";
import { LoginPage } from "@/pages/login-screen";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/admin";
import { LoadingLoginScreen } from "./pages/loading-login-screen";
import NotFound from "./pages/not-found";
import ProfilePage from "./pages/profile";
import Dashboard from "./pages/dashboard";
import AcmeDashboard from "./pages/acme-dashboard";
import ApiTester from "./pages/api-tester";

function AuthenticatedRouter() {
  const currentUser = useQuery(api.users.me);

  // Show loading spinner while fetching user data
  if (currentUser === undefined) {
    return <LoadingLoginScreen />;
  }

  const isAdmin = currentUser?.role === VALID_ROLES.ADMIN;

  return (
    <BrowserRouter>
      <Routes>
        {/* Main page */}
        <Route path="/" element={<Index />} />

        {/* API Tester page */}
        <Route path="/api-tester" element={<ApiTester />} />

        {/* Dashboard page - accessible to all authenticated users */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ACME Dashboard page - accessible to all authenticated users */}
        <Route path="/acme-dashboard" element={<AcmeDashboard />} />

        {/* Profile page - accessible to all authenticated users */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin route - only accessible to admins */}
        <Route
          path="/admin"
          element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <AuthLoading>
        <LoadingLoginScreen />
      </AuthLoading>
      <Authenticated>
        <AuthenticatedRouter />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
    </TooltipProvider>
  );
}
