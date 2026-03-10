import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "./ui";
import {
  getDoctorPatientTimeline,
  addDoctorNote,
} from "../services/doctorTimelineService";
import { formatDate } from "../utils/helpers";

/**
 * Doctor Patient Timeline Component
 * Displays complete medical history for a patient
 * Allows doctor to add notes and view all events
 */
export const DoctorPatientTimeline = ({ patientId, patientName }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [patientId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDoctorPatientTimeline(patientId);
      setTimeline(data.data || []);
    } catch (err) {
      console.error("Error loading timeline:", err);
      setError("Failed to load patient timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!noteContent.trim()) {
      setError("Note content is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await addDoctorNote(patientId, noteContent, selectedAppointmentId);
      setSuccessMessage("✓ Note added successfully");
      setNoteContent("");
      setSelectedAppointmentId(null);
      setShowNoteForm(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchTimeline();
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err.message || "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "appointment_created":
        return "📅";
      case "appointment_approved":
        return "✅";
      case "appointment_rejected":
        return "❌";
      case "appointment_completed":
        return "📋";
      case "prescription_created":
        return "💊";
      case "doctor_note_added":
        return "📝";
      case "medical_file_uploaded":
        return "📁";
      default:
        return "📌";
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case "appointment_created":
        return "bg-blue-100 text-blue-800";
      case "appointment_approved":
        return "bg-green-100 text-green-800";
      case "appointment_rejected":
        return "bg-red-100 text-red-800";
      case "appointment_completed":
        return "bg-purple-100 text-purple-800";
      case "prescription_created":
        return "bg-amber-100 text-amber-800";
      case "doctor_note_added":
        return "bg-indigo-100 text-indigo-800";
      case "medical_file_uploaded":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatEventType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Timeline</h2>
          <p className="text-gray-600 text-sm mt-1">{patientName}</p>
        </div>
        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showNoteForm ? "Cancel" : "+ Add Note"}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Note Form */}
      {showNoteForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Add Doctor Note</h3>
          <form onSubmit={handleAddNote} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Content *
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your clinical notes or observations..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Appointment (optional)
              </label>
              <select
                value={selectedAppointmentId || ""}
                onChange={(e) =>
                  setSelectedAppointmentId(e.target.value || null)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select appointment...</option>
                {timeline
                  .filter(
                    (event) =>
                      event.eventType.startsWith("appointment") &&
                      event.appointmentId,
                  )
                  .map((event) => (
                    <option
                      key={event._id}
                      value={event.appointmentId?._id || ""}
                    >
                      {formatDate(event.appointmentId?.date)} -{" "}
                      {event.appointmentId?.timeSlot}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteContent("");
                  setSelectedAppointmentId(null);
                }}
                className="btn-secondary px-4 py-2 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Note"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No medical events yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vertical timeline line */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-1 bg-blue-200" />

            {/* Timeline events */}
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event._id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-0 w-9 h-9 rounded-full flex items-center justify-center -ml-4 bg-white border-2 border-blue-300">
                    <span className="text-lg">
                      {getEventIcon(event.eventType)}
                    </span>
                  </div>

                  {/* Event card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {event.eventTitle}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getEventColor(
                          event.eventType,
                        )}`}
                      >
                        {formatEventType(event.eventType)}
                      </span>
                    </div>

                    {/* Event description/content */}
                    {event.eventDescription && (
                      <div className="bg-gray-50 p-3 rounded mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {event.eventDescription}
                      </div>
                    )}

                    {/* Metadata display */}
                    {event.metadata &&
                      Object.keys(event.metadata).length > 0 && (
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          {event.eventType === "appointment_created" && (
                            <p>
                              <span className="font-medium">
                                Appointment Date:
                              </span>{" "}
                              {event.appointmentId?.date
                                ? formatDate(event.appointmentId.date)
                                : "N/A"}
                            </p>
                          )}
                          {event.eventType === "prescription_created" && (
                            <p>
                              <span className="font-medium">
                                Prescription from:
                              </span>{" "}
                              {event.appointmentId?.date
                                ? formatDate(event.appointmentId.date)
                                : "N/A"}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            {event.eventStatus}
                          </p>
                        </div>
                      )}

                    {/* Visibility indicator for doctor */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        {event.visibility === "patient_visible"
                          ? "👁️ Visible to patient"
                          : "🔒 Doctor only"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
