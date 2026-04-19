import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Card, Badge, Button, Spinner, Alert } from "../components/ui";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import { getStatusLabel } from "../utils/helpers";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { debugLog, debugError } from "../utils/debug";

/**
 * SecretaryPatientDetails - Display detailed view of a specific patient
 */
export const SecretaryPatientDetails = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch patient details and appointments
  const fetchPatientDetails = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryPatientDetails", "Fetching patient details", {
        patientId,
      });

      // Fetch all patients
      const patientsResponse = await patientService.getPatients();
      const patientsList = patientsResponse.data?.data || [];
      const foundPatient = patientsList.find((p) => p?._id === patientId);

      if (!foundPatient) {
        setError("Patient not found");
        return;
      }

      setPatient(foundPatient);

      // Fetch appointments and filter by patient
      const appointmentsResponse = await appointmentService.getAppointments();
      const appointmentsList = appointmentsResponse.data?.data || [];
      const patientAppointments = appointmentsList.filter(
        (app) => app?.patientId?._id === patientId,
      );

      setAppointments(patientAppointments);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch patient details";
      // Don't set error for 401s as they trigger logout automatically
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError("SecretaryPatientDetails", "Failed to fetch patient", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  // Status badge colors (same as in other lists)
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

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout userType="secretary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert type="error" message={error} />
          <div className="mt-6">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="secretary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Patient Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View patient information and appointments
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>

        {/* Patient Info Card */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Patient Information
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.email || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.phoneNumber || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateSafe(patient?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appointments Card */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Appointments ({appointments.length})
            </h3>
          </div>
          <div className="px-6 py-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No appointments found for this patient.
              </p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatDateSafe(appointment?.date)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment?.timeSlot || "—"}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(appointment?.status)}>
                          {getStatusLabel(appointment?.status)}
                        </Badge>
                      </div>
                      {appointment?.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/secretary/appointments/${appointment._id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
