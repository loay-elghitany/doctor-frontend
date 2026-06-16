import React, { Suspense } from "react";
import { i18nReady } from "./i18n";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { SocketProvider } from "./context/SocketContext";
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

const root = ReactDOM.createRoot(document.getElementById("root"));

i18nReady.then(() => {
  root.render(
    <React.StrictMode>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        }
      >
        <ErrorBoundary>
          <AdminAuthProvider>
            <AuthProvider>
              <SocketProvider>
                <AppRoutes />
                <Toaster
                  position="top-left"
                  richColors
                  closeButton
                  style={{ direction: "rtl" }}
                />
              </SocketProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </ErrorBoundary>
      </Suspense>
    </React.StrictMode>,
  );
});
