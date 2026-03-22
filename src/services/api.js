import axios from "axios";
import { debugLog, debugError } from "../utils/debug";

// API base configuration using Vite env (must be prefixed with VITE_)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

debugLog("api", "Initializing with base URL", { url: API_BASE_URL });

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setupInterceptors = (logout) => {
  // Add request interceptor to attach token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      debugLog("api:request", "Outgoing request", {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
      });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      debugError("api:request", "Request error", error);
      return Promise.reject(error);
    },
  );

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
      if (error.response?.status === 401) {
        debugLog("api:response", "401 Unauthorized - logging out");
        logout();
      }
      return Promise.reject(error);
    },
  );
};

export default api;
