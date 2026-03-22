import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create a new prescription (Doctor only)
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/prescriptions`,
      prescriptionData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all prescriptions created by a doctor (Doctor only)
export const getDoctorPrescriptions = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/prescriptions/doctor`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get prescriptions for a specific appointment (Doctor or Patient)
export const getAppointmentPrescriptions = async (appointmentId, userRole) => {
  try {
    let endpoint = "";

    if (userRole === "doctor") {
      endpoint = `${API_BASE_URL}/api/prescriptions/appointment/${appointmentId}/doctor`;
    } else {
      endpoint = `${API_BASE_URL}/api/prescriptions/appointment/${appointmentId}`;
    }

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete a prescription (Doctor only)
export const deletePrescription = async (prescriptionId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/prescriptions/${prescriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
