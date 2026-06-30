import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import {
  GlassCard,
  BentoGridItem,
  EmptyState,
  LoadingSpinner,
} from "../components/ui";
import { Button, Alert, Input } from "../components/ui";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import {
  Calendar,
  Clock,
  User,
  FileText,
  ArrowLeft,
  CheckCircle,
  Plus,
  ChevronDown,
  Stethoscope,
} from "lucide-react";

/**
 * SecretaryCreateAppointment - Create new appointments for patients
 */
export const SecretaryCreateAppointment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    date: "",
    notes: "",
  });
  // دالة المايك الذكية لتحويل الصوت لنص لحظياً
  const [listeningField, setListeningField] = useState(null);

  const startVoiceInput = (fieldPath, isNested = false, nestedParent = "") => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("عذراً، متصفحك لا يدعم خاصية التعرف على الصوت.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-EG"; // التعرف على اللهجة المصرية والعربية بذكاء
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListeningField(fieldPath);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      if (isNested) {
        setIntakeForm((prev) => ({
          ...prev,
          [nestedParent]: {
            ...prev[nestedParent],
            [fieldPath]: prev[nestedParent][fieldPath]
              ? prev[nestedParent][fieldPath] + " " + transcript
              : transcript,
          },
        }));
      } else {
        setIntakeForm((prev) => ({
          ...prev,
          [fieldPath]: prev[fieldPath]
            ? prev[fieldPath] + " " + transcript
            : transcript,
        }));
      }
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.onerror = () => {
      setListeningField(null);
    };

    recognition.start();
  };
  const selectedPatient = patients.find(
    (patient) => patient._id === appointmentData.patientId,
  );
  const selectedPatientLabel = selectedPatient
    ? `${selectedPatient.name} (${selectedPatient.email || selectedPatient.phone || selectedPatient.phoneNumber || ""})`
    : "";

  const filteredPatients = patients.filter((patient) => {
    const query = patientSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (patient.name || "").toLowerCase().includes(query) ||
      (patient.phone || patient.phoneNumber || "")
        .toLowerCase()
        .includes(query) ||
      (patient.email || "").toLowerCase().includes(query)
    );
  });

  // Intake form state
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    chiefComplaint: "",
    vitals: {
      bloodPressure: "",
      diabetes: "",
    },
    medicalHistory: {
      smoking: false,
      heartSurgeries: "",
      familyHeartHistory: "",
      chestProblems: "",
    },
    allergies: "",
    pregnancyOrLactation: "",
  });

  // Fetch patients on mount
  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients();
      setPatients(response.data?.data || []);
    } catch (err) {
      debugError("SecretaryCreateAppointment", "Failed to fetch patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle form submission
  const buildIntakeFormPayload = () => ({
    chiefComplaint: intakeForm.chiefComplaint.trim(),
    vitals: {
      bloodPressure: intakeForm.vitals.bloodPressure.trim(),
      diabetes: intakeForm.vitals.diabetes.trim(),
    },
    medicalHistory: {
      smoking: intakeForm.medicalHistory.smoking,
      heartSurgeries: intakeForm.medicalHistory.heartSurgeries.trim(),
      familyHeartHistory: intakeForm.medicalHistory.familyHeartHistory.trim(),
      chestProblems: intakeForm.medicalHistory.chestProblems.trim(),
    },
    allergies: intakeForm.allergies.trim(),
    pregnancyOrLactation: intakeForm.pregnancyOrLactation.trim(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!appointmentData.patientId || !appointmentData.date) {
      setError("Patient and date are required");
      setLoading(false);
      return;
    }

    try {
      const appointmentPayload = {
        ...appointmentData,
        intakeForm: buildIntakeFormPayload(),
      };

      await appointmentService.createSecretaryAppointment(appointmentPayload);

      setSuccess(t("appointment_scheduled"));
      setTimeout(() => {
        navigate("/secretary/appointments");
      }, 2000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      debugError(
        "SecretaryCreateAppointment",
        "Failed to create appointment",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout userType="secretary">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.button
            onClick={() => navigate("/secretary/appointments")}
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_appointments")}
          </motion.button>

          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400 mb-3 font-semibold"
              >
                {t("create_appointment_heading")}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-gray-900 dark:text-white"
              >
                {t("create_appointment_heading")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 text-lg text-gray-600 dark:text-gray-300"
              >
                {t("create_appointment_sub")}
              </motion.p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl mb-6"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />
                    إختر المريض
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearchQuery || selectedPatientLabel}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      setPatientDropdownOpen(true);
                    }}
                    onFocus={() => setPatientDropdownOpen(true)}
                    placeholder="ابحث باسم المريض، رقم الهاتف، أو البريد الإلكتروني..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoComplete="off"
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  <AnimatePresence>
                    {patientDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-30 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
                      >
                        {filteredPatients.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            لا يوجد مرضى مطابقين
                          </div>
                        ) : (
                          filteredPatients.map((patient) => (
                            <button
                              key={patient._id}
                              type="button"
                              onClick={() => {
                                setAppointmentData({
                                  ...appointmentData,
                                  patientId: patient._id,
                                });
                                setPatientSearchQuery("");
                                setPatientDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {patient.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {patient.email || patient.phone || "-"}
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      التاريخ
                    </span>
                  </label>
                  <input
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        date: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Time slot removed for walk-in queueing; server auto-assigns current time and queue number */}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    ملاحظات (اختياري)
                  </span>
                </label>
                <textarea
                  value={appointmentData.notes}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder={t(
                    "pages_SecretaryCreateAppointment.attr_placeholder_any_additional_notes",
                  )}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Intake Form Section */}
              <motion.div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <motion.button
                  type="button"
                  onClick={() => setShowIntakeForm(!showIntakeForm)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      📝 استمارة الفحص الطبي الأولي (اختياري)
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: showIntakeForm ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showIntakeForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 space-y-6 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-purple-100 dark:border-purple-800"
                    >
                      {/* Chief Complaint */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            الشكوى الرئيسية الحالية
                          </label>
                          <button
                            type="button"
                            onClick={() => startVoiceInput("chiefComplaint")}
                            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition ${listeningField === "chiefComplaint" ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                          >
                            {listeningField === "chiefComplaint"
                              ? "🔴 يسجل..."
                              : "🎙️ إملاء صوتي"}
                          </button>
                        </div>
                        <textarea
                          value={intakeForm.chiefComplaint}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              chiefComplaint: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="ما هي الأعراض الرئيسية للمريض؟"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              ضغط الدم
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                startVoiceInput("bloodPressure", true, "vitals")
                              }
                              className={`p-1 rounded-lg text-xs ${listeningField === "bloodPressure" ? "bg-red-500 text-white animate-pulse" : "bg-purple-50 text-purple-600"}`}
                            >
                              {listeningField === "bloodPressure"
                                ? "🔴"
                                : "🎙️ إملاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={intakeForm.vitals.bloodPressure}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                vitals: {
                                  ...intakeForm.vitals,
                                  bloodPressure: e.target.value,
                                },
                              })
                            }
                            placeholder="120/80"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              السكري
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                startVoiceInput("diabetes", true, "vitals")
                              }
                              className={`p-1 rounded-lg text-xs ${listeningField === "diabetes" ? "bg-red-500 text-white animate-pulse" : "bg-purple-50 text-purple-600"}`}
                            >
                              {listeningField === "diabetes"
                                ? "🔴"
                                : "🎙️ إملاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={intakeForm.vitals.diabetes}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                vitals: {
                                  ...intakeForm.vitals,
                                  diabetes: e.target.value,
                                },
                              })
                            }
                            placeholder="مثال: منخفض / مرتفع"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Medical History Section */}
                      <div className="space-y-4 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          التاريخ الطبي
                        </p>

                        {/* Smoking */}
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={intakeForm.medicalHistory.smoking}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                medicalHistory: {
                                  ...intakeForm.medicalHistory,
                                  smoking: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />

                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            هل المريض يدخن؟
                          </span>
                        </label>

                        {/* Heart Surgeries */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              عمليات القلب (إن وجدت)
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                startVoiceInput(
                                  "heartSurgeries",
                                  true,
                                  "medicalHistory",
                                )
                              }
                              className={`p-1 rounded-lg text-xs ${listeningField === "heartSurgeries" ? "bg-red-500 text-white animate-pulse" : "bg-purple-50 text-purple-600"}`}
                            >
                              {listeningField === "heartSurgeries"
                                ? "🔴"
                                : "🎙️ إملاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={intakeForm.medicalHistory.heartSurgeries}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                medicalHistory: {
                                  ...intakeForm.medicalHistory,
                                  heartSurgeries: e.target.value,
                                },
                              })
                            }
                            placeholder="وصف العملية والسنة..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Family Heart History */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              تاريخ عائلي بأمراض القلب
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                startVoiceInput(
                                  "familyHeartHistory",
                                  true,
                                  "medicalHistory",
                                )
                              }
                              className={`p-1 rounded-lg text-xs ${listeningField === "familyHeartHistory" ? "bg-red-500 text-white animate-pulse" : "bg-purple-50 text-purple-600"}`}
                            >
                              {listeningField === "familyHeartHistory"
                                ? "🔴"
                                : "🎙️ إملاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={intakeForm.medicalHistory.familyHeartHistory}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                medicalHistory: {
                                  ...intakeForm.medicalHistory,
                                  familyHeartHistory: e.target.value,
                                },
                              })
                            }
                            placeholder="الأقارب المصابون والعلاقة..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Chest Problems */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              مشاكل في الصدر (إن وجدت)
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                startVoiceInput(
                                  "chestProblems",
                                  true,
                                  "medicalHistory",
                                )
                              }
                              className={`p-1 rounded-lg text-xs ${listeningField === "chestProblems" ? "bg-red-500 text-white animate-pulse" : "bg-purple-50 text-purple-600"}`}
                            >
                              {listeningField === "chestProblems"
                                ? "🔴"
                                : "🎙️ إملاء"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={intakeForm.medicalHistory.chestProblems}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                medicalHistory: {
                                  ...intakeForm.medicalHistory,
                                  chestProblems: e.target.value,
                                },
                              })
                            }
                            placeholder="الأعراض أو المشاكل..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            الحساسيات الدوائية
                          </label>
                          <button
                            type="button"
                            onClick={() => startVoiceInput("allergies")}
                            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition ${listeningField === "allergies" ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                          >
                            {listeningField === "allergies"
                              ? "🔴 يسجل..."
                              : "🎙️ إملاء صوتي"}
                          </button>
                        </div>
                        <textarea
                          value={intakeForm.allergies}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              allergies: e.target.value,
                            })
                          }
                          rows={2}
                          placeholder="اذكر أي حساسيات من الأدوية أو المواد..."
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      {/* Pregnancy/Lactation */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            الحمل أو الرضاعة (للمريضات)
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              startVoiceInput("pregnancyOrLactation")
                            }
                            className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition ${listeningField === "pregnancyOrLactation" ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
                          >
                            {listeningField === "pregnancyOrLactation"
                              ? "🔴 يسجل..."
                              : "🎙️ إملاء صوتي"}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={intakeForm.pregnancyOrLactation}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              pregnancyOrLactation: e.target.value,
                            })
                          }
                          placeholder="مثال: حامل في الشهر الثالث، مرضعة، لا"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/secretary/appointments")}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      إضافة الموعد
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </MainLayout>
  );
};
