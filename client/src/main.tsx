import { Toaster } from "@/components/ui/sonner";
import { ConvexProvider } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { convex } from "./convex";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
      <Toaster richColors position="bottom-right" />
    </ConvexProvider>
  </React.StrictMode>,
);
