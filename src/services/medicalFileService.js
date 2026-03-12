import api from "./api";

const downloadFileWithAuth = (storedName, fileName) => {
  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Construct the URL with the token in the query string
  const url = `${apiBase}/medical-files/download/${storedName}?token=${token}`;

  // Open the URL in a new tab to let the browser handle the download
  window.open(url, "_blank");
};

export const medicalFileService = {
  uploadMedicalFile: (formData) =>
    api.post("/medical-files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyFiles: () => api.get("/medical-files/my"),
  deleteFile: (id) => api.delete(`/medical-files/${id}`),

  getPatientFiles: (patientId) =>
    api.get(`/medical-files/patient/${patientId}`),

  getAppointmentFiles: (appointmentId) =>
    api.get(`/medical-files/appointment/${appointmentId}`),

  downloadFile: (storedName, fileName) =>
    downloadFileWithAuth(storedName, fileName),
};

export default medicalFileService;

// Note: The downloadFile function constructs a URL with the token in the query string and opens it in a new tab. The backend should handle this route, verify the token, and serve the file for download.
