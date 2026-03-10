import api from "./api";

/**
 * Admin API service for manual subscription management
 * All endpoints require ADMIN_SECRET_TOKEN authentication
 * Token should be passed in Authorization header: Bearer <token>
 *
 * IMPORTANT: This service uses fetch directly and returns responses in the format:
 * { success: true/false, message: string, data: {...} }
 */

// Helper to create admin API instance with token
// FIX: Proper error handling for fetch (must check response.ok before parsing JSON)
const createAdminApi = (token) => {
  return {
    // FIX: Handle network errors and non-2xx status codes properly
    get: (url) =>
      fetch(`${import.meta.env.VITE_API_URL || "/api"}${url}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          // FIX: Must check response.ok to handle error status codes
          if (!res.ok) {
            // Parse error response
            return res.json().then((data) => {
              throw {
                status: res.status,
                ...data,
              };
            });
          }
          return res.json();
        })
        .catch((error) => {
          // Handle network errors and parsing errors
          console.error("[adminService.get]Error:", error);
          throw error;
        }),

    // FIX: Handle network errors and non-2xx status codes properly
    post: (url, data) =>
      fetch(`${import.meta.env.VITE_API_URL || "/api"}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          // FIX: Must check response.ok to handle error status codes
          if (!res.ok) {
            // Parse error response
            return res.json().then((data) => {
              throw {
                status: res.status,
                ...data,
              };
            });
          }
          return res.json();
        })
        .catch((error) => {
          // Handle network errors and parsing errors
          console.error("[adminService.post] Error:", error);
          throw error;
        }),
  };
};

export const createAdminService = (token) => ({
  // Create a new doctor account
  createDoctor: (name, email, clinicSlug, password, phone) => {
    const adminApi = createAdminApi(token);
    const payload = {
      name,
      email,
      clinicSlug,
      password,
    };

    // include phoneNumber only when provided
    if (phone) payload.phoneNumber = phone;

    return adminApi.post("/admin/create-doctor", payload);
  },

  // Deactivate (pause) a doctor subscription
  deactivateDoctor: (doctorId, reason) => {
    const adminApi = createAdminApi(token);
    return adminApi.post(`/admin/deactivate-doctor/${doctorId}`, { reason });
  },

  // Reactivate a previously deactivated doctor
  reactivateDoctor: (doctorId) => {
    const adminApi = createAdminApi(token);
    return adminApi.post(`/admin/reactivate-doctor/${doctorId}`);
  },

  // List all doctors with status
  getAllDoctors: () => {
    const adminApi = createAdminApi(token);
    return adminApi.get("/admin/doctors");
  },

  // Get detailed subscription info for a specific doctor
  getDoctorSubscriptionInfo: (doctorId) => {
    const adminApi = createAdminApi(token);
    return adminApi.get(`/admin/doctors/${doctorId}`);
  },

  // Permanently delete a doctor account (DANGEROUS)
  deleteDoctorPermanent: (doctorId, confirmDelete = true) => {
    const adminApi = createAdminApi(token);
    return adminApi.post(`/admin/delete-doctor/${doctorId}`, { confirmDelete });
  },
});
