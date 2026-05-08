import api from "./api";
import { parseJwtToken, getAuthToken } from "../utils/helpers";

export const getPatientScannedPrescriptions = (patientId, params = {}) => {
  // Parse user role from JWT token
  const token = getAuthToken();
  const tokenPayload = parseJwtToken(token);
  const userRole = tokenPayload?.role?.toLowerCase();

  // Doctors use doctor-specific endpoint, secretaries/patients use shared endpoint
  const endpoint =
    userRole === "doctor"
      ? `/doctors/patients/${patientId}/scanned-prescriptions`
      : `/patients/${patientId}/scanned-prescriptions`;

  return api.get(endpoint, { params });
};

const scannedPrescriptionService = {
  uploadScannedPrescription: (patientId, file, notes = "") => {
    const formData = new FormData();
    formData.append("patientId", patientId);
    if (notes) {
      formData.append("notes", notes);
    }
    formData.append("file", file);

    for (let [key, value] of formData.entries()) {
      console.log(`FormData Entry - ${key}:`, value);
    }

    return api.post("/secretaries/prescriptions/upload", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
  },

  getPatientScannedPrescriptions,

  getDoctorScannedPrescriptions: (params = {}) =>
    api.get("/doctors/scanned-prescriptions", { params }),

  deleteScannedPrescription: (prescriptionId) =>
    api.delete(`/patients/scanned-prescriptions/${prescriptionId}`),
};

export default scannedPrescriptionService;
