import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { Table, Tabs } from "../components/ui/DataDisplay";
import { Button, Badge, Card, Alert, Spinner } from "../components/ui";
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

  return (
    <MainLayout userType="secretary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Appointments
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage clinic appointments
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/secretary/appointments/new")}
            >
              New Appointment
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && <Alert type="success" message={success} className="mb-6" />}
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-6"
        />

        {/* Appointments Table */}
        <Card>
          <Table
            columns={columns}
            data={filteredAppointments}
            emptyMessage="No appointments found"
          />
        </Card>

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
