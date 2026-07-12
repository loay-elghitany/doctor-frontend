import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Spinner } from "./ui";
import {
  getDoctorPatientTimeline,
  addDoctorNote,
} from "../services/doctorTimelineService";
import { formatDate } from "../utils/helpers";
import FinancialManager from "./FinancialManager";
import ScannedPrescriptionsSection from "./ScannedPrescriptionsSection";
import { FileText, BarChart3, History, Pill } from "lucide-react";

/**
 * Doctor Patient Timeline Component
 * Displays complete medical history for a patient
 * Allows doctor to add notes and view all events
 */

export const DoctorPatientTimeline = (props) => {
  const { patientId, patientName } = props;
  const { t } = useTranslation();
  const resolvedPatientId =
    props.patientId || props.patient?._id || props.patient?.id || patientId;
  const validatedPatientId =
    resolvedPatientId && resolvedPatientId !== "undefined"
      ? resolvedPatientId
      : null;
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");

  const fetchTimeline = useCallback(async () => {
    if (!validatedPatientId || validatedPatientId === "undefined") {
      setTimeline([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDoctorPatientTimeline(validatedPatientId);
      setTimeline(data.data || []);
    } catch (err) {
      console.error("Error loading timeline:", err);
      setError("فشل في تحميل التاريخ الطبي. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [validatedPatientId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!noteContent.trim()) {
      setError(" رجاءً إدخال محتوى الملاحظة");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await addDoctorNote(
        validatedPatientId,
        noteContent,
        selectedAppointmentId,
      );
      setSuccessMessage("✓ تم إضافة الملاحظة بنجاح");
      setNoteContent("");
      setSelectedAppointmentId(null);
      setShowNoteForm(false);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchTimeline();
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err.message || "فشل في إضافة الملاحظة");
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatEventType = (type) => {
    const normalizedType = String(type || "unknown");
    return normalizedType
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
          <h2 className="text-2xl font-bold text-gray-900">التاريخ الطبي</h2>
          <p className="text-gray-600 text-sm mt-1">{patientName}</p>
        </div>
        <button
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showNoteForm ? "إلغاء" : "+ إضافة ملاحظة"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "timeline"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4" />
          التاريخ الطبي
        </button>
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "prescriptions"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Pill className="w-4 h-4" />
          الروشتات الورقية
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "billing"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          الفواتير والخطط
        </button>
      </div>

      {/* Success Message */}
      {successMessage && activeTab === "timeline" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && activeTab === "timeline" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === "timeline" && (
        <>
          {/* Add Note Form */}
          {showNoteForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                إضافة ملاحظة طبية
              </h3>
              <form onSubmit={handleAddNote} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    محتوى الملاحظة *
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={t(
                      "components_DoctorPatientTimeline.attr_placeholder_enter_your_clinical_",
                    )}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رابط للموعد (اختياري)
                  </label>
                  <select
                    value={selectedAppointmentId || ""}
                    onChange={(e) =>
                      setSelectedAppointmentId(e.target.value || null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر الموعد...</option>
                    {timeline
                      .filter(
                        (event) =>
                          (event.eventType || "").startsWith("appointment") &&
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
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? "إضافة..." : "إضافة ملاحظة"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline */}
          {timeline.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">لا توجد أحداث طبية بعد</p>
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

                        {/* Appointment & Event Details Display */}
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          {/* عرض تاريخ الموعد لو الحدث مرتبط بموعد */}
                          {event.appointmentId?.date && (
                            <>
                              {event.eventType === "appointment_created" && (
                                <p>
                                  <span className="font-medium">
                                    تاريخ الموعد:
                                  </span>{" "}
                                  {formatDate(event.appointmentId.date)}
                                </p>
                              )}
                              {event.eventType === "prescription_created" && (
                                <p>
                                  <span className="font-medium">
                                    روشتة من تاريخ:
                                  </span>{" "}
                                  {formatDate(event.appointmentId.date)}
                                </p>
                              )}
                            </>
                          )}

                          {/* عرض حالة الحدث لو موجودة */}
                          {event.eventStatus && (
                            <p>
                              <span className="font-medium">الحالة:</span>{" "}
                              {event.eventStatus}
                            </p>
                          )}

                          {/* لو عايز تعرض بيانات فعلية من الـ metadata مستقبلاً، حطها هنا لوحدها */}
                          {event.metadata &&
                            Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                {/* مثال لعرض محتوى الميتاداتا */}
                                {Object.entries(event.metadata).map(
                                  ([key, value]) => (
                                    <p key={key}>
                                      <span className="font-medium">
                                        {key}:
                                      </span>{" "}
                                      {String(value)}
                                    </p>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                        {/* Visibility indicator for doctor */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            {event.visibility === "patient_visible"
                              ? "👁️ مرئي للمرضى"
                              : "🔒 فقط للطبيب"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Billing & Plans Tab */}
      {activeTab === "billing" && (
        <div>
          <FinancialManager patientId={validatedPatientId} />
        </div>
      )}

      {/* Scanned Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <ScannedPrescriptionsSection patientId={validatedPatientId} />
        </div>
      )}
    </div>
  );
};
