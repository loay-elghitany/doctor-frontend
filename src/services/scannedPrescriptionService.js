import api from "./api";

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

  getPatientScannedPrescriptions: (patientId, params = {}) =>
    api.get(`/patients/${patientId}/scanned-prescriptions`, { params }),

  getDoctorScannedPrescriptions: (params = {}) =>
    api.get("/doctors/scanned-prescriptions", { params }),
};

export default scannedPrescriptionService;
