import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Card, Badge, Button, Spinner, Alert } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { getStatusLabel } from "../utils/helpers";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { debugLog, debugError } from "../utils/debug";

/**
 * SecretaryAppointmentDetails - Display detailed view of a specific appointment
 */
export const SecretaryAppointmentDetails = () => {
  const { t } = useTranslation();
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch appointment details
  const fetchAppointment = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryAppointmentDetails", "Fetching appointment details", {
        appointmentId,
      });
      const response = await appointmentService.getAppointments();
      const appointmentsList = response.data?.data || [];

      const foundAppointment = appointmentsList.find(
        (app) => app?._id === appointmentId,
      );
      if (!foundAppointment) {
        setError("الموعد غير موجود");
        return;
      }

      setAppointment(foundAppointment);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "فشل في جلب تفاصيل الموعد";
      // Don't set error for 401s as they trigger logout automatically
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError(
        "SecretaryAppointmentDetails",
        "فشل في جلب تفاصيل الموعد",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  // Status badge colors (same as in SecretaryAppointmentsList)
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
            <Button
              variant="secondary"
              onClick={() => navigate("/secretary/appointments")}
            >
              العودة إلى قائمة المواعيد
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
                تفاصيل الموعد
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                عرض معلومات الموعد
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate("/secretary/appointments")}
            >
              {t("pages_SecretaryAppointmentDetails.text_back_to_appointments")}
            </Button>
          </div>
        </div>

        {/* Patient Info Card */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              معلومات المريض
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("pages_SecretaryAppointmentDetails.text_name")}
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {appointment?.patientId?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("pages_SecretaryAppointmentDetails.text_email")}
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {appointment?.patientId?.email || "—"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appointment Info Card */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              معلومات الموعد
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("pages_SecretaryAppointmentDetails.text_date")}
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateSafe(appointment?.date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("pages_SecretaryAppointmentDetails.text_time_slot")}
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {appointment?.timeSlot || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("pages_SecretaryAppointmentDetails.text_status")}
                </label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(appointment?.status)}>
                    {getStatusLabel(appointment?.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes Card */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              ملاحظات
            </h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-900 dark:text-white">
              {appointment?.notes || "لا توجد ملاحظات"}
            </p>
          </div>
        </Card>

        {/* Actions Card */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              الإجراءات
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/secretary/appointments")}
              >
                العودة إلى قائمة المواعيد
              </Button>
              {/* Placeholder for future actions */}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
