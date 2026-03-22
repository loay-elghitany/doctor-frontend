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
};

export default doctorService;
