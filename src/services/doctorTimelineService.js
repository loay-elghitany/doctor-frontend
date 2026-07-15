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
  const trimmedNote = String(noteContent || "").trim();
  if (!patientId || !trimmedNote) {
    throw new Error("Missing patientId or noteContent before API call");
  }

  try {
    const response = await api.post(
      `/doctor/patients/${patientId}/timeline-note`,
      {
        patientId,
        noteContent: trimmedNote,
        appointmentId: appointmentId || null,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a doctor's timeline note event
 */
export const updateDoctorTimelineNote = async (eventId, noteContent) => {
  const trimmedNote = String(noteContent || "").trim();
  if (!eventId || !trimmedNote) {
    throw new Error("Missing eventId or noteContent before API call");
  }

  try {
    const response = await api.put(`/doctors/timeline/notes/${eventId}`, {
      noteContent: trimmedNote,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
