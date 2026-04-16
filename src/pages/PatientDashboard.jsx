import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { AppointmentCard } from "../components/Appointment/AppointmentCard";
import { Spinner, Alert } from "../components/ui";
import { MedicalHeroIllustration } from "../components/illustrations/MedicalHeroIllustration";
import { GuidedTour } from "../components/GuidedTour";
import { PatientTimeline } from "../components/PatientTimeline";
import { appointmentService } from "../services/appointmentService";
import { formatDate, handleApiError } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";

const PATIENT_TOUR_STEPS = [
  {
    title: "Welcome to your care dashboard",
    description:
      "This is your central command for upcoming visits, health trends, and clinical updates.",
    tip: "Use the tour to find the most important patient tools quickly.",
  },
  {
    title: "Upcoming appointments",
    description:
      "Review appointment details, view prescriptions, and manage reschedule requests from one place.",
    tip: "Tap any appointment card to open details.",
  },
  {
    title: "Medical timeline",
    description:
      "Switch to your medical timeline to see all past care entries and progress over time.",
    tip: "Use the timeline tab to keep care history at your fingertips.",
  },
];

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
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    // Fetch upcoming appointments for the authenticated patient
    const fetchUpcoming = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await appointmentService.getAppointments();
        const payload = res.data?.data;
        const appointmentList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.appointments)
            ? payload.appointments
            : [];

        const sorted = appointmentList
          .slice()
          .sort((a, b) => new Date(a?.date) - new Date(b?.date))
          .slice(0, 5);

        setAppointments(sorted);

        if (
          typeof payload === "object" &&
          payload !== null &&
          payload.patientName
        )
          setPatientName(payload.patientName);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("clinic-tour-seen")) {
      setTimeout(() => setTourOpen(true), 600);
    }
  }, []);

  const handleTourNext = () => {
    setTourStep((prev) => Math.min(prev + 1, PATIENT_TOUR_STEPS.length - 1));
  };

  const handleTourBack = () => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTourClose = () => {
    setTourOpen(false);
    setTourStep(0);
    localStorage.setItem("clinic-tour-seen", "true");
  };

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
        <motion.div
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patientName ? `Hello, ${patientName}` : "Hello"}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-gray-600">
                Track your care, review upcoming visits, and keep every health
                update organized in one premium dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setTourOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Explore the tour
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  View timeline
                </button>
              </div>
            </div>
            <div className="hidden lg:block lg:w-80">
              <MedicalHeroIllustration />
            </div>
          </div>
        </motion.div>

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
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <motion.div
              className="max-w-xl w-full bg-white rounded-lg p-6"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
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
            </motion.div>
          </motion.div>
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
      <GuidedTour
        isOpen={tourOpen}
        steps={PATIENT_TOUR_STEPS}
        currentStep={tourStep}
        onNext={handleTourNext}
        onBack={handleTourBack}
        onClose={handleTourClose}
      />
    </MainLayout>
  );
};
