import api from "./api";

/**
 * Get complete medical timeline for a specific patient
 * Doctor endpoint - shows all events for patient
 */
export const getDoctorPatientTimeline = async (patientId) => {
  try {
    const response = await api.get(`/doctor/patients/${patientId}/timeline`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Add a doctor note to patient timeline
 */
export const addDoctorNote = async (
  patientId,
  noteContent,
  appointmentId = null,
) => {
  try {
    const response = await api.post(
      `/doctor/patients/${patientId}/timeline-note`,
      {
        noteContent,
        appointmentId,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
