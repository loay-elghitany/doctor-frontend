import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { appointmentService } from "../services/appointmentService";
import { handleApiError, parseDate } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Users,
  TrendingUp,
  Activity,
  FileText,
  Plus,
  UserPlus,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GuidedTour } from "../components/GuidedTour";
import {
  GlassCard,
  BentoGridItem,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  QuickActionButton,
  PremiumSearch,
} from "../components/ui";
import authService from "../services/authService";
import scannedPrescriptionService from "../services/scannedPrescriptionService";
import { Modal, Button, Input } from "../components/ui";

// Dashboard Status Mapping
const DASHBOARD_STATUS_MAPPING = {
  completedStatuses: ["completed"],
  upcomingStatuses: ["scheduled"],
  pendingStatuses: ["pending", "reschedule_proposed"],
};

const DOCTOR_TOUR_STEPS = [
  {
    title: "مرحبًا بك في لوحة القيادة الجديدة",
    description:
      "اكتشف تصميمنا الجديد والأنيق الذي يضع كل ما تحتاجه في متناول يدك. من نظرة سريعة، يمكنك رؤية إحصائيات المواعيد الحية، الوصول إلى الإجراءات السريعة، ومراجعة مواعيدك القادمة في لمحة.",
    tip: "تجربة مستخدم محسنة مع تصميم حديث وألوان مهدئة تركز على الوضوح وسهولة الاستخدام.",
  },
  {
    title: "إحصائيات المواعيد الحية",
    description:
      "تابع تدفق المرضى الخاص بك مع إحصائيات المواعيد الحية التي تعرض عدد المواعيد اليوم، المواعيد المعلقة، المكتملة، والملغاة في بطاقات ملونة وجذابة.",
    tip: "تحديثات في الوقت الحقيقي تعكس التغييرات فور حدوثها، مما يتيح لك البقاء على اطلاع دائم دون الحاجة إلى تحديث الصفحة.",
  },
  {
    title: "إجراءات سريعة بنقرة واحدة",
    description:
      "قم بالوصول بسرعة إلى الإجراءات الأكثر استخدامًا مثل عرض جدول المواعيد، سجلات المرضى، ملف العيادة، وإضافة سكرتير جديد من قسم الإجراءات السريعة الجديد.",
    tip: "أزرار واضحة ومميزة تضمن أن الإجراءات الأكثر أهمية لا تبعد أكثر من نقرة واحدة.",
  },
];

export const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Secretary modal state
  const [secretaryModalOpen, setSecretaryModalOpen] = useState(false);
  const [secretaryForm, setSecretaryForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [secretaryLoading, setSecretaryLoading] = useState(false);
  const [secretaryError, setSecretaryError] = useState("");
  const [secretarySuccess, setSecretarySuccess] = useState("");
  const [doctorScannedPrescriptions, setDoctorScannedPrescriptions] = useState(
    [],
  );
  const [scannedPrescriptionLoading, setScannedPrescriptionLoading] =
    useState(false);
  const [scannedPrescriptionError, setScannedPrescriptionError] = useState("");
  const [previewModal, setPreviewModal] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const welcomeName = user?.name ? user.name.split(" ")[0] : "Doctor";
  const formattedDate = format(new Date(), "EEEE, MMMM do");

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

  // Stat card configurations with premium styling
  const statCards = [
    {
      label: "مواعيد اليوم",
      value: stats.today,
      icon: CalendarDays,
      gradient: "from-blue-500 to-cyan-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "معلقة",
      value: stats.pending,
      icon: Clock3,
      gradient: "from-amber-500 to-orange-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "مكتملة",
      value: stats.completed,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-green-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "ملغاة",
      value: stats.cancelled,
      icon: XCircle,
      gradient: "from-red-500 to-rose-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      accent: "text-red-600 dark:text-red-400",
    },
  ];

  // Quick actions configuration
  const quickActions = [
    {
      icon: CalendarDays,
      label: "المواعيد",
      onClick: () => navigate("/doctor/appointments"),
    },
    {
      icon: Users,
      label: "سجلات المرضى",
      onClick: () => navigate("/doctor/patient-records"),
    },
    {
      icon: TrendingUp,
      label: "ملف العيادة",
      onClick: () => navigate("/doctor/clinic-profile"),
    },
    {
      icon: UserPlus,
      label: "إضافة سكرتير",
      onClick: () => setSecretaryModalOpen(true),
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        debugLog("DoctorDashboard", "Fetching dashboard data");
        const response = await appointmentService.getAppointments();

        const appointments = response.data?.data || [];
        debugLog("DoctorDashboard", "Appointments retrieved", {
          count: appointments.length,
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let todayCount = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;
        const upcomingList = [];

        appointments.forEach((apt) => {
          const effectiveStatus =
            apt.status === "confirmed" ? "scheduled" : apt.status;

          if (
            DASHBOARD_STATUS_MAPPING.pendingStatuses.includes(effectiveStatus)
          )
            pendingCount++;
          if (
            DASHBOARD_STATUS_MAPPING.completedStatuses.includes(effectiveStatus)
          )
            completedCount++;
          if (effectiveStatus === "cancelled") cancelledCount++;

          const aptDateValue = parseDate(apt.date);
          if (aptDateValue) {
            const aptDay = new Date(aptDateValue);
            aptDay.setHours(0, 0, 0, 0);
            if (aptDay.getTime() === today.getTime()) {
              todayCount++;
            }
          }

          if (
            aptDateValue &&
            aptDateValue >= today &&
            aptDateValue <
              new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
            effectiveStatus !== "cancelled" &&
            DASHBOARD_STATUS_MAPPING.upcomingStatuses.includes(effectiveStatus)
          ) {
            upcomingList.push(apt);
          }
        });

        setStats({
          today: todayCount,
          pending: pendingCount,
          completed: completedCount,
          cancelled: cancelledCount,
        });

        upcomingList.sort((a, b) => {
          const aTime = parseDate(a.date)?.getTime() ?? Infinity;
          const bTime = parseDate(b.date)?.getTime() ?? Infinity;
          if (aTime !== bTime) return aTime - bTime;
          return (a.timeSlot || "").localeCompare(b.timeSlot || "");
        });

        setUpcomingAppointments(upcomingList.slice(0, 5));
      } catch (err) {
        const errorMsg = handleApiError(err);
        debugError("DoctorDashboard", "Failed to fetch dashboard data", err);
        setError(errorMsg || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchDoctorScannedPrescriptions();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("clinic-tour-seen")) {
      setTimeout(() => setTourOpen(true), 600);
    }
  }, []);

  const fetchDoctorScannedPrescriptions = async () => {
    setScannedPrescriptionLoading(true);
    setScannedPrescriptionError("");
    try {
      const response =
        await scannedPrescriptionService.getDoctorScannedPrescriptions({
          limit: 3,
        });
      setDoctorScannedPrescriptions(response.data?.data || []);
    } catch (err) {
      console.error("Doctor scanned prescriptions fetch failed", err);
      setScannedPrescriptionError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load scanned prescriptions",
      );
    } finally {
      setScannedPrescriptionLoading(false);
    }
  };

  // Secretary modal handlers
  const handleSecretaryModalOpen = () => {
    setSecretaryModalOpen(true);
    setSecretaryError("");
    setSecretarySuccess("");
  };

  const handleSecretaryModalClose = () => {
    setSecretaryModalOpen(false);
    setSecretaryForm({ name: "", email: "", password: "" });
    setSecretaryError("");
    setSecretarySuccess("");
  };

  const handleSecretaryFormChange = (e) => {
    setSecretaryForm({
      ...secretaryForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecretarySubmit = async (e) => {
    e.preventDefault();
    setSecretaryLoading(true);
    setSecretaryError("");
    setSecretarySuccess("");

    try {
      await authService.createSecretary(
        secretaryForm.name.trim(),
        secretaryForm.email.trim(),
        secretaryForm.password,
      );

      setSecretarySuccess("تم إنشاء السكرتير بنجاح!");
      setTimeout(() => {
        handleSecretaryModalClose();
      }, 2000);
    } catch (err) {
      setSecretaryError(
        err.response?.data?.message || "Failed to create secretary",
      );
    } finally {
      setSecretaryLoading(false);
    }
  };

  const handleTourNext = () => {
    setTourStep((prev) => Math.min(prev + 1, DOCTOR_TOUR_STEPS.length - 1));
  };

  const handleTourBack = () => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTourClose = () => {
    setTourOpen(false);
    setTourStep(0);
    localStorage.setItem("clinic-tour-seen", "true");
  };

  // Filter appointments based on search query
  const filteredAppointments = upcomingAppointments.filter((apt) => {
    const patientName = apt.patientId?.name || "Unknown Patient";
    return patientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <MainLayout userType="doctor">
        <LoadingSpinner message="Loading your dashboard..." size="lg" />
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8">
        {/* Hero Section with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-blue-600 dark:text-blue-400 mb-3 font-semibold"
                  >
                    مرحباً بك في لوحة القيادة الخاصة بك
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    Dr. {welcomeName}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    {formattedDate}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 max-w-xl text-gray-500 dark:text-gray-400"
                  >
                    استعرض إحصائيات مواعيدك، قم بإدارة جدولك، وتفاعل مع مرضاك
                    بسهولة من لوحة القيادة الجديدة والمحسنة.
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
                      أبدأ الجولة
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate("/doctor/appointments")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/50 dark:bg-gray-800/50 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition hover:bg-white/70 dark:hover:bg-gray-800/70"
                    >
                      استعرض الجدول
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
                {/* Decorative Element */}
                <div className="hidden xl:block">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 opacity-20 blur-2xl" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {/* Bento Grid Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <BentoGridItem
                key={card.label}
                delay={index * 0.1}
                className="h-full"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="text-3xl font-bold text-gray-900 dark:text-white"
                    >
                      {loading ? "-" : card.value}
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {card.label}
                    </p>
                  </div>
                </div>
              </BentoGridItem>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={action.label}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Scanned Prescriptions Summary */}
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                الروشتات الممسوحة ضوئيًا
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                آخر الروشتات المرفوعة من قبل فريق العيادة.
              </p>
            </div>
            <button
              onClick={() => navigate("/doctor/patient-records")}
              className="btn-premium btn-premium-primary px-4 py-2 flex items-center gap-2"
            >
              عرض جميع المرضى
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {scannedPrescriptionLoading ? (
            <LoadingSpinner message="Loading scanned prescriptions..." />
          ) : scannedPrescriptionError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
              {scannedPrescriptionError}
            </div>
          ) : doctorScannedPrescriptions.length > 0 ? (
            <div className="grid gap-4">
              {doctorScannedPrescriptions.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.patientId?.name || "Patient"} •{" "}
                          {item.fileType === "pdf" ? "PDF" : "صورة"}
                        </p>
                        <p className="mt-1 text-gray-900 dark:text-white font-semibold">
                          {item.notes || "بدون ملاحظات"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewModal(item)}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        معاينة
                      </button>
                      <a
                        href={getDownloadUrl(item.fileUrl)}
                        download={
                          item.fileType === "pdf"
                            ? "scanned-prescription.pdf"
                            : item.fileUrl?.split("/").pop()
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
              title="لا توجد روشتات ممسوحة بعد"
              description="سيظهر هنا أحدث الروشتات المرفوعة من قبل فريق العيادة."
            />
          )}
        </GlassCard>

        {/* Upcoming Appointments Section */}
        <GlassCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                المواعيد القادمة
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                الأيام 7 القادمة من المواعيد المجدولة
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PremiumSearch
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients..."
                className="max-w-xs"
              />
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="btn-premium btn-premium-primary px-4 py-2 flex items-center gap-2"
              >
                عرض الجدول الكامل
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading appointments..." />
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredAppointments.map((apt, index) => {
                  const aptDate = new Date(apt.date);
                  const effectiveStatus =
                    apt.status === "confirmed" ? "scheduled" : apt.status;
                  const patientName = apt.patientId?.name || "Unknown Patient";

                  return (
                    <motion.div
                      key={apt._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                      onClick={() => navigate("/doctor/appointments")}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {patientName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {aptDate.toLocaleDateString()} • {apt.timeSlot}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={effectiveStatus} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/doctor/appointments");
                          }}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : searchQuery ? (
            <EmptyState
              icon={Users}
              title="لا توجد مواعيد تطابق بحثك"
              description={`لم يتم العثور على أي مواعيد ل "${searchQuery}". حاول تعديل معايير البحث الخاصة بك.`}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="لا توجد مواعيد قادمة"
              description="ليس لديك أي مواعيد مجدولة للأسابيع القادمة."
              actionLabel="عرض الجدول الكامل"
              onAction={() => navigate("/doctor/appointments")}
            />
          )}
        </GlassCard>

        {/* Secretary Creation Modal */}
        <Modal
          isOpen={secretaryModalOpen}
          onClose={handleSecretaryModalClose}
          title="إضافة سكرتير جديد"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={handleSecretaryModalClose}
                disabled={secretaryLoading}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleSecretarySubmit}
                disabled={secretaryLoading}
              >
                {secretaryLoading ? "Creating..." : "Create Secretary"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSecretarySubmit} className="space-y-4">
            {secretaryError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {secretaryError}
              </div>
            )}
            {secretarySuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                {secretarySuccess}
              </div>
            )}

            <Input
              label="اسم السكرتير الكامل"
              type="text"
              name="name"
              placeholder="أدخل اسم السكرتير الكامل"
              value={secretaryForm.name}
              onChange={handleSecretaryFormChange}
              required
              disabled={secretaryLoading}
            />

            <Input
              label="عنوان البريد الإلكتروني"
              type="email"
              name="email"
              placeholder="أدخل بريد السكرتير الإلكتروني"
              value={secretaryForm.email}
              onChange={handleSecretaryFormChange}
              required
              disabled={secretaryLoading}
            />

            <Input
              label="كلمة المرور"
              type="password"
              name="password"
              placeholder="أدخل كلمة مرور آمنة"
              value={secretaryForm.password}
              onChange={handleSecretaryFormChange}
              required
              disabled={secretaryLoading}
            />
          </form>
        </Modal>

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
                    <strong>المريض:</strong>{" "}
                    {previewModal.patientId?.name || "غير محدد"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 print-hide">
                    <strong>النوع:</strong>{" "}
                    {previewModal.fileType === "pdf" ? "ملف PDF" : "صورة"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 print-hide">
                    <strong>تاريخ الرفع:</strong>{" "}
                    {new Date(previewModal.createdAt).toLocaleString("ar-SA")}
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
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
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
          steps={DOCTOR_TOUR_STEPS}
          currentStep={tourStep}
          onNext={handleTourNext}
          onBack={handleTourBack}
          onClose={handleTourClose}
        />
      </div>
    </MainLayout>
  );
};
