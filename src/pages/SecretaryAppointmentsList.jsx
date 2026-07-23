import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import {
  GlassCard,
  BentoGridItem,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  QuickActionButton,
} from "../components/ui";
import { Button, Badge, Alert, Modal, Spinner } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import doctorService from "../services/doctorService";
import { getStatusLabel, handleApiError } from "../utils/helpers";
import {
  normalizeStatus,
  buildStatusTabs,
} from "../utils/appointmentStatus.js";
import { getAppointmentPermissions } from "../utils/appointmentPermissions.js";
import { debugLog, debugError } from "../utils/debug";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";
import { RescheduleModal } from "../components/appointments/RescheduleModal.jsx";
import { IntakeFormViewModal } from "../components/IntakeFormViewModal";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Trash2,
  Calendar,
  Filter,
  FileText,
  RotateCcw,
  Stethoscope,
  Printer,
  MessageSquare,
} from "lucide-react";
/**
 * SecretaryAppointmentsList - Display and manage appointments for secretary's doctor
 * Fetches appointments using secretary authentication from JWT token
 * Allows secretary to view and manage appointments (similar to doctor but read-only for some actions)
 */
export const SecretaryAppointmentsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [intakeViewAppointment, setIntakeViewAppointment] = useState(null);
  const [intakeEditAppointment, setIntakeEditAppointment] = useState(null);
  const [intakeEditForm, setIntakeEditForm] = useState(null);
  const [intakeEditLoading, setIntakeEditLoading] = useState(false);
  const [printAppointmentId, setPrintAppointmentId] = useState(null);

  const tabs = buildStatusTabs(appointments);

  const canEditIntake = (status) => {
    const normalized = normalizeStatus(status);
    return ["pending", "scheduled", "confirmed"].includes(normalized);
  };

  const getIntakeValue = (source, key) => {
    if (!source) return undefined;
    if (source instanceof Map) return source.get(key);
    return source[key];
  };

  const toIntakeFormState = (existing, customQuestions = []) => {
    const state = {
      chiefComplaint: existing?.chiefComplaint || "",
      vitals: {
        bloodPressure: existing?.vitals?.bloodPressure || "",
        diabetes: existing?.vitals?.diabetes || "",
      },
      medicalHistory: {
        smoking: Boolean(existing?.medicalHistory?.smoking),
        heartSurgeries: existing?.medicalHistory?.heartSurgeries || "",
        familyHeartHistory: existing?.medicalHistory?.familyHeartHistory || "",
        chestProblems: existing?.medicalHistory?.chestProblems || "",
      },
      allergies: existing?.allergies || "",
      pregnancyOrLactation: existing?.pregnancyOrLactation || "",
      customAnswers: {},
      customQuestionList: customQuestions,
    };

    customQuestions.forEach((question) => {
      const storedValue = getIntakeValue(existing, question.id);
      state.customAnswers[question.id] =
        question.type === "boolean"
          ? Boolean(storedValue)
          : (storedValue ?? "");
    });

    return state;
  };

  const openIntakeEdit = async (appointment) => {
    try {
      setIntakeEditLoading(true);
      setIntakeEditAppointment(appointment);
      const questionsResponse = await doctorService.getDoctorProfile();
      const customQuestions =
        questionsResponse?.data?.data?.customIntakeQuestions || [];
      setIntakeEditForm(
        toIntakeFormState(appointment?.intakeForm, customQuestions),
      );
    } catch (err) {
      setIntakeEditForm(toIntakeFormState(appointment?.intakeForm));
      handleActionError(err, "Failed to load intake questions.");
    } finally {
      setIntakeEditLoading(false);
    }
  };

  const handleSaveIntakeForm = async () => {
    if (!intakeEditAppointment?._id || !intakeEditForm) return;

    setIntakeEditLoading(true);
    setError("");
    setSuccess("");

    const hasDynamicQuestions =
      Array.isArray(intakeEditForm?.customQuestionList) &&
      intakeEditForm.customQuestionList.length > 0;

    const intakeFormPayload = hasDynamicQuestions
      ? { ...(intakeEditForm.customAnswers || {}) }
      : {
          chiefComplaint: intakeEditForm.chiefComplaint.trim(),
          vitals: {
            bloodPressure: intakeEditForm.vitals.bloodPressure.trim(),
            diabetes: intakeEditForm.vitals.diabetes.trim(),
          },
          medicalHistory: {
            smoking: intakeEditForm.medicalHistory.smoking,
            heartSurgeries: intakeEditForm.medicalHistory.heartSurgeries.trim(),
            familyHeartHistory:
              intakeEditForm.medicalHistory.familyHeartHistory.trim(),
            chestProblems: intakeEditForm.medicalHistory.chestProblems.trim(),
          },
          allergies: intakeEditForm.allergies.trim(),
          pregnancyOrLactation: intakeEditForm.pregnancyOrLactation.trim(),
          ...(intakeEditForm.customAnswers || {}),
        };

    try {
      const response = await appointmentService.updateIntakeForm(
        intakeEditAppointment._id,
        intakeFormPayload,
      );
      const updatedAppointment = response.data?.data;
      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) => {
            if (item?._id !== updatedAppointment._id) return item;
            return {
              ...item,
              ...updatedAppointment,
              patientId:
                typeof updatedAppointment.patientId === "object" &&
                updatedAppointment.patientId !== null
                  ? updatedAppointment.patientId
                  : item.patientId,
              doctorId:
                typeof updatedAppointment.doctorId === "object" &&
                updatedAppointment.doctorId !== null
                  ? updatedAppointment.doctorId
                  : item.doctorId,
            };
          }),
        );
      }
      setSuccess(
        t("pages_SecretaryAppointmentsList.text_intake_saved", {
          defaultValue: "تم حفظ استمارة الفحص بنجاح.",
        }),
      );
      setIntakeEditAppointment(null);
      setIntakeEditForm(null);
    } catch (err) {
      handleActionError(err, "Failed to save intake form.");
    } finally {
      setIntakeEditLoading(false);
    }
  };

  // Fetch secretary appointments on mount
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryAppointmentsList", "Fetching secretary appointments");
      const response = await appointmentService.getAppointments({
        limit: 1000,
        page: 1,
      });

      const appointmentsList = response.data?.data || [];
      debugLog("SecretaryAppointmentsList", "Appointments fetched", {
        count: appointmentsList.length,
      });

      setAppointments(Array.isArray(appointmentsList) ? appointmentsList : []);
    } catch (err) {
      const errorMsg = handleApiError(err);
      // Don't set error for 401s as they trigger logout automatically
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError(
        "SecretaryAppointmentsList",
        "Failed to fetch appointments",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleActionError = (err, defaultMessage) => {
    const errorMsg = handleApiError(err) || defaultMessage;
    if (err.response?.status !== 401) {
      setError(errorMsg);
    }
    debugError("SecretaryAppointmentsList", defaultMessage, err);
  };

  const handleConfirmAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");
    setRowLoading(appointmentId, "confirm", true);

    try {
      const response = await appointmentService.updateAppointmentStatus(
        appointmentId,
        "scheduled",
      );
      const updatedAppointment = response.data?.data;
      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) =>
            item?._id === updatedAppointment._id
              ? {
                  ...updatedAppointment,
                  patientId: item.patientId,
                  doctorId: item.doctorId,
                  prescription: item.prescription,
                }
              : item,
          ),
        );
      }
      setSuccess(t("appointment_scheduled"));
    } catch (err) {
      handleActionError(err, "Failed to confirm appointment.");
    } finally {
      setRowLoading(appointmentId, "confirm", false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");
    setRowLoading(appointmentId, "cancel", true);

    try {
      const response =
        await appointmentService.cancelDoctorAppointment(appointmentId);
      const updatedAppointment = response.data?.data;
      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) =>
            item?._id === updatedAppointment._id
              ? {
                  ...updatedAppointment,
                  patientId: item.patientId,
                  doctorId: item.doctorId,
                  prescription: item.prescription,
                }
              : item,
          ),
        );
      }
      setSuccess(t("appointment_cancelled"));
    } catch (err) {
      handleActionError(err, "Failed to cancel appointment.");
    } finally {
      setRowLoading(appointmentId, "cancel", false);
    }
  };

  const handleMarkCompleted = async (appointmentId) => {
    setError("");
    setSuccess("");
    setRowLoading(appointmentId, "complete", true);

    try {
      const response =
        await appointmentService.markAppointmentCompleted(appointmentId);
      const updatedAppointment = response.data?.data;
      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) =>
            item?._id === updatedAppointment._id
              ? {
                  ...updatedAppointment,
                  patientId: item.patientId,
                  doctorId: item.doctorId,
                  prescription: item.prescription,
                }
              : item,
          ),
        );
      }
      setSuccess("Appointment marked as completed.");
    } catch (err) {
      handleActionError(err, "Failed to mark appointment as completed.");
    } finally {
      setRowLoading(appointmentId, "complete", false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");
    setRowLoading(appointmentId, "delete", true);

    try {
      await appointmentService.softDeleteAppointment(appointmentId);
      setAppointments((prev) =>
        prev.filter((item) => item?._id !== appointmentId),
      );
      setSuccess("Appointment removed from dashboard.");
    } catch (err) {
      handleActionError(err, "Failed to delete appointment.");
    } finally {
      setRowLoading(appointmentId, "delete", false);
    }
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter((appointment) => {
    if (activeTab === "all") return true;
    const effectiveStatus = normalizeStatus(appointment?.status);
    return effectiveStatus === activeTab;
  });

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return new Date(d1).toDateString() === new Date(d2).toDateString();
  };

  // Sort appointments: for today's appointments sort by creation time (or timeSlot) ascending
  const sortedAppointments = filteredAppointments.slice().sort((a, b) => {
    const today = new Date();
    const aIsToday = isSameDay(a?.date, today);
    const bIsToday = isSameDay(b?.date, today);

    if (aIsToday && bIsToday) {
      const aCreated = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aCreated && bCreated && aCreated !== bCreated)
        return aCreated - bCreated;
      // fallback to comparing timeSlot strings (HH:MM)
      const aSlot = a?.timeSlot || "00:00";
      const bSlot = b?.timeSlot || "00:00";
      return aSlot.localeCompare(bSlot);
    }

    // If only one is today, put today's earlier
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Otherwise sort by date then timeSlot
    const aDate = new Date(a?.date).getTime() || 0;
    const bDate = new Date(b?.date).getTime() || 0;
    if (aDate !== bDate) return aDate - bDate;
    return (a?.timeSlot || "00:00").localeCompare(b?.timeSlot || "00:00");
  });

  const normalizedStatusCounts = appointments.reduce((counts, appointment) => {
    const effectiveStatus = normalizeStatus(appointment?.status);
    if (!effectiveStatus) return counts;
    counts[effectiveStatus] = (counts[effectiveStatus] || 0) + 1;
    return counts;
  }, {});

  useEffect(() => {
    if (activeTab !== "all" && !normalizedStatusCounts[activeTab]) {
      setActiveTab("all");
    }
  }, [activeTab, normalizedStatusCounts]);

  const setRowLoading = (appointmentId, action, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [action]: value,
      },
    }));
  };

  const handlePrintPrescription = (appointment) => {
    if (!appointment) return;
    setPrintAppointmentId(appointment._id);
    setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(() => setPrintAppointmentId(null), 500);
      }
    }, 300);
  };

  const handleWhatsApp = (appointment) => {
    let phone =
      appointment?.patientId?.phoneNumber ||
      appointment?.patientId?.phone ||
      "";

    if (!phone) {
      const matches = String(appointment?.patientId?.email || "").match(/\d+/);
      if (matches) {
        phone = matches[0];
      }
    }

    if (!phone) {
      setError("رقم هاتف المريض غير متوفر");
      return;
    }

    const prescription = appointment?.prescription || null;
    const patientName = appointment?.patientId?.name || "المريض";
    const clinicName = appointment?.doctor?.clinicName || "العيادة الطبية";
    const dateLabel = formatDateSafe(appointment?.date);
    const diagnosis = prescription?.diagnosis || "—";
    const medications = Array.isArray(prescription?.medications)
      ? prescription.medications
      : [];

    const medicationLines = medications
      .map((med) => {
        const name = med?.name || "";
        const dosage = med?.dosage ? ` - ${med.dosage}` : "";
        const frequency = med?.frequency ? ` (${med.frequency}` : "";
        const duration = med?.duration ? ` - ${med.duration}` : "";
        const instructions = med?.instructions ? ` - ${med.instructions}` : "";
        const suffix = `${frequency || ""}${duration || ""}${instructions || ""}`;
        return `• ${name}${dosage}${suffix ? `${suffix})` : ""}`.trim();
      })
      .filter(Boolean);

    const text = [
      `*${clinicName}*`,
      `روشتة المريض: ${patientName}`,
      `التاريخ: ${dateLabel}`,
      `*التشخيص:* ${diagnosis}`,
      `*العلاج والأدوية الموصوفة:*`,
      ...(medicationLines.length
        ? medicationLines
        : ["• لا توجد أدوية موصوفة"]),
    ].join("\n");

    const cleaned = String(phone).replace(/\D/g, "");
    if (!cleaned) {
      setError("رقم هاتف المريض غير متوفر");
      return;
    }

    setError("");
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isRowLoading = (appointmentId, action) =>
    !!actionLoading[appointmentId]?.[action];

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(
      String(status || "").toLowerCase(),
    );
    switch (normalizedStatus) {
      case "confirmed":
      case "scheduled":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      case "reschedule_proposed":
        return "info";
      case "completed":
        return "secondary";
      default:
        return "default";
    }
  };

  // Table columns
  const columns = [
    {
      key: "patient",
      header: "Patient",
      render: (appointment, value) => {
        if (!appointment) return null;
        if (!appointment.patientId) {
          console.warn("Missing patientId in appointment", appointment);
        }

        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {appointment.patientId?.name || "Unknown Patient"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {appointment.patientId?.email || ""}
            </div>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (appointment, value) => (
        <div>
          <div className="font-medium">{formatDateSafe(appointment?.date)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {appointment?.timeSlot || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (appointment, value) => (
        <Badge variant={getStatusColor(appointment?.status)}>
          {getStatusLabel(appointment?.status)}
        </Badge>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (appointment, value) => (
        <div className="max-w-xs truncate text-sm">{appointment?.notes}</div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (appointment, value) => {
        if (!appointment) return null;

        const permissions = getAppointmentPermissions(appointment?.status);

        return (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/secretary/appointments/${appointment?._id}`)
              }
            >
              {t("pages_SecretaryAppointmentsList.text_view")}
            </Button>
            {permissions.canConfirm && (
              <Button
                variant="success"
                size="sm"
                disabled={isRowLoading(appointment._id, "confirm")}
                onClick={() => handleConfirmAppointment(appointment._id)}
              >
                {isRowLoading(appointment._id, "confirm")
                  ? t("secretary_appointments.actions.confirming")
                  : t("secretary_appointments.actions.confirm")}
              </Button>
            )}
            {permissions.canCancel && (
              <Button
                variant="danger"
                size="sm"
                disabled={isRowLoading(appointment._id, "cancel")}
                onClick={() => handleCancelAppointment(appointment._id)}
              >
                {isRowLoading(appointment._id, "cancel")
                  ? "Cancelling..."
                  : "Cancel"}
              </Button>
            )}
            {permissions.canMarkCompleted && (
              <Button
                variant="success"
                size="sm"
                disabled={isRowLoading(appointment._id, "complete")}
                onClick={() => handleMarkCompleted(appointment._id)}
              >
                {isRowLoading(appointment._id, "complete")
                  ? t("secretary_appointments.actions.completing")
                  : t("secretary_appointments.actions.complete")}
              </Button>
            )}
            {permissions.canReschedule && (
              <Button
                variant="warning"
                size="sm"
                className="flex items-center gap-2"
                disabled={isRowLoading(appointment._id, "reschedule")}
                onClick={() => openRescheduleModal(appointment)}
              >
                {isRowLoading(appointment._id, "reschedule")
                  ? "Loading..."
                  : "⟳ Reschedule"}
              </Button>
            )}
            {permissions.canDelete && (
              <Button
                variant="outline"
                size="sm"
                disabled={isRowLoading(appointment._id, "delete")}
                onClick={() => handleDeleteAppointment(appointment._id)}
              >
                {isRowLoading(appointment._id, "delete")
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // Calculate stats
  const stats = {
    total: appointments.length,
    upcoming: appointments.filter((apt) => {
      const status = normalizeStatus(apt.status);
      return status === "scheduled" || status === "confirmed";
    }).length,
    pending: appointments.filter(
      (apt) => normalizeStatus(apt.status) === "pending",
    ).length,
  };

  const statCards = [
    {
      title: t("secretary_appointments.stats.total"),
      value: stats.total,
      icon: CalendarDays,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: t("secretary_appointments.stats.upcoming"),
      value: stats.upcoming,
      icon: Clock,
      gradient: "from-emerald-500 to-green-400",
    },
    {
      title: t("secretary_appointments.stats.pending"),
      value: stats.pending,
      icon: Filter,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: t("secretary_appointments.actions.new"),
      onClick: () => navigate("/secretary/appointments/new"),
    },
    {
      icon: Stethoscope,
      label: t("secretary_appointments.actions.patients"),
      onClick: () => navigate("/secretary/patients"),
    },
    {
      icon: RotateCcw,
      label: t("secretary_appointments.actions.refresh"),
      onClick: fetchAppointments,
    },
  ];

  return (
    <MainLayout userType="secretary">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400 mb-3 font-semibold"
                  >
                    {t("secretary_appointments.clinic_schedule")}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    {t("secretary_appointments.title")}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    {t("secretary_appointments.subtitle")}
                  </motion.p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <BentoGridItem key={card.title} delay={index * 0.1}>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {card.value}
                    </motion.div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.title}
                    </p>
                  </div>
                </div>
              </BentoGridItem>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {/* Filter Tabs */}
        <GlassCard className="p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {tab.id === "all"
                  ? t("secretary_appointments.tabs.all")
                  : tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message={t("appointments")} />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t(
              "pages_SecretaryAppointmentsList.attr_title_no_appointments",
            )}
            description={t("components_ui_DataDisplay.text_no_data_available", {
              defaultValue: "لا توجد مواعيد مطابقة حالياً.",
            })}
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedAppointments.map((appointment, index) => {
                const permissions = getAppointmentPermissions(
                  appointment.status,
                );
                const patientName =
                  appointment.patientId?.name || "Unknown Patient";
                const isWalkIn =
                  appointment.createdBy === "secretary" &&
                  (normalizeStatus(appointment.status) === "scheduled" ||
                    normalizeStatus(appointment.status) === "confirmed");

                return (
                  <motion.div
                    key={appointment._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Patient Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white font-semibold">
                            {patientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {patientName}
                              {appointment?.queueNumber ? (
                                <span className="mr-2 inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                  دور رقم: {appointment.queueNumber}
                                </span>
                              ) : null}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDateSafe(appointment.date)}
                              <span className="text-gray-400">•</span>
                              <Clock className="w-4 h-4" />
                              {appointment.timeSlot || "—"}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {appointment.patientId?.email}
                            </p>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <StatusBadge
                            status={
                              normalizeStatus(appointment.status) || "unknown"
                            }
                            size="md"
                          />
                          {isWalkIn && (
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              حضور مباشر
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            {appointment.intakeForm && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setIntakeViewAppointment({
                                    ...appointment,
                                    doctorId: appointment?.doctorId
                                      ?.customIntakeQuestions
                                      ? appointment.doctorId
                                      : appointment?.doctor
                                            ?.customIntakeQuestions
                                        ? appointment.doctor
                                        : appointment.doctorId,
                                    doctor: appointment?.doctor
                                      ?.customIntakeQuestions
                                      ? appointment.doctor
                                      : appointment.doctor,
                                  })
                                }
                                className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center gap-1"
                              >
                                <FileText className="w-4 h-4" />
                                {t(
                                  "pages_SecretaryAppointmentsList.text_intake_form",
                                  { defaultValue: "استمارة الفحص" },
                                )}
                              </motion.button>
                            )}
                            {canEditIntake(appointment.status) && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openIntakeEdit(appointment)}
                                className="px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition flex items-center gap-1"
                              >
                                <Stethoscope className="w-4 h-4" />
                                {appointment.intakeForm
                                  ? t(
                                      "pages_SecretaryAppointmentsList.text_update_intake",
                                      { defaultValue: "تحديث الفحص" },
                                    )
                                  : t(
                                      "pages_SecretaryAppointmentsList.text_record_intake",
                                      { defaultValue: "تسجيل الفحص" },
                                    )}
                              </motion.button>
                            )}
                            {permissions.canConfirm && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleConfirmAppointment(appointment._id)
                                }
                                disabled={isRowLoading(
                                  appointment._id,
                                  "confirm",
                                )}
                                className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50"
                              >
                                {isRowLoading(appointment._id, "confirm")
                                  ? t(
                                      "secretary_appointments.actions.confirming",
                                    )
                                  : t("secretary_appointments.actions.confirm")}
                              </motion.button>
                            )}

                            {permissions.canCancel && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleCancelAppointment(appointment._id)
                                }
                                disabled={isRowLoading(
                                  appointment._id,
                                  "cancel",
                                )}
                                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                                title={t(
                                  "pages_SecretaryAppointmentsList.attr_title_cancel",
                                )}
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}

                            {permissions.canReschedule && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openRescheduleModal(appointment)}
                                disabled={isRowLoading(
                                  appointment._id,
                                  "reschedule",
                                )}
                                className="px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/30 transition disabled:opacity-50"
                              >
                                {t(
                                  "pages_SecretaryAppointmentsList.text_reschedule",
                                )}
                              </motion.button>
                            )}

                            {permissions.canMarkCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleMarkCompleted(appointment._id)
                                }
                                disabled={isRowLoading(
                                  appointment._id,
                                  "complete",
                                )}
                                className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                              >
                                {isRowLoading(appointment._id, "complete")
                                  ? t(
                                      "secretary_appointments.actions.completing",
                                    )
                                  : t(
                                      "secretary_appointments.actions.complete",
                                    )}
                              </motion.button>
                            )}

                            {/* Prescription actions for completed appointments */}
                            {normalizeStatus(appointment.status) ===
                              "completed" &&
                              appointment.prescription && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handlePrintPrescription(appointment)
                                    }
                                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                                  >
                                    <Printer className="w-4 h-4" />
                                    🖨️ طباعة الروشتة
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleWhatsApp(appointment)}
                                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    💬 واتساب
                                  </motion.button>
                                </>
                              )}

                            {permissions.canDelete && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleDeleteAppointment(appointment._id)
                                }
                                disabled={isRowLoading(
                                  appointment._id,
                                  "delete",
                                )}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                                title={t(
                                  "pages_SecretaryAppointmentsList.attr_title_delete",
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                              {t("pages_SecretaryAppointmentsList.text_notes")}
                            </span>{" "}
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          appointmentId={selectedAppointment?._id}
          role="secretary"
          onSuccess={async () => {
            await fetchAppointments();
            setSuccess("Reschedule options proposed successfully.");
          }}
        />

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-area[data-active="true"], .print-area[data-active="true"] * { visibility: visible; }
            .print-area[data-active="true"] { position: fixed; left: 0; top: 0; width: 100%; padding: 20px; }
          }
          @media screen {
            .print-area { display: none; }
          }
        `}</style>

        {appointments.map((apt) => {
          const isActive = String(printAppointmentId) === String(apt._id);
          const prescription = apt?.prescription || null;
          const medications = Array.isArray(prescription?.medications)
            ? prescription.medications
            : [];

          return (
            <div
              key={`print-${apt._id}`}
              className="print-area"
              data-active={isActive}
            >
              {isActive && prescription && (
                <div className="mx-auto max-w-3xl rounded-[22px] border border-slate-200 bg-white p-4 text-[11px] leading-5 text-slate-800 shadow-sm">
                  <div className="rounded-[18px] border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
                    <div className="mb-3 flex items-start justify-between border-b border-slate-200 pb-3">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.25em] text-slate-500">
                          Medical Prescription
                        </p>
                        <h2 className="mt-1 text-[16px] font-semibold text-slate-900">
                          {apt?.doctor?.clinicName || "العيادة الطبية"}
                        </h2>
                        <p className="text-[10px] text-slate-600">
                          {apt?.doctorId?.name ||
                            apt?.doctor?.name ||
                            "الدكتور"}
                        </p>
                      </div>
                      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                        {formatDateSafe(apt?.date)}
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2">
                      <div>
                        <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Patient Name
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-900">
                          {apt?.patientId?.name || "المريض"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Date
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-900">
                          {formatDateSafe(apt?.date)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Diagnosis
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-900">
                          {prescription.diagnosis || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="bg-slate-100 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Medications
                      </div>
                      <div className="divide-y divide-slate-100">
                        {medications.map((med, idx) => (
                          <div key={idx} className="px-2 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[9px] font-semibold text-slate-900">
                                  {med?.name || ""}
                                </p>
                                <p className="mt-0.5 text-[8px] text-slate-600">
                                  {med?.dosage || ""}
                                </p>
                              </div>
                              <div className="text-left text-[8px] text-slate-600">
                                <div>{med?.frequency || ""}</div>
                                <div className="mt-0.5 italic text-slate-500">
                                  {med?.instructions || med?.duration || ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                      <div className="text-[8px] text-slate-600">
                        <p>📱 امسح الرمز لعرض الروشتة رقمياً</p>
                      </div>
                      <div className="w-24 rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
                        <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Signature
                        </p>
                        <div className="mt-2 h-6 border-b border-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <IntakeFormViewModal
          isOpen={!!intakeViewAppointment}
          onClose={() => setIntakeViewAppointment(null)}
          appointment={intakeViewAppointment}
        />

        <Modal
          isOpen={!!intakeEditAppointment}
          onClose={() => {
            if (intakeEditLoading) return;
            setIntakeEditAppointment(null);
            setIntakeEditForm(null);
          }}
          title={
            intakeEditAppointment?.intakeForm
              ? t("pages_SecretaryAppointmentsList.text_update_intake", {
                  defaultValue: "تحديث استمارة الفحص الطبي",
                })
              : t("pages_SecretaryAppointmentsList.text_record_intake", {
                  defaultValue: "تسجيل استمارة الفحص الطبي",
                })
          }
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={intakeEditLoading}
                onClick={() => {
                  setIntakeEditAppointment(null);
                  setIntakeEditForm(null);
                }}
              >
                {t("pages_SecretaryAppointmentsList.text_cancel", {
                  defaultValue: "إلغاء",
                })}
              </Button>
              <Button
                variant="primary"
                disabled={intakeEditLoading}
                onClick={handleSaveIntakeForm}
              >
                {intakeEditLoading
                  ? t("pages_SecretaryAppointmentsList.text_saving", {
                      defaultValue: "جاري الحفظ...",
                    })
                  : t("pages_SecretaryAppointmentsList.text_save_intake", {
                      defaultValue: "حفظ الاستمارة",
                    })}
              </Button>
            </div>
          }
        >
          {intakeEditForm && (
            <div className="space-y-4">
              {Array.isArray(intakeEditForm.customQuestionList) &&
              intakeEditForm.customQuestionList.length > 0 ? (
                <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <p className="font-semibold text-gray-900 text-sm">
                    أسئلة المريض المخصصة
                  </p>
                  {intakeEditForm.customQuestionList.map((question) => {
                    const questionId = question?.id;
                    const label =
                      question?.questionText || questionId || "سؤال";
                    const type = question?.type || "text";
                    const value =
                      intakeEditForm.customAnswers?.[questionId] ??
                      (type === "boolean" ? false : "");

                    return (
                      <div key={questionId}>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          {label}
                        </label>
                        {type === "textarea" ? (
                          <textarea
                            value={value || ""}
                            onChange={(e) =>
                              setIntakeEditForm({
                                ...intakeEditForm,
                                customAnswers: {
                                  ...(intakeEditForm.customAnswers || {}),
                                  [questionId]: e.target.value,
                                },
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        ) : type === "boolean" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setIntakeEditForm({
                                  ...intakeEditForm,
                                  customAnswers: {
                                    ...(intakeEditForm.customAnswers || {}),
                                    [questionId]: true,
                                  },
                                })
                              }
                              className={`rounded-lg px-3 py-2 text-sm font-medium ${value ? "bg-purple-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setIntakeEditForm({
                                  ...intakeEditForm,
                                  customAnswers: {
                                    ...(intakeEditForm.customAnswers || {}),
                                    [questionId]: false,
                                  },
                                })
                              }
                              className={`rounded-lg px-3 py-2 text-sm font-medium ${value === false ? "bg-purple-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={value || ""}
                            onChange={(e) =>
                              setIntakeEditForm({
                                ...intakeEditForm,
                                customAnswers: {
                                  ...(intakeEditForm.customAnswers || {}),
                                  [questionId]: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الشكوى الرئيسية
                    </label>
                    <textarea
                      value={intakeEditForm.chiefComplaint}
                      onChange={(e) =>
                        setIntakeEditForm({
                          ...intakeEditForm,
                          chiefComplaint: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ضغط الدم
                      </label>
                      <input
                        type="text"
                        value={intakeEditForm.vitals.bloodPressure}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            vitals: {
                              ...intakeEditForm.vitals,
                              bloodPressure: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السكري
                      </label>
                      <input
                        type="text"
                        value={intakeEditForm.vitals.diabetes}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            vitals: {
                              ...intakeEditForm.vitals,
                              diabetes: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحساسيات الدوائية
                    </label>
                    <textarea
                      value={intakeEditForm.allergies}
                      onChange={(e) =>
                        setIntakeEditForm({
                          ...intakeEditForm,
                          allergies: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-4 p-3 rounded-lg bg-gray-50 border border-purple-100">
                    <p className="font-semibold text-gray-900 text-sm">
                      التاريخ الطبي
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeEditForm.medicalHistory.smoking}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            medicalHistory: {
                              ...intakeEditForm.medicalHistory,
                              smoking: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        هل المريض يدخن؟
                      </span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        عمليات القلب (إن وجدت)
                      </label>
                      <input
                        type="text"
                        value={intakeEditForm.medicalHistory.heartSurgeries}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            medicalHistory: {
                              ...intakeEditForm.medicalHistory,
                              heartSurgeries: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تاريخ عائلي بأمراض القلب
                      </label>
                      <input
                        type="text"
                        value={intakeEditForm.medicalHistory.familyHeartHistory}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            medicalHistory: {
                              ...intakeEditForm.medicalHistory,
                              familyHeartHistory: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        مشاكل في الصدر (إن وجدت)
                      </label>
                      <input
                        type="text"
                        value={intakeEditForm.medicalHistory.chestProblems}
                        onChange={(e) =>
                          setIntakeEditForm({
                            ...intakeEditForm,
                            medicalHistory: {
                              ...intakeEditForm.medicalHistory,
                              chestProblems: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحمل أو الرضاعة (للمريضات)
                    </label>
                    <input
                      type="text"
                      value={intakeEditForm.pregnancyOrLactation}
                      onChange={(e) =>
                        setIntakeEditForm({
                          ...intakeEditForm,
                          pregnancyOrLactation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};
