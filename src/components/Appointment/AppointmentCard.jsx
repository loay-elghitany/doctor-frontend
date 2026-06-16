import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Stethoscope, FileText } from "lucide-react";
import { formatDateSafe } from "../../utils/date/formatDateSafe";
import { getStatusLabel } from "../../utils/helpers";
import { getAppointmentPermissions } from "../../utils/appointmentPermissions.js";

const hasIntakeFormData = (intakeForm) => {
  if (!intakeForm) return false;
  return !!(
    intakeForm.chiefComplaint ||
    intakeForm.vitals?.bloodPressure ||
    intakeForm.vitals?.diabetes ||
    intakeForm.medicalHistory?.smoking ||
    intakeForm.medicalHistory?.heartSurgeries ||
    intakeForm.medicalHistory?.familyHeartHistory ||
    intakeForm.medicalHistory?.chestProblems ||
    intakeForm.allergies ||
    intakeForm.pregnancyOrLactation
  );
};

// Appointment card component
export const AppointmentCard = ({
  appointment,
  onView,
  onAction,
  actionLabel,
  onHide,
  onMarkCompleted,
  onViewIntake,
}) => {
  const { t } = useTranslation();
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
  const isWalkIn =
    appointment.createdBy === "secretary" &&
    (appointment.status === "scheduled" || appointment.status === "confirmed");
  const permissions = getAppointmentPermissions(appointment.status);

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
          {isWalkIn && (
            <p className="text-sm font-medium text-emerald-600 mt-2">
              موعد حضور مباشر — مؤكد
            </p>
          )}
        </div>
        {/* Normalize status to CSS class name (replace underscores with dashes) */}
        <span
          className={`badge ${String(appointment.status || "unknown").replace(/_/g, "-")}`}
        >
          {t(
            `appointment_records.statuses.${String(appointment.status || "unknown").toLowerCase()}`,
          )}
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
        {appointment.intakeForm?.chiefComplaint && (
          <p>
            <span className="font-medium text-gray-700">الشكوى الرئيسية:</span>{" "}
            <span className="text-gray-600">
              {appointment.intakeForm.chiefComplaint}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onView(appointment)}
          className="btn-primary text-sm"
        >
          عرض التفاصيل
        </button>
        {appointment.intakeForm && onViewIntake && hasIntakeFormData(appointment.intakeForm) && (
          <button
            onClick={() => onViewIntake(appointment)}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            استمارة الفحص
          </button>
        )}
        {appointment.status === "reschedule_proposed" && (
          <button
            onClick={() => onAction?.(appointment)}
            className="btn-primary text-sm bg-purple-600 hover:bg-purple-700"
          >
            اختر وقتًا جديدًا
          </button>
        )}
        {permissions.canConfirm && onAction && (
          <button
            onClick={() => onAction(appointment)}
            className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {actionLabel ||
              t("secretary_appointments.actions.confirm", {
                defaultValue: "تأكيد الموعد",
              })}
          </button>
        )}
        {permissions.canMarkCompleted && onMarkCompleted && (
          <button
            onClick={() => onMarkCompleted(appointment)}
            className="btn-primary text-sm bg-green-600 hover:bg-green-700"
          >
            {t("appointment_records.actions.mark_completed", {
              defaultValue: "تحديد كمكتمل",
            })}
          </button>
        )}
        {permissions.canDelete && onHide && (
          <button
            onClick={() => onHide(appointment)}
            className="btn-secondary text-sm bg-red-100 text-red-700 hover:bg-red-200"
          >
            {t("appointment_records.actions.delete", {
              defaultValue: "حذف",
            })}
          </button>
        )}
        {onAction &&
          permissions.canCancel &&
          !permissions.canConfirm &&
          !isCancelled &&
          appointment.status !== "reschedule_proposed" &&
          appointment.status !== "scheduled" &&
          appointment.status !== "confirmed" &&
          appointment.status !== "completed" && (
            <button
              onClick={() => onAction(appointment)}
              className="btn-secondary text-sm"
            >
              {actionLabel ||
                t("appointment_records.actions.default_action", {
                  defaultValue: "إجراء",
                })}
            </button>
          )}
      </div>
    </motion.div>
  );
};

// Appointment detail modal content
export const AppointmentDetails = ({
  appointment,
  onClose,
  onAction,
  onViewIntake,
}) => {
  const { t } = useTranslation();
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
        {hasIntakeFormData(appointment.intakeForm) && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              استمارة الفحص الطبي
            </label>
            <div className="mt-2 space-y-2 text-sm text-gray-700">
              {appointment.intakeForm.chiefComplaint && (
                <p>
                  <span className="font-medium">الشكوى الرئيسية:</span>{" "}
                  {appointment.intakeForm.chiefComplaint}
                </p>
              )}
              {(appointment.intakeForm.vitals?.bloodPressure ||
                appointment.intakeForm.vitals?.diabetes) && (
                <p>
                  <span className="font-medium">العلامات الحيوية:</span>{" "}
                  {[
                    appointment.intakeForm.vitals?.bloodPressure &&
                      `ضغط الدم: ${appointment.intakeForm.vitals.bloodPressure}`,
                    appointment.intakeForm.vitals?.diabetes &&
                      `السكري: ${appointment.intakeForm.vitals.diabetes}`,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}
            </div>
            {onViewIntake && (
              <button
                type="button"
                onClick={() => onViewIntake(appointment)}
                className="mt-3 btn-secondary text-sm flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                عرض استمارة الفحص الكاملة
              </button>
            )}
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
                    <span className="ml-2 text-green-600">
                      {t(
                        "components_Appointment_AppointmentCard.text_selected",
                      )}
                    </span>
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
