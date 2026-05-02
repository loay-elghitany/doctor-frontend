import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Input, Alert, Spinner } from "../ui";
import { appointmentService } from "../../services/appointmentService";
import { handleApiError } from "../../utils/helpers";

const MAX_RESCHEDULE_OPTIONS = 5;

const isValidDate = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const buildValidation = (options) => {
  const normalized = Array.isArray(options) ? options : [options];
  const errors = normalized.map(() => []);
  const used = new Set();

  if (normalized.length < 1) {
    errors[0] = ["أضف خيار وقت واحد على الأقل."];
  }

  if (normalized.length > MAX_RESCHEDULE_OPTIONS) {
    errors[0].push(
      `يمكنك اقتراح ما يصل إلى ${MAX_RESCHEDULE_OPTIONS} خيارات وقت فقط.`,
    );
  }

  normalized.forEach((option, index) => {
    const date = option?.date?.trim() || "";
    const timeSlot = String(option?.timeSlot || "").trim();

    if (!date) {
      errors[index].push("التاريخ مطلوب.");
    } else if (!isValidDate(date)) {
      errors[index].push("أدخل تاريخًا صالحًا.");
    }

    if (!timeSlot) {
      errors[index].push("الوقت مطلوب.");
    }

    if (date && timeSlot) {
      const key = `${date}|${timeSlot}`;
      if (used.has(key)) {
        errors[index].push("تكرار التاريخ والوقت المحدد مسبقا.");
      } else {
        used.add(key);
      }
    }
  });

  const hasErrors = errors.some((row) => row.length > 0);
  const isValid =
    normalized.length >= 1 &&
    normalized.length <= MAX_RESCHEDULE_OPTIONS &&
    !hasErrors;

  return { normalized, errors, isValid };
};

export const RescheduleModal = ({
  isOpen,
  onClose,
  appointmentId,
  onSuccess,
  role = "doctor",
}) => {
  const [options, setOptions] = useState([{ date: "", timeSlot: "" }]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOptions([{ date: "", timeSlot: "" }]);
      setSubmitError("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const { normalized, errors, isValid } = useMemo(
    () => buildValidation(options),
    [options],
  );

  const addOption = () => {
    if (options.length >= MAX_RESCHEDULE_OPTIONS) {
      setSubmitError(
        `يمكنك اقتراح ما يصل إلى ${MAX_RESCHEDULE_OPTIONS} خيارات وقت فقط.`,
      );
      return;
    }
    setOptions((prev) => [...prev, { date: "", timeSlot: "" }]);
  };

  const removeOption = (index) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateOption = (index, field, value) => {
    setOptions((prev) =>
      prev.map((option, idx) =>
        idx === index ? { ...option, [field]: value } : option,
      ),
    );
  };

  const handleSubmit = async () => {
    setSubmitError("");

    if (normalized.length < 1) {
      setSubmitError("أضف خيار وقت واحد على الأقل.");
      return;
    }

    if (normalized.length > MAX_RESCHEDULE_OPTIONS) {
      setSubmitError(
        `يمكنك اقتراح ما يصل إلى ${MAX_RESCHEDULE_OPTIONS} خيارات وقت فقط.`,
      );
      return;
    }

    if (!isValid) {
      setSubmitError("من فضلك صحح الأخطاء في الخيارات المقترحة قبل الإرسال.");
      return;
    }

    if (!appointmentId) {
      setSubmitError("معرف الموعد غير صالح.");
      return;
    }

    const payload = normalized.map((option) => ({
      date: new Date(option.date).toISOString(),
      timeSlot: option.timeSlot,
    }));

    setSubmitting(true);

    try {
      await appointmentService.proposeRescheduleTimes(appointmentId, payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const errorMsg =
        handleApiError(err) || "فشل إرسال الاقتراحات. حاول مرة أخرى.";
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="اقتراح أوقات جديدة"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || !isValid}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" /> إرسال
              </span>
            ) : (
              "إرسال الاقتراح"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          اقترح أوقاتًا جديدة لهذا الموعد. سيتمكن الطرف الآخر من رؤية هذه
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          اقتراح الأوقات كـ <span className="font-medium">{role}</span>.
        </p>

        {submitError && <Alert type="error" message={submitError} />}

        <div className="space-y-4">
          {options.map((option, index) => {
            const rowErrors = errors[index] || [];
            return (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="grid w-full gap-4 sm:grid-cols-2">
                    <Input
                      label={`التاريخ المقترح ${index + 1}`}
                      type="date"
                      value={option.date}
                      onChange={(e) =>
                        updateOption(index, "date", e.target.value)
                      }
                      autoFocus={index === 0}
                      required
                    />
                    <Input
                      label={`الوقت المقترح ${index + 1}`}
                      type="time"
                      value={option.timeSlot}
                      onChange={(e) =>
                        updateOption(index, "timeSlot", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={options.length === 1 || submitting}
                    >
                      × حذف
                    </Button>
                  </div>
                </div>
                {rowErrors.length > 0 && (
                  <div className="mt-3 space-y-1 text-sm text-red-600 dark:text-red-300">
                    {rowErrors.map((message, rowIndex) => (
                      <div key={`${index}-error-${rowIndex}`}>{message}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={addOption}
            disabled={submitting}
            className="inline-flex items-center gap-2"
          >
            + أضف خيار وقت جديد
          </Button>
        </div>
      </div>
    </Modal>
  );
};
