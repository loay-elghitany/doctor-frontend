import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "./ui";
import PatientMedicalFiles from "./PatientMedicalFiles";
import { getPatientTimeline } from "../services/timelineService";
import { formatDate } from "../utils/helpers";

/**
 * Patient Medical Timeline Component
 * Displays aggregated appointments and prescriptions in chronological order
 */
export const PatientTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientTimeline();
      setTimeline(data.data || []);
    } catch (err) {
      console.error("Error loading timeline:", err);
      setError("Failed to load medical timeline");
    } finally {
      setLoading(false);
    }
  };

  // Group events by date
  const groupedByDate = timeline.reduce((acc, event) => {
    const dateKey = new Date(event.eventDate).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert type="danger" message={error} />;
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No medical records yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Your appointments and prescriptions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeline Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Medical Timeline</h2>
        <p className="text-gray-600 text-sm mt-1">
          {timeline.length} record{timeline.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Upload section for patient */}
      <PatientMedicalFiles />

      {/* Timeline Events */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-blue-200" />

        {/* Events */}
        <div className="space-y-6">
          {timeline.map((event, index) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline dot */}
              <div
                className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center -ml-4 ${
                  event.type === "appointment"
                    ? "bg-blue-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {event.type === "appointment" ? (
                  <span className="text-lg">📅</span>
                ) : (
                  <span className="text-lg">💊</span>
                )}
              </div>

              {/* Timeline Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(event.eventDate)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      event.type === "appointment"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {event.type === "appointment"
                      ? "Appointment"
                      : "Prescription"}
                  </span>
                </div>

                {/* Event Content based on type */}
                {event.type === "appointment" && (
                  <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Doctor:</span>{" "}
                        {event.metadata.doctorName}
                      </p>
                      {event.metadata.doctorSpecialization && (
                        <p className="text-gray-600">
                          <span className="font-medium">Specialty:</span>{" "}
                          {event.metadata.doctorSpecialization}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Time:</span>{" "}
                        {event.metadata.timeSlot}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Status:</span>
                        <span
                          className={`inline-block ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            event.metadata.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : event.metadata.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {event.metadata.status}
                        </span>
                      </p>
                    </div>

                    {event.metadata.notes && (
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Notes:</span>
                        </p>
                        <p className="text-gray-700 mt-1 italic">
                          {event.metadata.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {event.type === "prescription" && (
                  <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Medications:</span>
                      </p>
                      <p className="text-gray-700 mt-1">
                        {event.metadata.medicationSummary}
                      </p>
                    </div>

                    {event.metadata.diagnosis && (
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Diagnosis:</span>
                        </p>
                        <p className="text-gray-700 mt-1">
                          {event.metadata.diagnosis}
                        </p>
                      </div>
                    )}

                    {event.metadata.appointmentDate && (
                      <div>
                        <p className="text-gray-600 text-xs">
                          Linked to appointment on{" "}
                          {new Date(
                            event.metadata.appointmentDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
