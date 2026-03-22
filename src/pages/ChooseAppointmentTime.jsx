import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Button, Card, Alert, Spinner } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";

/**
 * ChooseAppointmentTime - Patient selects one of doctor's proposed reschedule times
 * Displays 3 reschedule options and submits selected optionIndex to backend
 */
export const ChooseAppointmentTime = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [appointment, setAppointment] = useState(null);

  // Fetch appointment to get reschedule options
  useEffect(() => {
    const fetchAppointment = async () => {
      setLoading(true);
      setError("");
      try {
        debugLog("ChooseAppointmentTime", "Fetching appointment details", {
          appointmentId: id,
        });

        // Fetch patient's appointments to find the specific one
        const response = await appointmentService.getPatientAppointments();
        const appointments = response.data?.data || [];
        const appt = appointments.find((a) => a._id === id);

        if (!appt) {
          setError("Appointment not found");
          return;
        }

        if (!appt.rescheduleOptions || appt.rescheduleOptions.length === 0) {
          setError("No reschedule options available for this appointment");
          return;
        }

        debugLog("ChooseAppointmentTime", "Appointment fetched", {
          appointmentId: id,
          optionCount: appt.rescheduleOptions.length,
        });

        setAppointment(appt);
      } catch (err) {
        const errorMsg = handleApiError(err);
        debugError("ChooseAppointmentTime", "Failed to fetch appointment", err);
        setError(errorMsg || "Failed to load appointment details");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleChooseTime = async (optionIndex) => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      debugLog("ChooseAppointmentTime", "Submitting choice", {
        appointmentId: id,
        optionIndex,
      });

      await appointmentService.chooseAppointmentTime(id, optionIndex);

      setSuccess("Time selected successfully!");
      debugLog("ChooseAppointmentTime", "Choice submitted successfully");

      // Redirect to patient dashboard after brief delay
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 1500);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("ChooseAppointmentTime", "Failed to choose time", err);
      setError(errorMsg || "Failed to choose time");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout userType="patient">
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!appointment) {
    return (
      <MainLayout userType="patient">
        <div className="max-w-2xl mx-auto">
          <Alert
            type="danger"
            message={error || "Could not load appointment"}
            onClose={() => navigate("/patient/dashboard")}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="patient">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Choose Appointment Time
        </h1>

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

        <Card header={<h2 className="text-xl font-bold">Available Times</h2>}>
          <div className="space-y-4">
            {appointment.rescheduleOptions.map((option, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === index
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedOption(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(option.date).toLocaleDateString()} at{" "}
                      {option.timeSlot}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="time-option"
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                    disabled={submitting}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              variant="primary"
              disabled={selectedOption === null || submitting}
              onClick={() => handleChooseTime(selectedOption)}
            >
              {submitting ? "Confirming..." : "Confirm Selection"}
            </Button>
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate("/patient/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
