import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import {
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Textarea,
} from "../components/ui";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import scannedPrescriptionService from "../services/scannedPrescriptionService";
import { getStatusLabel } from "../utils/helpers";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { debugLog, debugError } from "../utils/debug";
import FinancialManager from "../components/FinancialManager";
import { FileText, Upload, X, Eye, Download, Printer } from "lucide-react";

/**
 * SecretaryPatientDetails - Display detailed view of a specific patient
 */
export const SecretaryPatientDetails = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scannedPrescriptions, setScannedPrescriptions] = useState([]);
  const [scannedLoading, setScannedLoading] = useState(false);
  const [scannedError, setScannedError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileNotes, setFileNotes] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch patient details and appointments
  const fetchPatientDetails = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryPatientDetails", "Fetching patient details", {
        patientId,
      });

      // Fetch all patients
      const patientsResponse = await patientService.getPatients();
      const patientsList = patientsResponse.data?.data || [];
      const foundPatient = patientsList.find((p) => p?._id === patientId);

      if (!foundPatient) {
        setError("Patient not found");
        return;
      }

      setPatient(foundPatient);

      // Fetch appointments and filter by patient
      const appointmentsResponse = await appointmentService.getAppointments();
      const appointmentsList = appointmentsResponse.data?.data || [];
      const patientAppointments = appointmentsList.filter(
        (app) => app?.patientId?._id === patientId,
      );

      setAppointments(patientAppointments);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch patient details";
      // Don't set error for 401s as they trigger logout automatically
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError("SecretaryPatientDetails", "Failed to fetch patient", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScannedPrescriptions = async () => {
    setScannedLoading(true);
    setScannedError("");
    try {
      const response =
        await scannedPrescriptionService.getPatientScannedPrescriptions(
          patientId,
        );
      setScannedPrescriptions(response.data?.data || []);
    } catch (err) {
      console.error(err);
      setScannedError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load scanned prescriptions",
      );
    } finally {
      setScannedLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchScannedPrescriptions();
    }
  }, [patientId]);

  // Print function for scanned prescriptions
  const handlePrint = () => {
    window.print();
  };

  // Compress image if it's too large
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, "image/jpeg", 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (file.type.startsWith("image/")) {
        // Try to compress the image
        try {
          const compressedBlob = await compressImage(file);
          if (compressedBlob.size < file.size) {
            file = new File([compressedBlob], file.name, {
              type: "image/jpeg",
            });
          } else {
            setUploadError("File size must be 5MB or less");
            return;
          }
        } catch (err) {
          setUploadError(
            "Failed to compress image. File size must be 5MB or less",
          );
          return;
        }
      } else {
        setUploadError("File size must be 5MB or less");
        return;
      }
    }

    setSelectedFile(file);
    setUploadError("");
    setUploadSuccess("");
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Status badge colors (same as in other lists)
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
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
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
                تفاصيل المريض: {patient?.name || "—"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                عرض معلومات المريض، مواعيده، وخططه المالية في مكان واحد. يمكنك
                إدارة كل شيء بسهولة من هنا.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              عودة
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
                  الاسم
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  البريد الإلكتروني
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.email || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  رقم الهاتف
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patient?.phoneNumber || "Not provided"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  تم الإنشاء
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateSafe(patient?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appointments Card */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              المواعيد ({appointments.length})
            </h3>
          </div>
          <div className="px-6 py-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                لم يتم جدولة أي مواعيد لهذا المريض بعد. يمكنك إضافة مواعيد جديدة
                من صفحة المواعيد.
              </p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatDateSafe(appointment?.date)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment?.timeSlot || "—"}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(appointment?.status)}>
                          {getStatusLabel(appointment?.status)}
                        </Badge>
                      </div>
                      {appointment?.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/secretary/appointments/${appointment._id}`)
                      }
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Scanned Prescriptions Upload Card */}
        <Card className="mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              الروشتات الممسوحة ضوئيًا
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              يمكنك رفع نسخة من الوصفة الطبية لهذا المريض، وسيصل تنبيه داخل
              التطبيق وواتساب للمريض.
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {uploadSuccess && (
              <Alert
                type="success"
                message={uploadSuccess}
                onClose={() => setUploadSuccess("")}
              />
            )}
            {uploadError && (
              <Alert
                type="danger"
                message={uploadError}
                onClose={() => setUploadError("")}
              />
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUploadError("");
                setUploadSuccess("");

                if (!selectedFile) {
                  setUploadError("يرجى اختيار ملف صالح قبل الرفع.");
                  return;
                }

                setUploadLoading(true);
                try {
                  await scannedPrescriptionService.uploadScannedPrescription(
                    patientId,
                    selectedFile,
                    fileNotes,
                  );
                  setUploadSuccess("تم رفع الروشتة بنجاح.");
                  setSelectedFile(null);
                  setFileNotes("");
                  fetchScannedPrescriptions();
                } catch (err) {
                  console.error(err);
                  setUploadError(
                    err.response?.data?.message ||
                      err.message ||
                      "Failed to upload scanned prescription",
                  );
                } finally {
                  setUploadLoading(false);
                }
              }}
              className="space-y-4"
            >
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : selectedFile
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(event) => {
                    handleFileSelect(event.target.files?.[0] || null);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-2">
                  <Upload
                    className={`w-8 h-8 mx-auto ${isDragOver ? "text-blue-500" : "text-gray-400"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isDragOver
                        ? "أفلت الملف هنا"
                        : "اسحب وأفلت الملف هنا أو انقر للاختيار"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF, JPG, PNG (حتى 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(selectedFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Textarea
                label="ملاحظات الروشتة (اختياري)"
                placeholder="أدخل ملاحظات إضافية حول الروشتة"
                value={fileNotes}
                onChange={(e) => setFileNotes(e.target.value)}
                rows={3}
              />

              <Button
                type="submit"
                loading={uploadLoading}
                disabled={uploadLoading || !selectedFile}
                className="w-full"
              >
                {uploadLoading ? "جارٍ الرفع..." : "رفع الروشتة"}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                سجلات الروشتات الممسوحة
              </h4>
              {scannedLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : scannedError ? (
                <Alert type="danger" message={scannedError} />
              ) : scannedPrescriptions.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  لا توجد روشتات ممسوحة لهذا المريض حتى الآن.
                </p>
              ) : (
                <div className="space-y-4">
                  {scannedPrescriptions.map((prescription) => (
                    <div
                      key={prescription._id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {prescription.fileType === "pdf"
                                ? "ملف PDF"
                                : "صورة"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {prescription.notes || "بدون ملاحظات"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(prescription.uploadedAt).toLocaleString(
                                "ar-SA",
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewModal(prescription)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            معاينة
                          </Button>
                          <a
                            href={prescription.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            تحميل
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Financial Manager Card */}
        <Card className="mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              الفواتير والخطط المالية
            </h3>
          </div>
          <div className="px-6 py-4">
            <FinancialManager patientId={patientId} />
          </div>
        </Card>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print-modal">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden print-content">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 print-hide">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                معاينة الروشتة
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewModal(null)}
                className="text-gray-500 hover:text-gray-700 print-hide"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 print-content">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 print-hide">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>النوع:</strong>{" "}
                  {previewModal.fileType === "pdf" ? "ملف PDF" : "صورة"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <strong>تاريخ الرفع:</strong>{" "}
                  {new Date(previewModal.uploadedAt).toLocaleString("ar-SA")}
                </p>
                {previewModal.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <strong>الملاحظات:</strong> {previewModal.notes}
                  </p>
                )}
              </div>
              <div className="flex justify-center print-only">
                {previewModal.fileType === "pdf" ? (
                  <iframe
                    src={previewModal.fileUrl}
                    className="w-full h-full border-0 print-iframe"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={previewModal.fileUrl}
                    alt="Scanned Prescription"
                    className="max-w-full max-h-full object-contain print-image"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 print-hide">
              <Button 
                variant="primary" 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setPreviewModal(null)}>
                  إغلاق
                </Button>
                <a
                  href={previewModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحميل
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
