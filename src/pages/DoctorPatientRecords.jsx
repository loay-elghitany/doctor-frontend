import React, { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/Layout";
import { Spinner, Alert } from "../components/ui";
import { DoctorPatientTimeline } from "../components/DoctorPatientTimeline";
import DoctorPatientFiles from "../components/DoctorPatientFiles";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";
import api from "../services/api";

export const DoctorPatientRecords = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, upcoming, past, cancelled
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] =
    useState(null);
  const [patientAppointments, setPatientAppointments] = useState({});
  const [appointmentLoading, setAppointmentLoading] = useState({});
  const [filesModal, setFilesModal] = useState({
    open: false,
    patientId: null,
    appointmentId: null,
  });

  // Fetch all patients for this doctor
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError("");
      try {
        debugLog("DoctorPatientRecords", "Fetching patients");
        const response = await api.get("/doctors/patients");

        const data = response.data?.data || [];
        debugLog("DoctorPatientRecords", "Patients retrieved", {
          count: data.length,
        });

        setPatients(data);
      } catch (err) {
        const errorMsg = handleApiError(err);
        debugError("DoctorPatientRecords", "Failed to fetch patients", err);
        setError(errorMsg || "Failed to load patient records");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Fetch appointments for a specific patient
  const fetchPatientAppointments = async (patientId) => {
    if (patientAppointments[patientId]) {
      // Already loaded, just toggle expansion
      return;
    }

    setAppointmentLoading((prev) => ({
      ...prev,
      [patientId]: true,
    }));

    try {
      const response = await api.get(
        `/doctors/patients/${patientId}/appointments`,
      );
      const appointments = response.data?.data || [];

      setPatientAppointments((prev) => ({
        ...prev,
        [patientId]: appointments,
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to fetch appointments", err);
      setPatientAppointments((prev) => ({
        ...prev,
        [patientId]: [],
      }));
    } finally {
      setAppointmentLoading((prev) => ({
        ...prev,
        [patientId]: false,
      }));
    }
  };

  // Handle patient expansion
  const handleExpandPatient = async (patientId) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
    } else {
      await fetchPatientAppointments(patientId);
      setExpandedPatientId(patientId);
    }
  };

  // Filter and search patients
  const filteredPatients = patients.filter((patient) => {
    // Search filter
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Status filter
    if (filterType === "all") return true;

    const now = new Date();
    const hasUpcoming = patient.lastAppointmentDate
      ? new Date(patient.lastAppointmentDate) >= now
      : false;
    const hasPast = patient.lastAppointmentDate
      ? new Date(patient.lastAppointmentDate) < now
      : false;
    const hasCancelled =
      patient.statusSummary && patient.statusSummary.includes("cancelled");

    if (filterType === "upcoming") return hasUpcoming;
    if (filterType === "past") return hasPast;
    if (filterType === "cancelled") return hasCancelled;

    return true;
  });

  return (
    <MainLayout userType="doctor">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>

        {error && <Alert type="danger" message={error} />}

        {/* Timeline View - Show if patient selected */}
        {selectedPatientForTimeline ? (
          <div className="card">
            <button
              onClick={() => setSelectedPatientForTimeline(null)}
              className="mb-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Patient List
            </button>
            <DoctorPatientTimeline
              patientId={selectedPatientForTimeline.id}
              patientName={selectedPatientForTimeline.name}
            />
          </div>
        ) : (
          <>
            {/* Search and Filter Section */}
            <div className="card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Patients</option>
                  <option value="upcoming">
                    Patients with Upcoming Appointments
                  </option>
                  <option value="past">Patients with Past Appointments</option>
                  <option value="cancelled">
                    Patients with Cancelled Appointments
                  </option>
                </select>
              </div>

              <p className="text-sm text-gray-600">
                Showing {filteredPatients.length} of {patients.length} patients
              </p>
            </div>

            {/* Patients List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">
                  {searchTerm || filterType !== "all"
                    ? "No patients match your search criteria."
                    : "No patients found. Create the first appointment to add patients."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="card">
                    {/* Patient Header - Clickable to expand */}
                    <div
                      onClick={() => handleExpandPatient(patient.id)}
                      className="cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {patient.email}
                          </p>
                          {patient.phone && (
                            <p className="text-sm text-gray-600">
                              {patient.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">
                            {patient.totalAppointments} appointment
                            {patient.totalAppointments !== 1 ? "s" : ""}
                          </p>
                          {patient.lastAppointmentDate && (
                            <p className="text-sm text-gray-600 mt-1">
                              Last:{" "}
                              {new Date(
                                patient.lastAppointmentDate,
                              ).toLocaleDateString()}
                            </p>
                          )}
                          <span className="ml-4 text-gray-400">
                            {expandedPatientId === patient.id ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>

                      {/* Status Summary Badges */}
                      {patient.statusSummary &&
                        patient.statusSummary.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {Array.from(new Set(patient.statusSummary)).map(
                              (status) => (
                                <span
                                  key={status}
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    status === "confirmed"
                                      ? "bg-green-100 text-green-800"
                                      : status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : status === "cancelled"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {status}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                    </div>

                    {/* Appointment History - Expandable */}
                    {expandedPatientId === patient.id && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        {/* Medical Timeline Button */}
                        <div>
                          <button
                            onClick={() =>
                              setSelectedPatientForTimeline(patient)
                            }
                            className="w-full btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            📊 View Medical Timeline
                          </button>
                        </div>

                        {/* Appointments */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Appointment History
                          </h4>

                          {appointmentLoading[patient.id] ? (
                            <div className="flex justify-center py-4">
                              <Spinner size="sm" />
                            </div>
                          ) : patientAppointments[patient.id]?.length === 0 ? (
                            <p className="text-gray-600 text-sm">
                              No appointments found.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {patientAppointments[patient.id]?.map(
                                (apt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">
                                        {new Date(
                                          apt.date,
                                        ).toLocaleDateString()}{" "}
                                        at {apt.timeSlot}
                                      </p>
                                      {apt.notes && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {apt.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() =>
                                          setFilesModal({
                                            open: true,
                                            patientId: patient.id,
                                            appointmentId: apt._id,
                                          })
                                        }
                                        className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                      >
                                        Patient Files
                                      </button>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          apt.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : apt.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : apt.status === "cancelled"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {apt.status}
                                      </span>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {/* Files Modal */}
      {filesModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="max-w-3xl w-full bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <DoctorPatientFiles
              patientId={filesModal.patientId}
              appointmentId={filesModal.appointmentId}
              onClose={() =>
                setFilesModal({
                  open: false,
                  patientId: null,
                  appointmentId: null,
                })
              }
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};
