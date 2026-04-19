import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { Button, Card, Alert, Spinner, Input } from "../components/ui";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";

/**
 * SecretaryCreateAppointment - Create new appointments for patients
 */
export const SecretaryCreateAppointment = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    date: "",
    timeSlot: "09:00",
    notes: "",
  });

  // Fetch patients on mount
  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients();
      setPatients(response.data?.data || []);
    } catch (err) {
      debugError("SecretaryCreateAppointment", "Failed to fetch patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!appointmentData.patientId || !appointmentData.date) {
      setError("Patient and date are required");
      setLoading(false);
      return;
    }

    try {
      await appointmentService.createSecretaryAppointment(appointmentData);

      setSuccess("Appointment created successfully");
      setTimeout(() => {
        navigate("/secretary/appointments");
      }, 2000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      debugError(
        "SecretaryCreateAppointment",
        "Failed to create appointment",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  // Time slot options
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
  ];

  return (
    <MainLayout userType="secretary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Appointment
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Schedule a new appointment for a patient
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate("/secretary/appointments")}
            >
              Back to Appointments
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && <Alert type="success" message={success} className="mb-6" />}
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Patient"
              type="select"
              value={appointmentData.patientId}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  patientId: e.target.value,
                })
              }
              required
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </Input>

            <Input
              label="Date"
              type="date"
              value={appointmentData.date}
              onChange={(e) =>
                setAppointmentData({ ...appointmentData, date: e.target.value })
              }
              required
            />

            <Input
              label="Time Slot"
              type="select"
              value={appointmentData.timeSlot}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  timeSlot: e.target.value,
                })
              }
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Input>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    notes: e.target.value,
                  })
                }
                className="input-base"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/secretary/appointments")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Create Appointment"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};
