import api from "./api";

// Create a new prescription (Doctor only)
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await api.post("/prescriptions", prescriptionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all prescriptions created by a doctor (Doctor only)
export const getDoctorPrescriptions = async () => {
  try {
    const response = await api.get("/prescriptions/doctor");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get prescriptions for a specific appointment (Doctor or Patient)
export const getAppointmentPrescriptions = async (appointmentId, userRole) => {
  try {
    const endpoint =
      userRole === "doctor"
        ? `/prescriptions/appointment/${appointmentId}/doctor`
        : `/prescriptions/appointment/${appointmentId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a prescription (Doctor only)
export const deletePrescription = async (prescriptionId) => {
  try {
    const response = await api.delete(`/prescriptions/${prescriptionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
