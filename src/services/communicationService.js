import api from "./api";

export const communicationService = {
  getWhatsAppLinkForDoctor: () => api.get("/communication/whatsapp/doctor"),
  getWhatsAppLinkForPatient: (patientId) =>
    api.get(`/communication/whatsapp/patient/${patientId}`),
};

export default communicationService;
