import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { formatDateSafe } from "../../utils/date/formatDateSafe";
import { getStatusLabel } from "../../utils/helpers";
import { getAppointmentPermissions } from "../../utils/appointmentPermissions.js";

// Appointment card component
export const AppointmentCard = ({
  appointment,
  onView,
  onAction,
  actionLabel,
  onHide,
  onMarkCompleted,
}) => {
  const statusColors = {
    pending: "border-yellow-500",
    confirmed: "border-blue-500",
    scheduled: "border-blue-500",
    completed: "border-gray-500",
    cancelled: "border-red-500",
    reschedule_proposed: "border-yellow-500",
    rejected: "border-red-400",
    no_show: "border-orange-500",
  };

  const isCancelled = appointment.status === "cancelled";

  const patientLabel =
    appointment.patientId?.name ||
    appointment.patientId?.email ||
    (typeof appointment.patientId === "string"
      ? appointment.patientId
      : appointment.patientId?._id
        ? String(appointment.patientId._id)
        : "Patient");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 24px 50px rgba(15, 23, 42, 0.08)" }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`card border-l-4 ${statusColors[appointment.status] || "border-gray-500"} ${
        isCancelled ? "bg-red-50" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {appointment.doctor?.name || "Doctor"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{patientLabel}</p>
          {isCancelled && (
            <p className="text-sm font-medium text-red-600 mt-2">
              تم إلغاء هذا الموعد من قبل الدكتور
            </p>
          )}
        </div>
        {/* Normalize status to CSS class name (replace underscores with dashes) */}
        <span
          className={`badge ${String(appointment.status || "unknown").replace(/_/g, "-")}`}
        >
          {getStatusLabel(appointment.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p>
          <span className="font-medium text-gray-700">التاريخ:</span>{" "}
          <span className="text-gray-600">
            {formatDateSafe(appointment.date)} {appointment.timeSlot || ""}
          </span>
        </p>
        {appointment.notes && (
          <p>
            <span className="font-medium text-gray-700">الملاحظات:</span>{" "}
            <span className="text-gray-600">{appointment.notes}</span>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView(appointment)}
          className="btn-primary text-sm"
        >
          عرض التفاصيل
        </button>
        {appointment.status === "reschedule_proposed" && (
          <button
            onClick={() => onAction?.(appointment)}
            className="btn-primary text-sm bg-purple-600 hover:bg-purple-700"
          >
            اختر وقتًا جديدًا
          </button>
        )}
        {(() => {
          const permissions = getAppointmentPermissions(appointment.status);
          return (
            <>
              {permissions.canMarkCompleted && onMarkCompleted && (
                <button
                  onClick={() => onMarkCompleted(appointment)}
                  className="btn-primary text-sm bg-green-600 hover:bg-green-700"
                >
                  تحديد كمكتمل
                </button>
              )}
              {permissions.canDelete && onHide && (
                <button
                  onClick={() => onHide(appointment)}
                  className="btn-secondary text-sm bg-red-100 text-red-700 hover:bg-red-200"
                >
                  حذف
                </button>
              )}
            </>
          );
        })()}
        {onAction &&
          !isCancelled &&
          appointment.status !== "reschedule_proposed" &&
          appointment.status !== "scheduled" &&
          appointment.status !== "completed" && (
            <button
              onClick={() => onAction(appointment)}
              className="btn-secondary text-sm"
            >
              {actionLabel || "Action"}
            </button>
          )}
      </div>
    </motion.div>
  );
};

// Appointment detail modal content
export const AppointmentDetails = ({ appointment, onClose, onAction }) => {
  const patientLabel =
    appointment.patientId?.name ||
    appointment.patientId?.email ||
    (typeof appointment.patientId === "string"
      ? appointment.patientId
      : appointment.patientId?._id
        ? String(appointment.patientId._id)
        : "N/A");

  return (
    <div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">الدكتور</label>
          <p className="text-gray-900">{appointment.doctor?.name || "N/A"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">المريض</label>
          <p className="text-gray-900">{patientLabel}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            التاريخ والوقت
          </label>
          <p className="text-gray-900">
            {formatDateSafe(appointment.date)} {appointment.timeSlot || ""}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">الحالة</label>
          <p className="text-gray-900 mt-1">
            <span
              className={`badge badge-${String(appointment.status || "unknown").replace(/_/g, "-")}`}
            >
              {getStatusLabel(appointment.status)}
            </span>
          </p>
        </div>
        {appointment.notes && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              الملاحظات
            </label>
            <p className="text-gray-900">{appointment.notes}</p>
          </div>
        )}
        {appointment.rescheduleOptions?.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              خيارات إعادة الجدولة
            </label>
            <ul className="mt-2 space-y-2">
              {appointment.rescheduleOptions.map((opt, idx) => (
                <li key={idx} className="text-gray-900">
                  {formatDateSafe(opt.date)} {opt.timeSlot || ""}
                  {opt.chosen && (
                    <span className="ml-2 text-green-600">(Selected)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          إغلاق
        </button>
        {onAction && (
          <button onClick={onAction} className="btn-primary">
            أخذ إجراء
          </button>
        )}
      </div>
    </div>
  );
};
