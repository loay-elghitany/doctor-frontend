import api from "./api";

// APPOINTMENTS API CALLS
export const appointmentService = {
  // Patient endpoints
  createAppointment: (doctorId, date, timeSlot, notes) =>
    api.post("/appointments", { doctorId, date, timeSlot, notes }),

  getPatientAppointments: () => api.get("/appointments"),

  chooseAppointmentTime: (appointmentId, optionIndex) =>
    api.patch(`/appointments/${appointmentId}/choose-time`, { optionIndex }),

  cancelPatientAppointment: (appointmentId) =>
    api.patch(`/appointments/${appointmentId}/cancel`),

  // Patient hide/unhide a cancelled appointment from their dashboard
  hideAppointment: (appointmentId, hidden) =>
    api.patch(`/appointments/${appointmentId}/hide`, { hidden }),

  // Doctor endpoints
  getDoctorAppointments: () => api.get("/doctor/appointments"),

  // Soft-delete a single appointment from doctor's dashboard
  softDeleteAppointment: (appointmentId) =>
    api.post(`/doctor/appointments/${appointmentId}/soft-delete`),

  // Bulk smart cleanup
  bulkCleanupAppointments: () => api.post(`/doctor/appointments/clean-old`),

  proposeRescheduleTimes: (appointmentId, rescheduleOptions) =>
    api.patch(`/doctor/appointments/${appointmentId}/propose-times`, {
      rescheduleOptions,
    }),

  updateAppointmentStatus: (appointmentId, status, date, timeSlot) =>
    api.put(`/doctor/appointments/${appointmentId}`, {
      status,
      date,
      timeSlot,
    }),

  // Doctor cancel appointment - NOW USES DELETE (backend hardening change)
  cancelDoctorAppointment: (appointmentId) =>
    api.delete(`/doctor/appointments/${appointmentId}`),

  // Doctor mark appointment as completed
  markAppointmentCompleted: (appointmentId, notes) =>
    api.post(`/doctor/appointments/${appointmentId}/mark-completed`, { notes }),

  // View endpoints
  // Fetch upcoming appointments for the authenticated patient
  getUpcomingAppointments: () => api.get("/views/appointments/upcoming"),
};

// PRESCRIPTIONS API CALLS
export const prescriptionService = {
  createPrescription: (medicines, notes) =>
    api.post("/prescriptions", { medicines, notes }),

  getPrescriptions: () => api.get("/prescriptions"),
};

// REPORTS API CALLS
export const reportService = {
  createReport: (title, description, fileUrl) =>
    api.post("/reports", { title, description, fileUrl }),

  getReports: () => api.get("/reports"),
};
