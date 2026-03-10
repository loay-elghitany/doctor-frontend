// Helper function to format dates
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Helper function to format time only
export const formatTime = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Helper function to check if date is in the past
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Helper function to get status label
export const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    no_show: "No Show",
    reschedule_proposed: "Reschedule Proposed",
  };
  return labels[status] || status;
};

// Helper function to get status color class
export const getStatusColorClass = (status) => {
  const colors = {
    pending: "badge-pending",
    confirmed: "badge-confirmed",
    scheduled: "badge-scheduled",
    completed: "badge-completed",
    cancelled: "badge-cancelled",
    rejected: "badge-rejected",
    no_show: "badge-no-show",
    reschedule_proposed: "badge-reschedule-proposed",
  };
  return colors[status] || "badge-pending";
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || "An unexpected error occurred";
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

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};
