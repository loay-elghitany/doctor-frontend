import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Input, Button, Card, Alert } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { handleApiError, parseDate } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";

/**
 * ProposeAppointmentTimes - Doctor proposes flexible alternative time slots for rescheduling
 * Sends rescheduleOptions to backend in format: [{ date: Date, timeSlot: "HH:MM" }, ...]
 */
const MAX_RESCHEDULE_OPTIONS = 5;

export const ProposeAppointmentTimes = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [options, setOptions] = useState([{ date: "", timeSlot: "09:00" }]);

  const addOption = () => {
    if (options.length >= MAX_RESCHEDULE_OPTIONS) {
      setError(`You can provide up to ${MAX_RESCHEDULE_OPTIONS} options only.`);
      return;
    }
    setOptions((prev) => [...prev, { date: "", timeSlot: "09:00" }]);
  };

  const removeOption = (index) => {
    if (options.length === 1) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index, field, value) => {
    setOptions((prev) =>
      prev.map((option, idx) =>
        idx === index ? { ...option, [field]: value } : option,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate options count and content
    if (options.length < 1) {
      setError("اقترح على الأقل موعد واحد");
      setLoading(false);
      return;
    }

    if (options.length > MAX_RESCHEDULE_OPTIONS) {
      setError(` فقط ${MAX_RESCHEDULE_OPTIONS} يمكنك اقتراح`);
      setLoading(false);
      return;
    }

    if (
      options.some((opt) => !opt.date || !opt.timeSlot || !parseDate(opt.date))
    ) {
      setError("رجاءاً إختار مواعيد وتواريخ مناسبة.");
      setLoading(false);
      return;
    }

    const uniqueSet = new Set(
      options.map((opt) => `${opt.date}|${opt.timeSlot}`),
    );
    if (uniqueSet.size !== options.length) {
      setError("إزالة مجموعات التاريخ/الوقت المكررة.");
      setLoading(false);
      return;
    }

    try {
      debugLog("ProposeAppointmentTimes", "Proposing times", {
        appointmentId: id,
        optionCount: options.length,
      });

      // Convert to backend format: rescheduleOptions array
      const rescheduleOptions = options.map((opt) => ({
        date: parseDate(opt.date).toISOString(),
        timeSlot: opt.timeSlot,
      }));

      await appointmentService.proposeRescheduleTimes(id, rescheduleOptions);

      setSuccess("تم اقتراح أوقات بديلة بنجاح!");
      debugLog("ProposeAppointmentTimes", "Times proposed successfully");

      // Redirect back to appointments list after brief delay
      setTimeout(() => {
        navigate("/doctor/appointments");
      }, 1500);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("ProposeAppointmentTimes", "فشل في اقتراح أوقات", err);
      setError(errorMsg || "فشل في اقتراح أوقات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout userType="doctor">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          اقتراح أوقات جديدة للحجز
        </h1>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 mb-4">
              {t("pages_ProposeAppointmentTimes.text_1")}
              {MAX_RESCHEDULE_OPTIONS} خيارات زمنية للمرضى للاختيار منها.
            </p>

            {options.map((option, index) => (
              <div key={index} className="border rounded p-4 bg-gray-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      الخيار {index + 1}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={loading || options.length === 1}
                      onClick={() => removeOption(index)}
                    >
                      إزالة
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    label={t("pages_ProposeAppointmentTimes.attr_label_date")}
                    type="date"
                    value={option.date}
                    onChange={(e) =>
                      handleOptionChange(index, "date", e.target.value)
                    }
                    required
                    disabled={loading}
                  />

                  <Input
                    label={t(
                      "pages_ProposeAppointmentTimes.attr_label_time_slot",
                    )}
                    type="select"
                    value={option.timeSlot}
                    onChange={(e) =>
                      handleOptionChange(index, "timeSlot", e.target.value)
                    }
                    required
                    disabled={loading}
                  >
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_09_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_09_00_am")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_10_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_10_00_am")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_11_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_11_00_am")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_12_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_12_00_pm")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_13_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_1_00_pm")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_14_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_2_00_pm")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_15_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_3_00_pm")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_16_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_4_00_pm")}
                    </option>
                    <option
                      value={t(
                        "pages_ProposeAppointmentTimes.attr_value_17_00",
                      )}
                    >
                      {t("pages_ProposeAppointmentTimes.text_5_00_pm")}
                    </option>
                  </Input>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={addOption}
                disabled={loading || options.length >= MAX_RESCHEDULE_OPTIONS}
              >
                + إضافة خيار زمني
              </Button>

              <div className="flex gap-4">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "جاري الاقتراح..." : "اقتراح الأوقات"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => navigate("/doctor/appointments")}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};
