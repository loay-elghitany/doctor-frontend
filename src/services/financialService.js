import api from "./api";

const financialService = {
  getPatientSummary: (patientId) => api.get(`/financials/patients/${patientId}/summary`),
  getMySummary: () => api.get("/financials/my-summary"),
  createTreatmentPlan: (payload) => api.post("/financials/plans", payload),
  updateTreatmentPlan: (planId, payload) => api.put(`/financials/plans/${planId}`, payload),
  deleteTreatmentPlan: (planId) => api.delete(`/financials/plans/${planId}`),
  createPayment: (payload) => api.post("/financials/payments", payload),
  getPatientPayments: (patientId) => api.get(`/financials/patients/${patientId}/payments`),
};

export default financialService;
