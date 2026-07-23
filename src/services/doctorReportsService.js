import api from "./api";

export const doctorReportsService = {
  getDashboard: async (range = "today", clinicSlug = "") => {
    const resolvedClinicSlug =
      clinicSlug || localStorage.getItem("clinicSlug") || "";

    return api.get("/doctors/reports/dashboard", {
      params: { range },
      headers: resolvedClinicSlug
        ? { "X-Clinic-Slug": resolvedClinicSlug }
        : undefined,
    });
  },
};

export default doctorReportsService;
