import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { AppointmentCard } from "../components/Appointment/AppointmentCard";
import {
  GlassCard,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
  TimelineEvent,
  PremiumProgressBar,
  Badge,
} from "../components/ui";
import TelegramConnectButton from "../components/ui/TelegramConnectButton.jsx";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Clock,
  FileText,
  Activity,
  CreditCard,
  Pill,
  Stethoscope,
  Heart,
  Thermometer,
  Microscope,
  Syringe,
  Bandage,
  ArrowRight,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import scannedPrescriptionService from "../services/scannedPrescriptionService";
import { handleApiError } from "../utils/helpers";
import { formatDate } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { PrescriptionModal } from "../components/Prescription/PrescriptionModal";
import { GuidedTour } from "../components/GuidedTour";
import PatientFinancials from "../components/PatientFinancials";

const PATIENT_TOUR_STEPS = [
  {
    title: "مرحبا بك في لوحة التحكم الخاصة بك",
    description:
      "من خلال موقعنا الإلكتروني ستتمكن من حجز مواعيد و الإطلاع على الروشتات الخاصة بك و متابعة خططك المالية بكل سرعة وسهولة",
    tip: "وأيضاً يمكنك الإطلاع على ملفك الطبي لتتابع نشاطك كاملاً منذ أن اشتركت معنا",
  },
  {
    title: "المواعيد القادمة",
    description:
      "راجع مواعيدك القادمة و اعرف روشتاتك ونظم جدولك وكل هذا من مكان واحد",
    tip: "إضغط على أي كارت خاص بالموعد لتظهر تفاصيله",
  },
  {
    title: "الجدول الطبي",
    description:
      "اذهب إلى ملفك الطبي لترى كل نشاطك منذ أن اشتركت معنا وإلى الإن وتعلم كل شئ خاص بك ",
    tip: "هذا النظام صمم مخصوصاً ليساعد وييسر تعاملك مع طبيبك الخاص",
  },
];

// Map event types to icons
const getEventIcon = (eventType) => {
  const iconMap = {
    appointment_created: Calendar,
    appointment_approved: Activity,
    appointment_rejected: Activity,
    appointment_completed: Stethoscope,
    prescription_created: Pill,
    doctor_note_added: FileText,
    lab_result: Microscope,
    checkup: Heart,
    surgery: Syringe,
    payment: CreditCard,
  };
  return iconMap[eventType] || FileText;
};

// Format event type for display
const formatEventType = (type) => {
  const normalizedType = String(type || "unknown");
  return normalizedType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patientName, setPatientName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [scannedPrescriptions, setScannedPrescriptions] = useState([]);
  const [scannedLoading, setScannedLoading] = useState(false);
  const [scannedError, setScannedError] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");
  const [tourOpen, setTourOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [tourStep, setTourStep] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await appointmentService.getAppointments();
        const appointmentList = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const sorted = appointmentList
          .slice()
          .sort((a, b) => {
            const aTime = a?.date ? new Date(a.date).getTime() : Infinity;
            const bTime = b?.date ? new Date(b.date).getTime() : Infinity;
            return aTime - bTime;
          })
          .slice(0, 5);

        setAppointments(sorted);

        if (res.data?.meta?.patientName) {
          setPatientName(res.data.meta.patientName);
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("clinic-tour-seen")) {
      setTimeout(() => setTourOpen(true), 600);
    }
  }, []);

  // Fetch timeline when tab is active
  useEffect(() => {
    if (activeTab === "timeline") {
      fetchTimeline();
    }
    if (activeTab === "scanned-prescriptions") {
      fetchScannedPrescriptions();
    }
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const getDownloadUrl = (url) =>
    url?.includes("/upload/")
      ? url.replace("/upload/", "/upload/fl_attachment/")
      : url || "";

  const downloadUrl = getDownloadUrl(previewModal?.fileUrl);
  const isPdfPreview =
    previewModal?.fileType === "pdf" ||
    previewModal?.fileUrl?.toLowerCase().endsWith(".pdf");

  const fetchScannedPrescriptions = async () => {
    if (!user?._id) return;
    setScannedLoading(true);
    setScannedError("");
    try {
      const response =
        await scannedPrescriptionService.getPatientScannedPrescriptions(
          user._id,
        );
      setScannedPrescriptions(response.data?.data || []);
    } catch (err) {
      console.error("Error loading scanned prescriptions:", err);
      setScannedError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load scanned prescriptions",
      );
    } finally {
      setScannedLoading(false);
    }
  };

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await appointmentService.getAppointments();
      const appointments = Array.isArray(res.data?.data) ? res.data.data : [];

      // Transform appointments into timeline events
      const timelineEvents = appointments.flatMap((apt) => {
        const events = [];

        if (apt.date) {
          events.push({
            _id: `${apt._id}-appointment`,
            eventType: "appointment_created",
            eventTitle: `Appointment Scheduled`,
            eventDescription: `Appointment with doctor`,
            createdAt: apt.date,
            metadata: {
              time: apt.timeSlot,
              status: apt.status,
            },
          });
        }

        if (apt.status === "completed") {
          events.push({
            _id: `${apt._id}-completed`,
            eventType: "appointment_completed",
            eventTitle: `Appointment Completed`,
            eventDescription: `Visit completed successfully`,
            createdAt: apt.date,
            metadata: {
              time: apt.timeSlot,
            },
          });
        }

        if (apt.prescription) {
          events.push({
            _id: `${apt._id}-prescription`,
            eventType: "prescription_created",
            eventTitle: `Prescription Issued`,
            eventDescription: `New prescription was created`,
            createdAt: apt.updatedAt || apt.date,
            metadata: {
              medications: apt.prescription.medications?.length || 0,
            },
          });
        }

        return events;
      });

      // Sort by date descending
      timelineEvents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTimeline(timelineEvents.slice(0, 10));
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleTourNext = () => {
    setTourStep((prev) => Math.min(prev + 1, PATIENT_TOUR_STEPS.length - 1));
  };

  const handleTourBack = () => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTourClose = () => {
    setTourOpen(false);
    setTourStep(0);
    localStorage.setItem("clinic-tour-seen", "true");
  };

  const handleRescheduleAction = (appointment) => {
    if (appointment.status === "reschedule_proposed") {
      navigate(`/patient/appointments/${appointment._id}/choose`);
    }
  };

  const handleHideAppointment = async (appointment) => {
    try {
      await appointmentService.hideAppointment(appointment._id, true);
      setAppointments(
        appointments.filter((apt) => apt._id !== appointment._id),
      );
      setSelectedAppointment(null);
    } catch (err) {
      setError(handleApiError(err) || "Failed to hide appointment");
    }
  };

  const tabs = [
    { id: "appointments", label: "مواعيدي القادمة", icon: Calendar },
    { id: "timeline", label: "التقرير الطبي", icon: Activity },
    {
      id: "scanned-prescriptions",
      label: "الروشتات الممسوحة",
      icon: FileText,
    },
    { id: "financials", label: "خططي المالية", icon: CreditCard },
  ];

  if (loading) {
    return (
      <MainLayout userType="patient">
        <LoadingSpinner message="Loading your dashboard..." size="lg" />
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="patient">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-emerald-600 dark:text-emerald-400 mb-3 font-semibold"
                  >
                    مرحباً بعودتك
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    {patientName ? patientName : "Patient"}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    رحلة صحتك، منظمة بجمال.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 max-w-xl text-gray-500 dark:text-gray-400"
                  >
                    من خلال لوحة التحكم الخاصة بك، يمكنك بسهولة إدارة مواعيدك
                    القادمة، مراجعة تاريخك الطبي، ومتابعة خططك المالية - كل ذلك
                    في مكان واحد مصمم خصيصًا لك.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 flex flex-wrap gap-3"
                  >
                    <button
                      onClick={() => setTourOpen(true)}
                      className="btn-premium btn-premium-primary px-6 py-3 flex items-center gap-2"
                    >
                      اذهب في جولة
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("timeline")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/50 dark:bg-gray-800/50 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition hover:bg-white/70 dark:hover:bg-gray-800/70"
                    >
                      استعرض ملفي الطبي
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <TelegramConnectButton
                      userRole="patient"
                      userId={user?._id || user?.id}
                      isLinked={Boolean(user?.telegramChatId)}
                      botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
                    />
                  </motion.div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 opacity-20 blur-2xl" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Content Card */}
        <GlassCard>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <LoadingSpinner message="Loading appointments..." />
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                  {error}
                </div>
              ) : appointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="لا توجد مواعيد قادمة"
                  description="ليس لديك أي مواعيد مجدولة للأسابيع القادمة."
                  actionLabel="حجز موعد جديد"
                  onAction={() => navigate("/patient/appointments/new")}
                />
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {appointments.map((apt, index) => (
                      <motion.div
                        key={apt._id || apt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                          <AppointmentCard
                            appointment={apt}
                            onView={() => setSelectedAppointment(apt)}
                            onAction={() => handleRescheduleAction(apt)}
                            onHide={() => handleHideAppointment(apt)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {timelineLoading ? (
                <LoadingSpinner message="Loading medical history..." />
              ) : timeline.length > 0 ? (
                <div className="timeline-container">
                  {timeline.map((event, index) => {
                    const Icon = getEventIcon(event.eventType);
                    return (
                      <TimelineEvent
                        key={event._id}
                        icon={Icon}
                        title={event.eventTitle}
                        description={event.eventDescription}
                        date={formatDate(event.createdAt)}
                        metadata={event.metadata}
                        isLast={index === timeline.length - 1}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="لا يوجد تاريخ طبي بعد"
                  description="سيظهر تاريخك الطبي هنا بمجرد أن يكون لديك مواعيد أو علاجات."
                />
              )}
            </motion.div>
          )}

          {/* Scanned Prescriptions Tab */}
          {activeTab === "scanned-prescriptions" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {scannedLoading ? (
                <LoadingSpinner message="Loading scanned prescriptions..." />
              ) : scannedError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                  {scannedError}
                </div>
              ) : scannedPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {scannedPrescriptions.map((prescription) => (
                    <div
                      key={prescription._id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <Badge variant="secondary" className="mb-1">
                              {prescription.fileType === "pdf" ? "PDF" : "صورة"}
                            </Badge>
                            <p className="text-gray-900 dark:text-white font-semibold">
                              {prescription.notes || "بدون ملاحظات إضافية"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              تم الرفع في {formatDate(prescription.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewModal(prescription)}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            معاينة
                          </button>
                          <a
                            href={getDownloadUrl(prescription.fileUrl)}
                            download={
                              prescription.fileType === "pdf"
                                ? "scanned-prescription.pdf"
                                : prescription.fileUrl?.split("/").pop()
                            }
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
              ) : (
                <EmptyState
                  icon={FileText}
                  title="لا توجد روشتات ممسوحة"
                  description="أي روشتات ممسوحة ستظهر هنا بعد رفعها من قبل سكرتيرك أو الطبيب."
                />
              )}
            </motion.div>
          )}

          {/* Financials Tab */}
          {activeTab === "financials" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PatientFinancials />
            </motion.div>
          )}
        </GlassCard>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={() => setSelectedAppointment(null)}
          >
            <motion.div
              className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    تفاصيل الموعد
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(selectedAppointment.date)} •{" "}
                    {selectedAppointment.timeSlot}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Cancellation Notice */}
              {selectedAppointment.status === "cancelled" && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300">
                  <p className="font-semibold">
                    للأسف، تم إلغاء هذا الموعد. يرجى التواصل مع طبيبك إذا كان
                    لديك أي أسئلة أو لجدولة موعد جديد.
                  </p>
                  <p className="text-sm mt-1">
                    طبياً، يمكنك إزالة هذا الموعد من لوحة التحكم الخاصة بك إذا
                    لم تعد بحاجة إلى رؤيته.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      الطبيب
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedAppointment.doctor?.name ||
                        selectedAppointment.doctorName ||
                        "Doctor"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      الحالة
                    </p>
                    <StatusBadge status={selectedAppointment.status} />
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      ملاحظات
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                {/* Reschedule options */}
                {selectedAppointment.status === "reschedule_proposed" &&
                  selectedAppointment.rescheduleOptions?.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                        الأوقات المقترحة
                      </h4>
                      <div className="space-y-2">
                        {selectedAppointment.rescheduleOptions.map(
                          (opt, idx) => (
                            <div
                              key={idx}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition flex justify-between items-center"
                            >
                              <div>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {formatDate(opt.date)}
                                  {opt.timeSlot ? ` at ${opt.timeSlot}` : ""}
                                </p>
                                {opt.chosen && (
                                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                    (Selected)
                                  </p>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  إغلاق
                </button>
                {selectedAppointment.status !== "cancelled" && (
                  <button
                    onClick={() => setShowPrescriptions(true)}
                    className="btn-premium btn-premium-primary px-4 py-2 rounded-xl"
                  >
                    عرض الروشتات
                  </button>
                )}
                {selectedAppointment.status === "reschedule_proposed" && (
                  <button
                    onClick={() => {
                      handleRescheduleAction(selectedAppointment);
                      setSelectedAppointment(null);
                    }}
                    className="btn-premium btn-premium-primary px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
                  >
                    اختيار الوقت
                  </button>
                )}
                {selectedAppointment.status === "cancelled" && (
                  <button
                    onClick={() => handleHideAppointment(selectedAppointment)}
                    className="btn-secondary px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                  >
                    إزالة من لوحة التحكم
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Prescriptions Modal */}
        {showPrescriptions && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
              <PrescriptionModal
                appointmentId={selectedAppointment._id}
                userRole="patient"
                onClose={() => {
                  setShowPrescriptions(false);
                  setSelectedAppointment(null);
                }}
                onSuccess={() => {}}
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print-modal">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden print-content">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 print-hide">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white print-hide">
                  معاينة الروشتة
                </h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition print-hide"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4 print-hide">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 print-hide">
                  <p className="text-sm text-gray-600 dark:text-gray-300 print-hide">
                    <strong>النوع:</strong>{" "}
                    {previewModal.fileType === "pdf" ? "ملف PDF" : "صورة"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 print-hide">
                    <strong>تاريخ الرفع:</strong>{" "}
                    {new Date(previewModal.uploadedAt).toLocaleString("ar-SA")}
                  </p>
                  {previewModal.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 print-hide">
                      <strong>الملاحظات:</strong> {previewModal.notes}
                    </p>
                  )}
                </div>
                <div className="flex justify-center">
                  {isPdfPreview ? (
                    <iframe
                      src={previewModal.fileUrl}
                      className="w-full h-[75vh] border-0 rounded-md print-iframe"
                      title="PDF Preview"
                    />
                  ) : (
                    <img
                      src={previewModal.fileUrl}
                      alt="Scanned Prescription"
                      className="object-contain max-h-[75vh] w-full rounded-md print-image"
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 print-hide">
                <button
                  onClick={() => setPreviewModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  إغلاق
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة
                </button>
                <a
                  href={downloadUrl || previewModal.fileUrl}
                  download={
                    isPdfPreview
                      ? "scanned-prescription.pdf"
                      : previewModal.fileUrl?.split("/").pop()
                  }
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
        )}

        <GuidedTour
          isOpen={tourOpen}
          steps={PATIENT_TOUR_STEPS}
          currentStep={tourStep}
          onNext={handleTourNext}
          onBack={handleTourBack}
          onClose={handleTourClose}
        />
      </div>
    </MainLayout>
  );
};
