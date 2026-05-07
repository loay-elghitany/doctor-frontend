import api from "./api";

const scannedPrescriptionService = {
  uploadScannedPrescription: (patientId, file, notes = "") => {
    const formData = new FormData();
    formData.append("patientId", patientId);
    if (notes) {
      formData.append("notes", notes);
    }
    formData.append("file", file);

    return api.post("/secretaries/prescriptions/upload", formData);
  },

  getPatientScannedPrescriptions: (patientId, params = {}) =>
    api.get(`/patients/${patientId}/scanned-prescriptions`, { params }),

  getDoctorScannedPrescriptions: (params = {}) =>
    api.get("/doctors/scanned-prescriptions", { params }),
};

export default scannedPrescriptionService;
