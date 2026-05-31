import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "./ui";
import { getPatientTimeline } from "../services/timelineService";
import { formatDate, parseDate } from "../utils/helpers";
import WhatsAppButton from "./WhatsAppButton";

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
    const parsed = parseDate(event.eventDate);
    const dateKey =
      (parsed &&
        parsed.toLocaleDateString("ar-EG", {
          calendar: "gregory",
          year: "numeric",
          month: "short",
          day: "numeric",
        })) ||
      "Unknown Date";
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
        <p className="text-gray-500 text-lg">للا توجد أحداث طبية بعد</p>
        <p className="text-gray-400 text-sm mt-2">
          لا توجد مواعيد أو وصفات طبية مسجلة لهذا المريض. بمجرد إضافة بيانات
          جديدة، ستظهر هنا في هذا الجدول الزمني الطبي.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeline Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          الجدول الزمني الطبي
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {timeline.length} record{timeline.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Communication section for patient */}
      <WhatsAppButton />

      {/* Timeline Events */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-blue-200" />

        {/* Events */}
        <div className="space-y-6">
          {timeline.map((event, index) => {
            const metadata = event.metadata || {};
            return (
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
                          {metadata.doctorName || "Unknown"}
                        </p>
                        {metadata.doctorSpecialization && (
                          <p className="text-gray-600">
                            <span className="font-medium">اسم التخصص:</span>{" "}
                            {metadata.doctorSpecialization}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Time:</span>{" "}
                          {metadata.timeSlot || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Status:</span>
                          <span
                            className={`inline-block ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              metadata.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : metadata.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {metadata.status || "Unknown"}
                          </span>
                        </p>
                      </div>

                      {metadata.notes && (
                        <div>
                          <p className="text-gray-600">
                            <span className="font-medium">ملاحظات:</span>
                          </p>
                          <p className="text-gray-700 mt-1 italic">
                            {metadata.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {event.type === "prescription" && (
                    <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">الأدوية:</span>
                        </p>
                        <p className="text-gray-700 mt-1">
                          {metadata.medicationSummary ||
                            "No medication details provided."}
                        </p>
                      </div>

                      {metadata.diagnosis && (
                        <div>
                          <p className="text-gray-600">
                            <span className="font-medium">التشخيص:</span>
                          </p>
                          <p className="text-gray-700 mt-1">
                            {metadata.diagnosis}
                          </p>
                        </div>
                      )}

                      {metadata.appointmentDate && (
                        <div>
                          <p className="text-gray-600 text-xs">
                            مرتبط بالموعد على{" "}
                            {parseDate(metadata.appointmentDate)
                              ? parseDate(
                                  metadata.appointmentDate,
                                ).toLocaleDateString("ar-EG", {
                                  calendar: "gregory",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Unknown Date"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
