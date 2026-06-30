import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Loader,
  AlertCircle,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ImagePreviewModal from "../components/ImagePreviewModal";
import { getPatientScannedPrescriptions } from "../services/scannedPrescriptionService";
import { formatDate } from "../utils/helpers";

/**
 * Scanned Prescriptions Section Component
 * Displays scanned prescriptions for a specific patient
 * Allows viewing, downloading, and managing prescriptions
 */
const ScannedPrescriptionsSection = ({ patientId }) => {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescriptionIndex, setSelectedPrescriptionIndex] =
    useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewType, setViewType] = useState("grid"); // grid or list

  const activePrescription = prescriptions[selectedPrescriptionIndex] || null;
  const activeUrl = activePrescription?.fileUrl || "";

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPatientScannedPrescriptions(patientId, {
        page,
        limit: 12,
      });

      const responseData = response.data;
      if (responseData?.success) {
        setPrescriptions(responseData.data || []);
        const pagination = responseData.pagination || {};
        setTotalPages(Math.ceil(pagination.total / pagination.limit) || 1);
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError(err.message || "فشل في تحميل الروشتات");
    } finally {
      setLoading(false);
    }
  }, [patientId, page]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleViewPrescription = (index) => {
    setSelectedPrescriptionIndex(index);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPrescriptionIndex(null), 300);
  };

  const handleNavigateImage = (index) => {
    setSelectedPrescriptionIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </motion.div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          لا توجد روشتات ورقية
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          سيتم عرض الروشتات الورقية هنا عند تحميلها
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Type Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          الروشتات الورقية ({prescriptions.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType("grid")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewType === "grid"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            شبكة
          </button>
          <button
            onClick={() => setViewType("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewType === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            قائمة
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewType === "grid" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {prescriptions.map((prescription, index) => (
            <motion.div
              key={prescription._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <img
                  src={prescription.fileUrl}
                  alt={t(
                    "components_ScannedPrescriptionsSection.attr_alt_prescription",
                  )}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleViewPrescription(index)}
                    className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all"
                    title={t(
                      "components_ScannedPrescriptionsSection.attr_title_view",
                    )}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(prescription.fileUrl)}
                    className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all"
                    title={t(
                      "components_ScannedPrescriptionsSection.attr_title_download",
                    )}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(prescription.createdAt)}
                </p>
                {prescription.notes && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {prescription.notes}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* List View */}
      {viewType === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {prescriptions.map((prescription, index) => (
            <motion.div
              key={prescription._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <img
                  src={prescription.fileUrl}
                  alt={t(
                    "components_ScannedPrescriptionsSection.attr_alt_prescription_1",
                  )}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(prescription.createdAt)}
                  </p>
                  {prescription.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                      {prescription.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewPrescription(index)}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all"
                  title={t(
                    "components_ScannedPrescriptionsSection.attr_title_view_1",
                  )}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDownload(prescription.fileUrl)}
                  className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-all"
                  title={t(
                    "components_ScannedPrescriptionsSection.attr_title_download_1",
                  )}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg transition-all ${
                page === p
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            التالي
          </button>
        </div>
      )}

      <ImagePreviewModal
        isOpen={isModalOpen && selectedPrescriptionIndex !== null}
        onClose={handleModalClose}
        imageUrl={activeUrl}
        images={prescriptions}
        currentIndex={selectedPrescriptionIndex || 0}
        onNavigate={handleNavigateImage}
        title={t("components_ScannedPrescriptionsSection.text_preview_prescription")}
        subtitle={activePrescription?.notes}
        fileType={activePrescription?.fileType}
        downloadUrl={activeUrl}
      />
    </div>
  );
};

export default ScannedPrescriptionsSection;
