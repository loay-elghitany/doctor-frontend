import api from "./api";

const downloadFileFromStream = async (url, fileName) => {
  try {
    const response = await api.get(url, { responseType: "blob" });
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
    console.error("File download failed:", error);
    throw error;
  }
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

  downloadMedicalFile: ({
    role,
    patientId,
    doctorId,
    fileId,
    fileName,
  }) => {
    let downloadPath;
    if (role === "doctor") {
      downloadPath = `/medical-files/download/doctor/${doctorId}/${fileId}`;
    } else {
      downloadPath = `/medical-files/download/patient/${patientId}/${fileId}`;
    }
    return downloadFileFromStream(downloadPath, fileName);
  },
};

export default medicalFileService;
