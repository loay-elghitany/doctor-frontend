import { normalizeStatus } from "./appointmentStatus.js";

// Helper function to safely parse dates
export const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Helper function to format dates safely
export const formatDate = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return "—";

  return `${parsed.toLocaleDateString("ar-EG", { calendar: "gregory", year: "numeric", month: "short", day: "numeric" })} ${parsed.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
};

// Helper function to format time only safely
export const formatTime = (date) => {
  const parsed = parseDate(date);
  if (!parsed) return "—";

  return parsed.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function to check if date is in the past
export const isPastDate = (date) => {
  const parsed = parseDate(date);
  return parsed ? parsed < new Date() : false;
};

// Helper function to get status label
export const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    scheduled: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    no_show: "No Show",
    reschedule_proposed: "Reschedule Proposed",
    unknown: "Unknown",
  };
  return labels[normalizeStatus(status)] || String(status || "Unknown");
};

// Helper function to get status color class
export const getStatusColorClass = (status) => {
  const colors = {
    pending: "badge-pending",
    confirmed: "badge-confirmed",
    scheduled: "badge-confirmed",
    completed: "badge-completed",
    cancelled: "badge-cancelled",
    rejected: "badge-rejected",
    no_show: "badge-no-show",
    reschedule_proposed: "badge-reschedule-proposed",
  };

  return colors[normalizeStatus(status)] || "badge-pending";
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || "An unexpected error occurred";
};

// Helper function to safely parse JWT tokens
export const parseJwtToken = (token) => {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

// Helper function to store auth token
export const setAuthToken = (token) => {
  localStorage.setItem("token", token);
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem("token");
};

const ADMIN_TOKEN_KEY = "admin_token";
const LEGACY_ADMIN_TOKEN_KEY = "adminToken";

// Helper function to store admin token separately
export const setAdminToken = (token) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

// Helper function to get admin token
export const getAdminToken = () => {
  return (
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY)
  );
};

// Helper function to clear admin token
export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};
