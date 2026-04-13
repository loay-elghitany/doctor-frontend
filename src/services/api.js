import axios from "axios";
import { debugLog, debugError } from "../utils/debug";

// API base configuration using Vite env (must be prefixed with VITE_)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

debugLog("api", "Initializing with base URL", { url: API_BASE_URL });

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      debugLog("api:request", "Attaching auth token", {
        method: config.method?.toUpperCase(),
        url: config.url,
        tokenPresent: true,
      });
    } else {
      debugLog("api:request", "No auth token available", {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
      console.warn("api:request - no auth token found for request", {
        method: config.method,
        url: config.url,
      });
    }

    console.log("api:request headers", {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });

    return config;
  },
  (error) => {
    debugError("api:request", "Request error", error);
    return Promise.reject(error);
  },
);

export const setupInterceptors = (logout) => {
  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => {
      debugLog("api:response", "Response received", {
        status: response.status,
        url: response.config?.url,
      });
      return response;
    },
    (error) => {
      debugError("api:response", "Response error", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
      });

      // Only logout on authentication failures, not business logic errors
      if (error.response?.status === 401) {
        const message = error.response?.data?.message || "";

        // Don't logout on business logic 401s (like "Patient not found", "Secretary not found", etc.)
        // Only logout on actual auth failures
        if (
          message.includes("not authorized") ||
          message.includes("token") ||
          message.includes("No token")
        ) {
          debugLog("api:response", "401 Auth failure - logging out");
          if (typeof logout === "function") {
            logout();
          }
        } else {
          debugLog(
            "api:response",
            "401 Business logic error - not logging out",
            { message },
          );
        }
      }
      return Promise.reject(error);
    },
  );
};

export default api;
