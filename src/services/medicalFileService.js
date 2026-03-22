import api from "./api";
import axios from "axios";
import { debugLog } from "../utils/debug";

// API base configuration using Vite env (must be prefixed with VITE_)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  downloadMedicalFile: async ({ role, storedName, fileName }) => {
    const patient = JSON.parse(localStorage.getItem("patientInfo"));
    const doctor = JSON.parse(localStorage.getItem("doctorInfo"));
    const token = patient?.token || doctor?.token;
    debugLog("medicalFileService", "Download attempt", {
      hasToken: !!token,
      tokenSource: patient?.token
        ? "patient"
        : doctor?.token
          ? "doctor"
          : "none",
      role,
      storedName,
    });

    if (!token) {
      throw new Error(
        "Authentication required. Please log in to download files.",
      );
    }

    // Extract the last segment of storedName to handle cases where it contains a full path
    const fileIdentifier = storedName.split("/").pop();
    const downloadPath = `/medical-files/download/${role}/${fileIdentifier}`;
    const fullUrl = `${API_BASE_URL}${downloadPath}`;

    debugLog("medicalFileService", "Requesting download", { url: fullUrl });

    try {
      const response = await axios.get(fullUrl, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      debugLog("medicalFileService", "Download response", {
        status: response.status,
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      debugLog("medicalFileService", "Download failed", {
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  },
};

export default medicalFileService;
