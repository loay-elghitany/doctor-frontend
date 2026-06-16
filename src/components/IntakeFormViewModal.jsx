import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  Activity,
  AlertCircle,
  Baby,
  Cigarette,
  History,
} from "lucide-react";

/**
 * IntakeFormViewModal - Display patient triage/intake form data
 * Shows comprehensive medical intake information in a professional grid layout
 */
export const IntakeFormViewModal = ({ isOpen, onClose, appointment }) => {
  if (!appointment?.intakeForm) {
    return null;
  }

  const intakeForm = appointment.intakeForm;

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
              <div className="p-6 pb-16 space-y-8">
                {/* Chief Complaint */}
                {intakeForm.chiefComplaint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          الشكوى الرئيسية
                        </label>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {intakeForm.chiefComplaint}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Vitals Section */}
                {(intakeForm.vitals?.bloodPressure ||
                  intakeForm.vitals?.diabetes) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-4">
                      <Activity className="w-5 h-5 text-red-500" />
                      القياسات الحيوية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {intakeForm.vitals?.bloodPressure && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                            ضغط الدم
                          </p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {intakeForm.vitals.bloodPressure}
                          </p>
                        </div>
                      )}
                      {intakeForm.vitals?.diabetes && (
                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                            السكري
                          </p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {intakeForm.vitals.diabetes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Medical History Section */}
                {(intakeForm.medicalHistory?.smoking ||
                  intakeForm.medicalHistory?.heartSurgeries ||
                  intakeForm.medicalHistory?.familyHeartHistory ||
                  intakeForm.medicalHistory?.chestProblems) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-4">
                      <History className="w-5 h-5 text-purple-500" />
                      التاريخ الطبي
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {intakeForm.medicalHistory?.smoking !== undefined && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Cigarette className="w-4 h-4 text-amber-600" />
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              التدخين
                            </p>
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {intakeForm.medicalHistory.smoking ? "نعم" : "لا"}
                          </p>
                        </div>
                      )}
                      {intakeForm.medicalHistory?.heartSurgeries && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-2">
                            عمليات القلب
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {intakeForm.medicalHistory.heartSurgeries}
                          </p>
                        </div>
                      )}
                      {intakeForm.medicalHistory?.familyHeartHistory && (
                        <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800">
                          <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-2">
                            تاريخ عائلي بأمراض القلب
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {intakeForm.medicalHistory.familyHeartHistory}
                          </p>
                        </div>
                      )}
                      {intakeForm.medicalHistory?.chestProblems && (
                        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">
                            مشاكل في الصدر
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {intakeForm.medicalHistory.chestProblems}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Allergies */}
                {intakeForm.allergies && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          الحساسيات الدوائية
                        </label>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {intakeForm.allergies}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Pregnancy/Lactation */}
                {intakeForm.pregnancyOrLactation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800"
                  >
                    <div className="flex items-start gap-3">
                      <Baby className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          الحمل أو الرضاعة
                        </label>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {intakeForm.pregnancyOrLactation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Empty State */}
                {!intakeForm.chiefComplaint &&
                  !intakeForm.vitals?.bloodPressure &&
                  !intakeForm.vitals?.diabetes &&
                  !intakeForm.medicalHistory?.smoking &&
                  !intakeForm.medicalHistory?.heartSurgeries &&
                  !intakeForm.medicalHistory?.familyHeartHistory &&
                  !intakeForm.medicalHistory?.chestProblems &&
                  !intakeForm.allergies &&
                  !intakeForm.pregnancyOrLactation && (
                    <div className="text-center py-12">
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
