import React from "react";
import ReactDOM from "react-dom/client";
import { AppRoutes } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Production debugging - log environment and configuration
if (import.meta.env.PROD) {
  console.log("=== PRODUCTION ENVIRONMENT DETECTED ===");
  console.log("Current hostname:", window.location.hostname);
  console.log(
    "Target API URL:",
    import.meta.env.VITE_API_BASE_URL || "NOT SET",
  );
  console.log("Main domain:", import.meta.env.VITE_MAIN_DOMAIN || "NOT SET");
  console.log("Protocol:", window.location.protocol);
  console.log("=======================================");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AdminAuthProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
