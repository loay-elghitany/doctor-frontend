import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, DollarSign, ClipboardList } from "lucide-react";

const CreateTreatmentPlanModal = ({ isOpen, onClose, onSave, patientId }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setTitle("");
    setTotalCost("");
    setNotes("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!totalCost || isNaN(totalCost) || Number(totalCost) <= 0) {
      newErrors.totalCost = "Valid total cost is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        patientId,
        title: title.trim(),
        totalCost: Number(totalCost),
        notes: notes.trim(),
      });
      resetForm();
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  {t(
                    "components_CreateTreatmentPlanModal.text_new_treatment_plan",
                  )}
                </h2>
                <p className="text-teal-100 text-sm mt-1">
                  {t(
                    "components_CreateTreatmentPlanModal.text_create_a_new_treatme",
                  )}
                </p>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-500" />
                      {t("components_CreateTreatmentPlanModal.text_plan_title")}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t(
                      "components_CreateTreatmentPlanModal.attr_placeholder_e_g_orthodontics",
                    )}
                    className={`w-full px-4 py-2.5 bg-white/60 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all ${
                      errors.title ? "border-red-300" : "border-gray-200"
                    }`}
                  />

                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Total Cost Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-teal-500" />
                      {t(
                        "components_CreateTreatmentPlanModal.text_total_cost_egp",
                      )}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder={t(
                      "components_CreateTreatmentPlanModal.attr_placeholder_e_g_15000",
                    )}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2.5 bg-white/60 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all ${
                      errors.totalCost ? "border-red-300" : "border-gray-200"
                    }`}
                  />

                  {errors.totalCost && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.totalCost}
                    </p>
                  )}
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t(
                      "components_CreateTreatmentPlanModal.text_notes_optional",
                    )}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t(
                      "components_CreateTreatmentPlanModal.attr_placeholder_additional_details_a",
                    )}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    {t("components_CreateTreatmentPlanModal.text_cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg shadow-teal-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {t("components_CreateTreatmentPlanModal.text_saving")}
                      </>
                    ) : (
                      "Save Plan"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateTreatmentPlanModal;
