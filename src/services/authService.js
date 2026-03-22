import api from "./api";
import { debugLog, debugError } from "../utils/debug";

const authService = {
  // ----------------------------------------------------------------
  // Auth Actions
  // ----------------------------------------------------------------

  // Register a new patient
  registerPatient: (name, email, password, clinicSlug, phoneNumber) => {
    debugLog("authService:registerPatient", "Sending registration request", {
      email,
      clinicSlug,
    });
    return api
      .post(`/patients/register/${clinicSlug}`, {
        name,
        email,
        password,
        phoneNumber,
      })
      .then((res) => {
        debugLog("authService:registerPatient", "Registration successful", {
          id: res.data?.data?.id,
        });
        return res;
      })
      .catch((err) => {
        debugError(
          "authService:registerPatient",
          "Registration Error",
          err.response?.data || err.message,
        );
        throw err;
      });
  },

  loginPatient: (email, password) => {
    debugLog("authService:loginPatient", "Sending request", { email });
    return api
      .post("/patients/login", { email, password, role: "patient" })
      .then((res) => {
        debugLog("authService:loginPatient", "Success response received", {
          hasToken: !!res.data?.data?.token,
        });
        return res;
      })
      .catch((err) => {
        debugError(
          "authService:loginPatient",
          "Error",
          err.response?.data || err.message,
        );
        throw err;
      });
  },

  loginDoctor: (email, password) => {
    debugLog("authService:loginDoctor", "Sending request", { email });
    return api
      .post("/doctors/login", { email, password, role: "doctor" })
      .then((res) => {
        debugLog("authService:loginDoctor", "Success response received", {
          hasToken: !!res.data?.data?.token,
        });
        return res;
      })
      .catch((err) => {
        debugError(
          "authService:loginDoctor",
          "Error",
          err.response?.data || err.message,
        );
        throw err;
      });
  },

  // ----------------------------------------------------------------
  // Profile Actions
  // ----------------------------------------------------------------

  // Get patient profile - used when role is "patient"
  getPatientProfile: () => {
    debugLog("authService:getPatientProfile", "Fetching profile");
    return api
      .get("/patients/me")
      .then((res) => {
        debugLog("authService:getPatientProfile", "Success", {
          dataKeys: Object.keys(res.data?.data || {}),
        });
        return res;
      })
      .catch((err) => {
        debugError(
          "authService:getPatientProfile",
          "Error",
          err.response?.data || err.message,
        );
        throw err;
      });
  },

  // Get doctor profile - used when role is "doctor"
  getDoctorProfile: () => {
    debugLog("authService:getDoctorProfile", "Fetching profile");
    return api
      .get("/doctors/me")
      .then((res) => {
        debugLog("authService:getDoctorProfile", "Success", {
          dataKeys: Object.keys(res.data?.data || {}),
        });
        return res;
      })
      .catch((err) => {
        debugError(
          "authService:getDoctorProfile",
          "Error",
          err.response?.data || err.message,
        );
        throw err;
      });
  },
};

export default authService;
