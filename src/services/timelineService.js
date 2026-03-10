import api from "./api";

/**
 * Get patient's medical timeline
 * Aggregates appointments and prescriptions in chronological order
 */
export const getPatientTimeline = async () => {
  try {
    const response = await api.get("/patient/timeline");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
