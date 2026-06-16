import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Info } from "lucide-react";

export const GuidedTour = ({
  isOpen,
  steps,
  currentStep,
  onNext,
  onBack,
  onClose,
}) => {
  const { t } = useTranslation();
  const step = steps[currentStep] || {};

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  <Info className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    جولة في الموقع
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                aria-label={t(
                  "components_GuidedTour.attr_aria_label_close_tour",
                )}
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <p>{step.description}</p>
              {step.tip && (
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <p className="font-semibold">
                    {t("components_GuidedTour.text_tip")}
                  </p>
                  <p className="mt-2">{step.tip}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {currentStep + 1}
                </span>
                {t("components_GuidedTour.text_of")}
                {steps.length}
                {t("components_GuidedTour.text_steps")}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onBack}
                  disabled={currentStep === 0}
                  className="btn-secondary text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  إلى الخلف
                </button>
                <button
                  onClick={currentStep === steps.length - 1 ? onClose : onNext}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? "إنهاء" : "التالي"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">
                هذه الجولة ستساعدك على التعرف على أهم الميزات في التطبيق. يمكنك
                إغلاقها في أي وقت والعودة إليها لاحقًا من صفحة الإعدادات.
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
