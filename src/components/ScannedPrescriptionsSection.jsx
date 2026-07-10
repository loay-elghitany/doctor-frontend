import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Loader,
  AlertCircle,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { getPatientScannedPrescriptions } from "../services/scannedPrescriptionService";
import { formatDate } from "../utils/helpers";

/**
 * Scanned Prescriptions Section Component
 * Displays scanned prescriptions for a specific patient
 * Allows viewing, downloading, and managing prescriptions
 */
const ScannedPrescriptionsSection = ({ patientId: patientIdProp }) => {
  const { t } = useTranslation();
  const { patientId: patientIdParam } = useParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescriptionIndex, setSelectedPrescriptionIndex] =
    useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewType, setViewType] = useState("grid"); // grid or list
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef(null);

  const activeUrl = prescriptions[selectedPrescriptionIndex]?.fileUrl || "";
  const resolvedPatientId = patientIdProp || patientIdParam;
  const validPatientId =
    resolvedPatientId && resolvedPatientId !== "undefined"
      ? resolvedPatientId
      : null;

  const fetchPrescriptions = useCallback(async () => {
    if (!validPatientId) {
      setPrescriptions([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getPatientScannedPrescriptions(validPatientId, {
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
  }, [validPatientId, page]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  useEffect(() => {
    if (imageZoom <= 1) {
      setIsDragging(false);
    }
  }, [imageZoom]);

  const resetPreviewState = () => {
    setImageZoom(1);
    setImageRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setStartX(0);
    setStartY(0);
  };

  const handleViewPrescription = (index) => {
    setSelectedPrescriptionIndex(index);
    resetPreviewState();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetPreviewState();
    setTimeout(() => setSelectedPrescriptionIndex(null), 300);
  };

  const handleImagePanMouseDown = (e) => {
    if (imageZoom <= 1) return;

    setIsDragging(true);
    setStartX(e.clientX - panOffset.x);
    setStartY(e.clientY - panOffset.y);
  };

  const handleImagePanMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    setPanOffset({ x: e.clientX - startX, y: e.clientY - startY });
  };

  const handleImagePanMouseUp = () => setIsDragging(false);
  const handleImagePanMouseLeave = () => setIsDragging(false);

  const handleNavigateImage = (index) => {
    setSelectedPrescriptionIndex(index);
    resetPreviewState();
  };

  const handleDownload = async (fileUrl) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading prescription:", error);
    }
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

      {/* Image Preview Modal */}
      {isModalOpen &&
        selectedPrescriptionIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden"
            onClick={handleModalClose}
          >
            <div
              className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 bg-slate-800 text-white flex items-center justify-between px-6 border-b border-slate-700 z-10 font-medium">
                <span>معاينة الروشتة الورقية</span>
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-700 text-white transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                ref={containerRef}
                className={`flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden relative select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={handleImagePanMouseDown}
                onMouseMove={handleImagePanMouseMove}
                onMouseUp={handleImagePanMouseUp}
                onMouseLeave={handleImagePanMouseLeave}
              >
                {prescriptions.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateImage(
                          (selectedPrescriptionIndex -
                            1 +
                            prescriptions.length) %
                            prescriptions.length,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-slate-800/80 p-2.5 text-white shadow-lg hover:bg-slate-700"
                      aria-label="Previous prescription"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateImage(
                          (selectedPrescriptionIndex + 1) %
                            prescriptions.length,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-slate-800/80 p-2.5 text-white shadow-lg hover:bg-slate-700"
                      aria-label="Next prescription"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <img
                  src={activeUrl}
                  alt={t(
                    "components_ScannedPrescriptionsSection.attr_alt_prescription",
                  )}
                  className="max-w-full max-h-full rounded-lg shadow-xl"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${imageZoom}) rotate(${imageRotation}deg)`,
                    transition: isDragging
                      ? "none"
                      : "transform 0.15s ease-out",
                    maxHeight: "80vh",
                    maxWidth: "100%",
                    objectContain: "contain",
                    userSelect: "none",
                    pointerEvents: "auto",
                  }}
                />

                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/95 px-3 py-2 shadow-2xl border border-slate-700/60">
                  <button
                    type="button"
                    onClick={() =>
                      setImageZoom((prev) => Math.max(0.5, prev - 0.25))
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageZoom((prev) => Math.min(3, prev + 0.25))
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageRotation((prev) => (prev + 90) % 360)
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                    aria-label="Rotate"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(activeUrl)}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 text-white px-3 transition hover:bg-blue-500"
                    aria-label="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative bg-slate-900 border-t border-slate-700/60 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-300">
                    {prescriptions[selectedPrescriptionIndex]?.notes || ""}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {prescriptions.length > 1 && (
                      <div className="text-sm text-slate-400">
                        {selectedPrescriptionIndex + 1} / {prescriptions.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ScannedPrescriptionsSection;
