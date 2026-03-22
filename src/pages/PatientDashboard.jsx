import React, { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/Layout";
import { AppointmentCard } from "../components/Appointment/AppointmentCard";
import { Spinner, Alert } from "../components/ui";
import { PatientTimeline } from "../components/PatientTimeline";
import { appointmentService } from "../services/appointmentService";
import { formatDate, handleApiError } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";

// PatientDashboard fetches upcoming appointments and displays the next 5
export const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");

  useEffect(() => {
    // Fetch upcoming appointments for the authenticated patient
    const fetchUpcoming = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await appointmentService.getUpcomingAppointments();
        // Expecting res.data to be { success, message, data }
        const data = res.data?.data || [];

        // Sort appointments by date (upcoming first, including cancelled)
        // This ensures patients see all appointments including when they were cancelled
        const sorted = data
          .slice()
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          // No date filtering here - show all appointments (past and future)
          // to keep visibility of cancelled appointments
          .slice(0, 5);

        setAppointments(sorted);

        // If backend returns patient info in payload, use it for greeting
        if (res.data?.data?.patientName)
          setPatientName(res.data.data.patientName);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  const handleRescheduleAction = (appointment) => {
    if (appointment.status === "reschedule_proposed") {
      navigate(`/patient/appointments/${appointment._id}/choose`);
    }
  };

  const handleHideAppointment = async (appointment) => {
    try {
      await appointmentService.hideAppointment(appointment._id, true);
      // Remove from display
      setAppointments(
        appointments.filter((apt) => apt._id !== appointment._id),
      );
      setSelectedAppointment(null);
      // Optionally show a success message
    } catch (err) {
      setError(handleApiError(err) || "Failed to hide appointment");
    }
  };

  return (
    <MainLayout userType="patient">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {patientName ? `Hello, ${patientName}` : "Hello"}
        </h1>

        <div className="card">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === "appointments"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Upcoming Appointments
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === "timeline"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Medical Timeline
            </button>
          </div>

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <Alert type="danger" message={error} />
              ) : appointments.length === 0 ? (
                <p className="text-gray-600">
                  You have no upcoming appointments.
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt._id || apt.id}>
                      <AppointmentCard
                        appointment={apt}
                        onView={() => setSelectedAppointment(apt)}
                        onAction={() => handleRescheduleAction(apt)}
                        onHide={() => handleHideAppointment(apt)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div>
              <PatientTimeline />
            </div>
          )}
        </div>

        {/* Placeholder modal behavior: clicking a card will set selectedAppointment. */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="max-w-xl w-full bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Appointment Details</h3>

              {/* Cancellation Notice */}
              {selectedAppointment.status === "cancelled" && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <p className="font-semibold">
                    Doctor Cancelled This Appointment
                  </p>
                  <p className="text-sm mt-1">
                    Your doctor has cancelled this appointment. You may remove
                    it from your dashboard if you no longer need to see it.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p>
                  <strong>Doctor: </strong>
                  {selectedAppointment.doctor?.name ||
                    selectedAppointment.doctorName ||
                    "Doctor"}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(selectedAppointment.date)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      selectedAppointment.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : selectedAppointment.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : selectedAppointment.status === "scheduled" ||
                              selectedAppointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : selectedAppointment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedAppointment.status ===
                                  "reschedule_proposed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedAppointment.status}
                  </span>
                </p>
                {selectedAppointment.notes && (
                  <p>
                    <strong>Notes:</strong> {selectedAppointment.notes}
                  </p>
                )}

                {/* Display reschedule options if present */}
                {selectedAppointment.status === "reschedule_proposed" &&
                  selectedAppointment.rescheduleOptions?.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-bold text-gray-900 mb-3">
                        Proposed Times
                      </h4>
                      <div className="space-y-2">
                        {selectedAppointment.rescheduleOptions.map(
                          (opt, idx) => (
                            <div
                              key={idx}
                              className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-gray-900 font-medium">
                                  {new Date(opt.date).toLocaleDateString()} at{" "}
                                  {opt.timeSlot}
                                </p>
                                {opt.chosen && (
                                  <p className="text-sm text-green-600 font-medium">
                                    (Selected)
                                  </p>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedAppointment.status !== "cancelled" && (
                  <button
                    onClick={() => setShowPrescriptions(true)}
                    className="btn-primary bg-blue-600 hover:bg-blue-700"
                  >
                    View Prescriptions
                  </button>
                )}
                {selectedAppointment.status === "reschedule_proposed" && (
                  <button
                    onClick={() => {
                      handleRescheduleAction(selectedAppointment);
                      setSelectedAppointment(null);
                    }}
                    className="btn-primary bg-purple-600 hover:bg-purple-700"
                  >
                    Choose Time
                  </button>
                )}
                {selectedAppointment.status === "cancelled" && (
                  <button
                    onClick={() => handleHideAppointment(selectedAppointment)}
                    className="btn-secondary bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Remove from Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions Modal */}
        {showPrescriptions && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto">
              <PrescriptionModal
                appointmentId={selectedAppointment._id}
                userRole="patient"
                onClose={() => {
                  setShowPrescriptions(false);
                  setSelectedAppointment(null);
                }}
                onSuccess={() => {
                  // Optionally refresh appointment if prescription was relevant
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
