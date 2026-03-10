import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Table, Tabs } from "../components/ui/DataDisplay";
import { Button, Badge, Card, Alert, Spinner, Modal } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";

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

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "cancelled", label: "Cancelled" },
    { id: "reschedule_proposed", label: "Awaiting Reschedule" },
  ];

  // Fetch doctor appointments on mount
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("DoctorAppointmentsList", "Fetching doctor appointments");
      const response = await appointmentService.getDoctorAppointments();

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

  // Filter appointments by active tab
  const filteredAppointments =
    activeTab === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === activeTab);

  // Format display data
  const columns = [
    { key: "patientName", label: "Patient" },
    {
      key: "date",
      label: "Date & Time",
      render: (apt) => {
        if (!apt.date || !apt.timeSlot) return "-";
        const dateObj = new Date(apt.date);
        return `${dateObj.toLocaleDateString()} ${apt.timeSlot}`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <Badge variant={val}>{val}</Badge>,
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

      setSuccess("Appointment confirmed!");
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
    debugLog("DoctorAppointmentsList", "Navigating to propose times", {
      appointmentId: appointment._id,
    });
    navigate(`/doctor/appointments/${appointment._id}/propose`);
  };

  const isDeletable = (appointment) => {
    if (!appointment) return false;
    const status = appointment.status;
    const now = new Date();
    const datePast = appointment.date
      ? new Date(appointment.date) < now
      : false;
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

  return (
    <MainLayout userType="doctor">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div>
            <Button variant="secondary" size="sm" onClick={handleOpenCleanup}>
              🧹 Clean Old Appointments
            </Button>
          </div>
        </div>

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

        <Card>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                No appointments in this category
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {appointment.patientId?.name || "Unknown Patient"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {appointment.date && appointment.timeSlot
                          ? `${new Date(appointment.date).toLocaleDateString()} ${appointment.timeSlot}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={appointment.status}>
                          {appointment.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowPrescriptions(true);
                          }}
                        >
                          Prescriptions
                        </Button>
                        {appointment.status === "pending" && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAccept(appointment)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(appointment)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleProposeTimes(appointment)}
                            >
                              Suggest Times
                            </Button>
                          </>
                        )}
                        {(appointment.status === "confirmed" ||
                          appointment.status === "scheduled") && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleMarkCompleted(appointment)}
                            >
                              Mark Completed
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(appointment)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {appointment.status === "reschedule_proposed" && (
                          <span className="text-sm text-gray-500">
                            Awaiting patient response
                          </span>
                        )}
                        {isDeletable(appointment) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => confirmDelete(appointment)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Prescriptions Modal */}
        {showPrescriptions && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto">
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
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
