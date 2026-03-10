import api from "./api";

const downloadFileWithAuth = async (storedName, fileName) => {
  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const url = `${apiBase}/medical-files/download/${storedName}`;

  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(link);
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
