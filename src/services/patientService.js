import api from "./api";

// PATIENT API CALLS
export const patientService = {
  // Unified patients endpoint for all roles
  getPatients: () => api.get("/patients"),
};

export default patientService;
