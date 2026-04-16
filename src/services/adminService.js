import api from "./api";

export const createAdminService = (token) => {
  if (token) {
    localStorage.setItem("admin_token", token);
  }

  return {
    createDoctor: (name, email, clinicSlug, password, phone) => {
      const payload = {
        name,
        email,
        clinicSlug,
        password,
      };

      if (phone) payload.phoneNumber = phone;
      return api.post("/admin/create-doctor", payload);
    },

    deactivateDoctor: (doctorId, reason) =>
      api.post(`/admin/deactivate-doctor/${doctorId}`, { reason }),

    reactivateDoctor: (doctorId) =>
      api.post(`/admin/reactivate-doctor/${doctorId}`),

    getAllDoctors: () => api.get("/admin/doctors"),

    getDoctorSubscriptionInfo: (doctorId) =>
      api.get(`/admin/doctors/${doctorId}`),

    deleteDoctorPermanent: (doctorId, confirmDelete = true) =>
      api.post(`/admin/delete-doctor/${doctorId}`, { confirmDelete }),

    getAnalytics: (params) => api.get("/admin/analytics", { params }),
    getAnalyticsTrends: (params) =>
      api.get("/admin/analytics/trends", { params }),
    exportAnalytics: (params) =>
      api.get("/admin/analytics/export", { params, responseType: "blob" }),

    getNotifications: (params) => api.get("/admin/notifications", { params }),
    getNotificationStats: (params) =>
      api.get("/admin/notifications/stats", { params }),
    retryNotifications: () => api.post("/admin/notifications/retry"),
    exportNotifications: (params) =>
      api.get("/admin/notifications/export", { params, responseType: "blob" }),
  };
};
