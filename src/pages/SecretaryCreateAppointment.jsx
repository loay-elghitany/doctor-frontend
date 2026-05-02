import React, { useState, useEffect } from "react";
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
} from "lucide-react";

/**
 * SecretaryCreateAppointment - Create new appointments for patients
 */
export const SecretaryCreateAppointment = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    date: "",
    timeSlot: "09:00",
    notes: "",
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
      await appointmentService.createSecretaryAppointment(appointmentData);

      setSuccess(
        "الموعد تم إنشاؤه بنجاح! سيتم إعادة التوجيه إلى قائمة المواعيد...",
      );
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

  // Time slot options
  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

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
            العودة إلى قائمة المواعيد
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
                حجز موعد جديد
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-gray-900 dark:text-white"
              >
                إضافة موعد جديد
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 text-lg text-gray-600 dark:text-gray-300"
              >
                جدولة مواعيد لمرضاك .
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
                  <select
                    value={appointmentData.patientId}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        patientId: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="">إختر المريض</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} ({patient.email})
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      الوقت الزمني
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={appointmentData.timeSlot}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          timeSlot: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>
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
                  placeholder="Any additional notes about the appointment..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

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
