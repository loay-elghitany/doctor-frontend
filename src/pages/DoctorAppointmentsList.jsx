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
import { getStatusLabel, parseDate, handleApiError } from "../utils/helpers";
import {
  normalizeStatus,
  buildStatusTabs,
} from "../utils/appointmentStatus.js";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { getAppointmentPermissions } from "../utils/appointmentPermissions.js";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";
import { RescheduleModal } from "../components/appointments/RescheduleModal.jsx";
import { debugLog, debugError } from "../utils/debug";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  Filter,
  Search,
  FileText,
  RotateCcw,
} from "lucide-react";
/**
 * DoctorAppointmentsList - Display and manage appointments for authenticated doctor
 * Fetches appointments using doctor authentication from JWT token
 * Allows doctor to accept, reject, or propose reschedule times
 */
export const DoctorAppointmentsList = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const tabs = buildStatusTabs(appointments);

  // Fetch doctor appointments on mount
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("DoctorAppointmentsList", "Fetching doctor appointments");
      const response = await appointmentService.getAppointments();

      // Handle response format: data.data is array of appointments
      const appointmentsList = response.data?.data || [];
      debugLog("DoctorAppointmentsList", "Appointments fetched", {
        count: appointmentsList.length,
      });

      setAppointments(Array.isArray(appointmentsList) ? appointmentsList : []);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("DoctorAppointmentsList", "Failed to fetch appointments", err);
      setError(errorMsg || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Modal and cleanup states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Filter appointments by active tab
  const filteredAppointments =
    activeTab === "all"
      ? appointments
      : appointments.filter((apt) => {
          const effectiveStatus = normalizeStatus(apt.status);
          return effectiveStatus === activeTab;
        });

  const normalizedStatusCounts = appointments.reduce((counts, appointment) => {
    const effectiveStatus = normalizeStatus(appointment?.status);
    if (!effectiveStatus) return counts;
    counts[effectiveStatus] = (counts[effectiveStatus] || 0) + 1;
    return counts;
  }, {});

  React.useEffect(() => {
    if (activeTab !== "all" && !normalizedStatusCounts[activeTab]) {
      setActiveTab("all");
    }
  }, [activeTab, normalizedStatusCounts]);

  // Format display data
  const columns = [
    { key: "patientName", label: "Patient" },
    {
      key: "date",
      label: "Date & Time",
      render: (appointment, value) => {
        return `${formatDateSafe(appointment.date)} ${appointment.timeSlot || ""}`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (_appointment, value) => {
        const effectiveStatus = normalizeStatus(value);
        return (
          <Badge variant={String(effectiveStatus || "unknown")}>
            {getStatusLabel(value)}
          </Badge>
        );
      },
    },
  ];

  const handleAccept = async (appointment) => {
    try {
      debugLog("DoctorAppointmentsList", "Accepting appointment", {
        appointmentId: appointment._id,
      });
      // Send 'scheduled' status (backend will convert legacy 'confirmed' to 'scheduled' if sent)
      // Doctor accept must result in a scheduled upcoming appointment, not completed
      await appointmentService.updateAppointmentStatus(
        appointment._id,
        "scheduled",
        appointment.date,
        appointment.timeSlot,
      );

      setSuccess("Appointment scheduled!");
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointment._id ? { ...apt, status: "scheduled" } : apt,
        ),
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("DoctorAppointmentsList", "Failed to accept appointment", err);
      setError(errorMsg || "Failed to confirm appointment");
    }
  };

  const handleReject = async (appointment) => {
    try {
      debugLog("DoctorAppointmentsList", "Rejecting appointment", {
        appointmentId: appointment._id,
      });
      await appointmentService.cancelDoctorAppointment(appointment._id);

      setSuccess("Appointment cancelled!");
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointment._id ? { ...apt, status: "cancelled" } : apt,
        ),
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("DoctorAppointmentsList", "Failed to cancel appointment", err);
      setError(errorMsg || "Failed to cancel appointment");
    }
  };

  const handleMarkCompleted = async (appointment) => {
    try {
      debugLog("DoctorAppointmentsList", "Marking appointment completed", {
        appointmentId: appointment._id,
      });
      await appointmentService.markAppointmentCompleted(appointment._id);

      setSuccess("Appointment marked as completed!");
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointment._id ? { ...apt, status: "completed" } : apt,
        ),
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError(
        "DoctorAppointmentsList",
        "Failed to mark appointment completed",
        err,
      );
      setError(errorMsg || "Failed to mark appointment as completed");
    }
  };

  const handleProposeTimes = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const isDeletable = (appointment) => {
    if (!appointment) return false;
    const status = appointment.status;
    const now = new Date();
    const appointmentDate = parseDate(appointment.date);
    const datePast = appointmentDate ? appointmentDate < now : false;
    if (status === "cancelled") return true;
    if (status === "completed") return true;
    // Prevent deletion of future scheduled or confirmed appointments
    if (datePast && status !== "confirmed" && status !== "scheduled")
      return true; // expired
    return false;
  };

  const confirmDelete = (appointment) => {
    setDeletingAppointment(appointment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAppointment) return;
    try {
      setLoading(true);
      await appointmentService.softDeleteAppointment(deletingAppointment._id);
      setSuccess("Appointment removed from dashboard.");
      setAppointments((prev) =>
        prev.filter((a) => a._id !== deletingAppointment._id),
      );
      setShowDeleteModal(false);
      setDeletingAppointment(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("DoctorAppointmentsList", "Failed to delete appointment", err);
      setError(errorMsg || "Failed to delete appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCleanup = () => {
    setShowCleanupModal(true);
  };

  const handleBulkCleanup = async () => {
    try {
      setCleanupLoading(true);
      const response = await appointmentService.bulkCleanupAppointments();
      const deletedCount = response.data?.data?.deletedCount || 0;
      setSuccess(`${deletedCount} appointment(s) removed.`);
      // Refresh list to reflect changes
      await fetchAppointments();
      setShowCleanupModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("DoctorAppointmentsList", "Bulk cleanup failed", err);
      setError(errorMsg || "Bulk cleanup failed");
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout userType="doctor">
        <div className="flex justify-center items-center min-h-screen">
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
    completed: appointments.filter(
      (apt) => normalizeStatus(apt.status) === "completed",
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
      icon: Users,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      gradient: "from-purple-500 to-violet-400",
    },
  ];

  const quickActions = [
    {
      icon: Filter,
      label: "Filter",
      onClick: () => setActiveTab(activeTab === "all" ? "pending" : "all"),
    },
    {
      icon: RotateCcw,
      label: "Clean Old",
      onClick: handleOpenCleanup,
    },
  ];

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-blue-600 dark:text-blue-400 mb-3 font-semibold"
                  >
                    Appointment Management
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
                    Manage your schedule, accept or reschedule appointments.
                  </motion.p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl"
          >
            {success}
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
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
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

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete appointment?"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to delete this appointment? This action will
            only remove it from your dashboard.
          </p>
        </Modal>

        <Modal
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          title="Clean Old Appointments"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCleanupModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleBulkCleanup}
                disabled={cleanupLoading}
              >
                {cleanupLoading ? "Cleaning..." : "Proceed"}
              </Button>
            </>
          }
        >
          <p>
            This will remove all cancelled, completed, and expired appointments
            from your dashboard. You will be shown how many will be removed and
            can cancel.
          </p>
          <p className="mt-4 font-semibold">
            {appointments.filter(isDeletable).length} appointment(s) will be
            removed.
          </p>
        </Modal>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading appointments..." />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments"
            description={`No ${activeTab !== "all" ? activeTab : ""} appointments found in this category.`}
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
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
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
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowPrescriptions(true);
                              }}
                              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                              title="Prescriptions"
                            >
                              <FileText className="w-4 h-4" />
                            </motion.button>

                            {permissions.canConfirm && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAccept(appointment)}
                                className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
                                title="Accept"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}

                            {permissions.canCancel && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReject(appointment)}
                                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </motion.button>
                            )}

                            {permissions.canReschedule && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleProposeTimes(appointment)}
                                className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                                title="Reschedule"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </motion.button>
                            )}

                            {permissions.canMarkCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMarkCompleted(appointment)}
                                className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition"
                              >
                                Complete
                              </motion.button>
                            )}

                            {permissions.canDelete && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => confirmDelete(appointment)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {appointment.status === "reschedule_proposed" && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                          Awaiting patient response to reschedule proposal
                        </div>
                      )}

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
          role="doctor"
          onSuccess={async () => {
            await fetchAppointments();
            setSuccess("Reschedule options proposed successfully.");
          }}
        />

        {/* Prescriptions Modal */}
        {showPrescriptions && selectedAppointment && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <motion.div
              className="max-w-2xl w-full bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <PrescriptionModal
                appointmentId={selectedAppointment._id}
                userRole="doctor"
                onClose={() => {
                  setShowPrescriptions(false);
                  setSelectedAppointment(null);
                }}
                onSuccess={() => {
                  // Optionally refresh appointments if needed
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};
