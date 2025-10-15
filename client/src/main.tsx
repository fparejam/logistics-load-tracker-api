import { Toaster } from "@/components/ui/sonner";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { convex } from "./convex";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
      <Toaster richColors position="bottom-right" />
    </ConvexAuthProvider>
  </React.StrictMode>,
);
