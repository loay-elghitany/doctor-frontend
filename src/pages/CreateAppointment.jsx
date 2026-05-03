import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { GlassCard, WizardStep, PremiumProgressBar } from "../components/ui";
import {
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Stethoscope,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    date: "",
    timeSlot: "09:00",
    notes: "",
    name: "",
    email: "",
    phone: "",
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  const wizardSteps = [
    {
      id: 1,
      title: "سبب حجز الموعد",
      description: "رجاءاً ! أخبرنا بسبب رغبتك في مقابلة الدكتور",
      icon: Stethoscope,
    },
    {
      id: 2,
      title: "إختر الموعد والتاريخ",
      description: "فقط أخبرنا بالموعد المناسب لك",
      icon: Calendar,
    },
    {
      id: 3,
      title: "المراجعة والتأكيد",
      description: "هل كل شئ جيد؟؟",
      icon: CheckCircle,
    },
  ];

  // Available time slots
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
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
    "23:30",
    "00:00",
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date selection and fetch available slots
  const handleDateSelect = async (date) => {
    setFormData((prev) => ({ ...prev, date }));

    setLoading(true);
    try {
      const today = new Date();
      const selectedDate = new Date(date);
      const isToday = selectedDate.toDateString() === today.toDateString();

      let available = [...timeSlots];

      if (isToday) {
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        available = timeSlots.filter((slot) => {
          const [hour, minute] = slot.split(":").map(Number);
          const slotTime = hour * 60 + minute;
          return slotTime > currentTime;
        });
      }

      setAvailableSlots(available);
    } catch (err) {
      console.error("Error fetching available slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotSelect = (slot) => {
    setFormData((prev) => ({ ...prev, timeSlot: slot }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.date) {
      setError("رجاءاً ! أختر تاريخ الزيارة");
      setLoading(false);
      return;
    }

    if (!formData.timeSlot) {
      setError("رجاءاً ! أختر وقت الزيارة");
      setLoading(false);
      return;
    }

    if (!formData.notes.trim()) {
      setError("رجاءاً ! أدخل سبب الموعد");
      setLoading(false);
      return;
    }

    try {
      // Convert date to ISO string with selected time
      const [dateStr] = formData.date.split("T");
      const [hours, minutes] = formData.timeSlot.split(":");
      const appointmentDate = new Date(`${dateStr}T${hours}:${minutes}:00`);

      if (isNaN(appointmentDate.getTime())) {
        setError("Invalid date or time format");
        setLoading(false);
        return;
      }

      // Call API to create appointment
      await appointmentService.createAppointment(
        undefined, // doctorId not provided - backend resolves it
        appointmentDate.toISOString(),
        formData.timeSlot,
        formData.notes,
      );

      setSuccess("تم إنشاء الموعد بنجاح");
      setCurrentStep(2); // In case they are on a different step or to ensure it stays here

      // Redirect to patient dashboard after brief delay
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 2000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg || "Failed to create appointment");
      console.error("Appointment creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep === 0 && !formData.notes.trim()) {
      setError("رجاءاً ! أدخل سبب الموعد");
      return;
    }
    if (currentStep === 1 && (!formData.date || !formData.timeSlot)) {
      setError("رجاءاً ! أختر التاريخ والوقت المناسبين");
      return;
    }

    setError("");
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setFormData({
      date: "",
      timeSlot: "09:00",
      notes: "",
    });
    setAvailableSlots([]);
    setError("");
    setSuccess("");
  };

  return (
    <MainLayout userType="patient">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            احجز موعد جديد
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            اتبع الخطوات التالية لحجز موعد جديد
          </p>
        </motion.div>

        {/* Wizard Progress */}
        <GlassCard className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {wizardSteps.map((step, index) => (
                <WizardStep
                  key={step.id}
                  step={step.id}
                  title={step.title}
                  description={step.description}
                  isActive={currentStep === index}
                  isCompleted={currentStep > index}
                />
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {wizardSteps.length}
              </span>
              <PremiumProgressBar
                value={((currentStep + 1) / wizardSteps.length) * 100}
                max={100}
                color="primary"
                size="sm"
              />
            </div>
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Success Display */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* Wizard Content */}
        <GlassCard>
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    سبب الزيارة
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    من فضلك اكتب سبب رغبتك في زيارة الدكتور
                  </p>
                </div>

                <div className="space-y-6 max-w-2xl mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تفاصيل
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="E.g., General checkup, experiencing headaches, dental pain..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    اختر التاريخ والوقت
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    اختر موعداً مناسباً لموعدك
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      اختر التاريخ
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      المواعيد المتاحة
                    </label>
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(6)].map((_, index) => (
                          <div
                            key={index}
                            className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                          />
                        ))}
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                        {availableSlots.map((slot) => (
                          <motion.button
                            key={slot}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTimeSlotSelect(slot)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              formData.timeSlot === slot
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                            }`}
                          >
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        {formData.date
                          ? "لا يوجد مواعيد متاحة في هذا التاريخ"
                          : "من فضلك اختر التاريخ أولاً"}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    راجع موعدك
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    من فضلك قم بمراجعة تفاصيل حجزك قبل التأكيد
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appointment Details */}
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      تفاصيل الموعد
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          التاريخ
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formData.date
                            ? new Date(formData.date).toLocaleDateString()
                            : "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          الوقت
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formData.timeSlot}
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Patient Info */}
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      معلومات المريض
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            الاسم
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user?.name || user?.fullName || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Email
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user?.email || formData.email || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            الهاتف
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user?.phone || formData.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Reason */}
                {formData.notes && (
                  <GlassCard className="p-6 mt-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      سبب الزيارة
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.notes}
                    </p>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ArrowLeft className="w-4 h-4" />
                الرجوع للخلف
              </button>
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Plus className="w-4 h-4" />
                إبدأ من جديد
              </button>
            </div>

            <div className="flex gap-3">
              {currentStep < wizardSteps.length - 1 && (
                <button
                  onClick={handleNext}
                  className="btn-premium btn-premium-primary px-6 py-2 flex items-center gap-2"
                >
                  التالي
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {currentStep === wizardSteps.length - 1 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-premium btn-premium-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Confirm Appointment"}
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </MainLayout>
  );
};

export default CreateAppointment;
