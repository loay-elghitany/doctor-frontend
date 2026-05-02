import React, { useState, useEffect } from "react";
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
import { getStatusLabel, handleApiError } from "../utils/helpers";
import {
  normalizeStatus,
  buildStatusTabs,
} from "../utils/appointmentStatus.js";
import { getAppointmentPermissions } from "../utils/appointmentPermissions.js";
import { debugLog, debugError } from "../utils/debug";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";
import { RescheduleModal } from "../components/appointments/RescheduleModal.jsx";
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
} from "lucide-react";
/**
 * SecretaryAppointmentsList - Display and manage appointments for secretary's doctor
 * Fetches appointments using secretary authentication from JWT token
 * Allows secretary to view and manage appointments (similar to doctor but read-only for some actions)
 */
export const SecretaryAppointmentsList = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const tabs = buildStatusTabs(appointments);

  // Fetch secretary appointments on mount
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryAppointmentsList", "Fetching secretary appointments");
      const response = await appointmentService.getAppointments();

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
            item?._id === updatedAppointment._id ? updatedAppointment : item,
          ),
        );
      }
      setSuccess("Appointment scheduled successfully.");
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
            item?._id === updatedAppointment._id ? updatedAppointment : item,
          ),
        );
      }
      setSuccess("Appointment cancelled successfully.");
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
            item?._id === updatedAppointment._id ? updatedAppointment : item,
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

  const isRowLoading = (appointmentId, action) =>
    !!actionLoading[appointmentId]?.[action];

  const getStatusColor = (status) => {
    const normalizedStatus = normalizeStatus(
      String(status || "").toLowerCase(),
    );
    switch (normalizedStatus) {
      case "confirmed":
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
              View
            </Button>
            {permissions.canConfirm && (
              <Button
                variant="success"
                size="sm"
                disabled={isRowLoading(appointment._id, "confirm")}
                onClick={() => handleConfirmAppointment(appointment._id)}
              >
                {isRowLoading(appointment._id, "confirm")
                  ? "Confirming..."
                  : "Confirm"}
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
                  ? "Completing..."
                  : "Complete"}
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
      title: "Total",
      value: stats.total,
      icon: CalendarDays,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "Upcoming",
      value: stats.upcoming,
      icon: Clock,
      gradient: "from-emerald-500 to-green-400",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Filter,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: "New",
      onClick: () => navigate("/secretary/appointments/new"),
    },
    {
      icon: Stethoscope,
      label: "Patients",
      onClick: () => navigate("/secretary/patients"),
    },
    {
      icon: RotateCcw,
      label: "Refresh",
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
                    Clinic Schedule
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    Appointments
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    Manage and schedule patient appointments for the clinic.
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
                {tab.label}
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
            <LoadingSpinner size="lg" message="Loading appointments..." />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments"
            description={`No ${activeTab !== "all" ? activeTab : ""} appointments found.`}
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAppointments.map((appointment, index) => {
                const permissions = getAppointmentPermissions(
                  appointment.status,
                );
                const patientName =
                  appointment.patientId?.name || "Unknown Patient";

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

                          <div className="flex items-center gap-2">
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
                                  ? "..."
                                  : "Confirm"}
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
                                title="Cancel"
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
                                Reschedule
                              </motion.button>
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
                                title="Delete"
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
                            <span className="font-medium">Notes:</span>{" "}
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
      </div>
    </MainLayout>
  );
};
