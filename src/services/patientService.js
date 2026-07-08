import api from "./api";

// PATIENT API CALLS
export const patientService = {
  // Unified patients endpoint for all roles
  getPatients: (params = {}) => api.get("/patients", { params }),
  getPatientById: (patientId) => api.get(`/patients/${patientId}`),
};

export default patientService;
