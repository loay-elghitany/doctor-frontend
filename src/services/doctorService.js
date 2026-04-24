import api from "./api";

/**
 * Doctor service - handles doctor-related API calls
 * Used for: fetching doctor list, doctor profile, scheduling
 */
const doctorService = {
  // Get all doctors (for patient booking flow)
  getAllDoctors: () => api.get("/doctors"),

  // Get doctor profile (authenticated doctor only)
  getDoctorProfile: () => api.get("/doctors/me"),

  // Get doctor schedule/availability (future)
  getDoctorSchedule: (doctorId) => api.get(`/doctors/${doctorId}/schedule`),

  // Public profile for landing page (explicit clinicSlug query from frontend)
  getPublicProfile: (clinicSlug) => {
    const slug = clinicSlug ? String(clinicSlug).trim() : "";
    const query = slug ? `?clinicSlug=${encodeURIComponent(slug)}` : "";
    return api.get(`/doctors/public-profile${query}`);
  },

  // Update current doctor's clinic profile settings
  updateClinicProfile: (payload) => api.put("/doctors/clinic-profile", payload),
};

export default doctorService;
