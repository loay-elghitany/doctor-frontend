import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { Table, Tabs } from "../components/ui/DataDisplay";
import { Button, Badge, Card, Alert, Spinner, Modal } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { getStatusLabel, handleApiError } from "../utils/helpers";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { debugLog, debugError } from "../utils/debug";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";

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

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "reschedule_proposed", label: "Awaiting Reschedule" },
  ];

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

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter((appointment) => {
    if (activeTab === "all") return true;
    return (appointment?.status || "") === activeTab;
  });

  // Status badge colors
  const getStatusColor = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();
    switch (normalizedStatus) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      case "reschedule_proposed":
        return "info";
      case "scheduled":
        return "primary";
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
      render: (_, appointment) => {
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
      render: (_, appointment) => (
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
      render: (_, appointment) => (
        <Badge variant={getStatusColor(appointment?.status)}>
          {getStatusLabel(appointment?.status)}
        </Badge>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (_, appointment) => (
        <div className="max-w-xs truncate text-sm">{appointment?.notes}</div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, appointment) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/secretary/appointments/${appointment?._id}`)
            }
          >
            View
          </Button>
        </div>
      ),
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
      </div>
    </MainLayout>
  );
};
