import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, FileText, MessageSquareText } from "lucide-react";
import doctorService from "../services/doctorService";

/**
 * IntakeFormViewModal - Display patient triage/intake form data
 * Shows comprehensive medical intake information in a professional grid layout
 */
export const IntakeFormViewModal = ({ isOpen, onClose, appointment }) => {
  const [resolvedQuestions, setResolvedQuestions] = useState([]);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setResolvedQuestions([]);
      return;
    }

    const doctorQuestions =
      appointment?.doctorId?.customIntakeQuestions ||
      appointment?.doctor?.customIntakeQuestions ||
      [];

    if (Array.isArray(doctorQuestions) && doctorQuestions.length > 0) {
      setResolvedQuestions(doctorQuestions);
      return;
    }

    let isActive = true;
    const loadQuestions = async () => {
      try {
        const response = await doctorService.getDoctorProfile();
        const questions = response?.data?.data?.customIntakeQuestions || [];
        if (isActive) {
          setResolvedQuestions(Array.isArray(questions) ? questions : []);
        }
      } catch (error) {
        if (isActive) {
          setResolvedQuestions([]);
        }
      }
    };

    loadQuestions();
    return () => {
      isActive = false;
    };
  }, [appointment, isOpen]);

  const intakeForm = appointment?.intakeForm ?? {};
  const customQuestions = useMemo(() => {
    const sourceQuestions =
      appointment?.doctorId?.customIntakeQuestions ||
      appointment?.doctor?.customIntakeQuestions ||
      resolvedQuestions ||
      [];
    return Array.isArray(sourceQuestions) ? sourceQuestions : [];
  }, [
    appointment?.doctorId?.customIntakeQuestions,
    appointment?.doctor?.customIntakeQuestions,
    resolvedQuestions,
  ]);

  if (!appointment?.intakeForm) {
    return null;
  }

  const normalizeLookupKey = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getReadableFallbackLabel = (rawKey) => {
    const cleaned = String(rawKey ?? "")
      .trim()
      .replace(/^(question|answer|field|custom|intake)[\s._-]*/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_.-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "إجابة إضافية";
    if (/^(question|answer|field|custom|intake)$/i.test(cleaned)) {
      return "إجابة إضافية";
    }
    if (/^[a-z0-9]{6,}$/i.test(cleaned) && !/[\u0600-\u06FF]/.test(cleaned)) {
      return "إجابة إضافية";
    }

    return cleaned;
  };

  const getQuestionMeta = (key) => {
    const rawKey = String(key ?? "").trim();
    const lookupKey = normalizeLookupKey(rawKey);

    const matchedQuestion = customQuestions.find((question) => {
      const questionId = String(question?.id ?? "").trim();
      const questionText = String(question?.questionText ?? "").trim();
      return (
        questionId === rawKey ||
        normalizeLookupKey(questionId) === lookupKey ||
        normalizeLookupKey(questionText) === lookupKey
      );
    });

    if (matchedQuestion?.questionText) {
      return {
        label: matchedQuestion.questionText,
        type: matchedQuestion.type || "text",
      };
    }

    const legacyLabels = {
      chiefcomplaint: "الشكاوى الرئيسية",
      allergies: "الحساسيات الدوائية",
      pregnancyorlactation: "الحمل أو الرضاعة",
      bloodpressure: "ضغط الدم",
      diabetes: "السكري",
      smoking: "التدخين",
      heartsurgeries: "عمليات القلب",
      familyhearthistory: "تاريخ عائلي بأمراض القلب",
      chestproblems: "مشاكل في الصدر",
    };

    return {
      label:
        legacyLabels[lookupKey] ||
        getReadableFallbackLabel(rawKey) ||
        "إجابة إضافية",
      type: "text",
    };
  };

  const flattenEntries = (source) => {
    if (!source || typeof source !== "object") return [];

    const normalizeObject = (value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value.entries());
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
      }
      return {};
    };

    const entries = [];
    const append = (key, value, label, type = "text") => {
      if (value === undefined || value === null) return;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.entries(normalizeObject(value)).forEach(
          ([nestedKey, nestedValue]) => {
            append(`${key}.${nestedKey}`, nestedValue, label, type);
          },
        );
        return;
      }
      if (typeof value === "boolean") {
        entries.push({ key, label, value, type: type || "boolean" });
        return;
      }
      if (value === "") return;
      entries.push({ key, label, value, type });
    };

    Object.entries(normalizeObject(source)).forEach(([key, value]) => {
      if (key === "customAnswers") return;
      if (key === "vitals" || key === "medicalHistory") {
        Object.entries(normalizeObject(value || {})).forEach(
          ([nestedKey, nestedValue]) => {
            const nestedMeta = getQuestionMeta(nestedKey);
            const nestedLabel =
              key === "vitals"
                ? nestedMeta.label ||
                  (nestedKey === "bloodPressure"
                    ? "ضغط الدم"
                    : nestedKey === "diabetes"
                      ? "السكري"
                      : nestedKey)
                : nestedMeta.label ||
                  (nestedKey === "smoking"
                    ? "التدخين"
                    : nestedKey === "heartSurgeries"
                      ? "عمليات القلب"
                      : nestedKey === "familyHeartHistory"
                        ? "تاريخ عائلي بأمراض القلب"
                        : nestedKey === "chestProblems"
                          ? "مشاكل في الصدر"
                          : nestedKey);
            const nestedType = nestedKey === "smoking" ? "boolean" : "text";
            append(`${key}.${nestedKey}`, nestedValue, nestedLabel, nestedType);
          },
        );
        return;
      }

      const meta = getQuestionMeta(key);
      append(key, value, meta.label, meta.type);
    });

    return entries;
  };

  const entries = flattenEntries(intakeForm);
  const hasEntries = entries.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📄 استمارة الفحص الطبي الأولي
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  بيانات المريض المسجلة من قبل السكرتارية
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 160px)" }}
            >
              <div className="p-6 pb-16 space-y-6">
                {hasEntries ? (
                  entries.map((entry, index) => {
                    const isBooleanLike =
                      entry.type === "boolean" ||
                      typeof entry.value === "boolean";
                    const booleanValue =
                      typeof entry.value === "boolean"
                        ? entry.value
                        : typeof entry.value === "string"
                          ? ["true", "yes", "y", "نعم", "1"].includes(
                              entry.value.trim().toLowerCase(),
                            )
                          : false;
                    const displayValue = isBooleanLike
                      ? booleanValue
                        ? "نعم"
                        : "لا"
                      : String(entry.value);
                    const icon = isBooleanLike ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : entry.type === "textarea" ? (
                      <MessageSquareText className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    );

                    return (
                      <motion.div
                        key={`${entry.key}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/60"
                      >
                        <div className="flex items-start gap-3">
                          {icon}
                          <div className="flex-1">
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                              {entry.label}
                            </label>
                            {isBooleanLike ? (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${booleanValue ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}`}
                              >
                                {displayValue}
                              </span>
                            ) : (
                              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                {displayValue}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">
                      لم يتم تعبئة بيانات استمارة الفحص الطبي بعد
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                إغلاق
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
