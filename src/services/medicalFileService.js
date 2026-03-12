import api from "./api";

const openDownloadWindow = (downloadPath) => {
  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const url = `${apiBase}${downloadPath}?token=${token}`;
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

  downloadMedicalFile: (storedName, role = "patient") => {
    let downloadPath;
    if (role === "doctor") {
      downloadPath = `/medical-files/download/doctor/${storedName}`;
    } else {
      downloadPath = `/medical-files/download/patient/${storedName}`;
    }
    openDownloadWindow(downloadPath);
  },

  downloadFile: (storedName) => {
    // Maintain backward compatibility, default to patient download
    medicalFileService.downloadMedicalFile(storedName, "patient");
  },
};

export default medicalFileService;

// Note: The downloadFile function constructs a URL with the token in the query string and opens it in a new tab. The backend should handle this route, verify the token, and serve the file for download.
