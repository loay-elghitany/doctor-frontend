import React from "react";
import ReactDOM from "react-dom/client";
import { AppRoutes } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
