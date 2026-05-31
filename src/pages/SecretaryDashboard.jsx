import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import {
  GlassCard,
  BentoGridItem,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  QuickActionButton,
  PremiumSearch,
  TimelineEvent,
} from "../components/ui";
import {
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
  Plus,
  FileText,
  Phone,
  Mail,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";
import { GuidedTour } from "../components/GuidedTour";
import { useAuth } from "../context/AuthContext";
import TelegramConnectButton from "../components/ui/TelegramConnectButton.jsx";
import { Button } from "../components/ui";

const SECRETARY_TOUR_STEPS = [
  {
    title: "أهلاً بك في لوحة التحكم الخاصة بك",
    description:
      "قم بإدارة كل مواعيد المرضى وسجلاتهم ونظم العيادة بكل تنظيم وسهولة",
    tip: "تنقل في حسابك وبين المرضى وسجلاتهم عن طريق ضغطات يسيرة",
  },
  {
    title: "نظرة عامة على اليوم",
    description:
      "تابع مواعيد اليوم والمواعيد التي تنتظر الموافقة واحصاءيات المرضى وكل ذلك في مكان واحد",
    tip: "نقرة واحدة فوق الموعد تظهر لك كل التفاصيل الخاصة بالموعد وبالمريض",
  },
  {
    title: "إجراءات سريعة",
    description: "تنقل في حسابك عن طريق ازرار قريبة وواضحة",
    tip: "استخدم مؤشر البحث لتبحث عن كل التفاصيل الخاصة بأي مريض في عيادتك",
  },
];

export const SecretaryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch appointments with error handling
      let appointments = [];
      try {
        const appointmentsResponse = await appointmentService.getAppointments();
        appointments = appointmentsResponse.data?.data || [];
        debugLog("SecretaryDashboard", "Appointments fetched successfully", {
          count: appointments.length,
        });
      } catch (appointmentsError) {
        debugError(
          "SecretaryDashboard",
          "Failed to fetch appointments",
          appointmentsError,
        );
        appointments = [];
      }

      // Fetch patients with error handling
      let patients = [];
      try {
        const patientsResponse = await patientService.getPatients();
        patients = patientsResponse.data?.data || [];
        debugLog("SecretaryDashboard", "Patients fetched successfully", {
          count: patients.length,
        });
      } catch (patientsError) {
        debugError(
          "SecretaryDashboard",
          "Failed to fetch patients",
          patientsError,
        );
        patients = [];
      }

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter((apt) => {
        const effectiveStatus =
          apt.status === "confirmed" ? "scheduled" : apt.status;
        return (
          typeof apt.date === "string" &&
          apt.date.startsWith(today) &&
          ["scheduled"].includes(effectiveStatus)
        );
      }).length;

      const pendingAppointments = appointments.filter((apt) =>
        ["pending", "reschedule_proposed"].includes(apt.status),
      ).length;

      setStats({
        todayAppointments,
        pendingAppointments,
        totalPatients: patients.length,
      });

      // Get recent appointments for timeline
      const sortedAppointments = appointments
        .slice()
        .sort((a, b) => {
          const aDate = new Date(a.createdAt || a.date).getTime();
          const bDate = new Date(b.createdAt || b.date).getTime();
          return bDate - aDate;
        })
        .slice(0, 5);

      setRecentAppointments(sortedAppointments);

      debugLog("SecretaryDashboard", "Dashboard data calculated", {
        todayAppointments,
        pendingAppointments,
        totalPatients: patients.length,
      });
    } catch (err) {
      debugError(
        "SecretaryDashboard",
        "Unexpected error in fetchDashboardData",
        err,
      );
      if (!err.response || err.response.status >= 500) {
        setError(
          "Failed to load dashboard data. Please try refreshing the page.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("clinic-tour-seen")) {
      setTimeout(() => setTourOpen(true), 600);
    }
  }, []);

  // Stat cards configuration
  const statCards = [
    {
      title: "مواعيد اليوم",
      value: stats.todayAppointments,
      icon: CalendarDays,
      gradient: "from-blue-500 to-cyan-400",
      onClick: () => navigate("/secretary/appointments"),
    },
    {
      title: "المهام المعلقة",
      value: stats.pendingAppointments,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
      onClick: () => navigate("/secretary/appointments"),
    },
    {
      title: "إجمالي المرضى",
      value: stats.totalPatients,
      icon: Users,
      gradient: "from-emerald-500 to-green-400",
      onClick: () => navigate("/secretary/patients"),
    },
  ];

  // Quick actions configuration
  const quickActions = [
    {
      icon: Plus,
      label: "موعد جديد",
      onClick: () => navigate("/secretary/appointments/new"),
    },
    {
      icon: Users,
      label: "قائمة المرضى",
      onClick: () => navigate("/secretary/patients"),
    },
    {
      icon: FileText,
      label: "قائمة المواعيد",
      onClick: () => navigate("/secretary/appointments"),
    },
  ];

  const handleTourNext = () => {
    setTourStep((prev) => Math.min(prev + 1, SECRETARY_TOUR_STEPS.length - 1));
  };

  const handleTourBack = () => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTourClose = () => {
    setTourOpen(false);
    setTourStep(0);
    localStorage.setItem("clinic-tour-seen", "true");
  };

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <LoadingSpinner message="Loading your dashboard..." size="lg" />
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="secretary">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400 mb-3 font-semibold"
                  >
                    مرحباً بعودتك
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    {user?.name || "Secretary"}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    {new Date().toLocaleDateString("ar-EG", {
                      calendar: "gregory",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 max-w-xl text-gray-500 dark:text-gray-400"
                  >
                    من هنا يمكنك إدارة جميع عمليات العيادة، من تنظيم المواعيد
                    إلى الوصول إلى سجلات المرضى، كل ذلك في مكان واحد أنيق وسهل
                    الاستخدام.
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
                      ابدأ الجولة
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <TelegramConnectButton
                      userRole="secretary"
                      userId={user?._id || user?.id}
                      isLinked={Boolean(user?.telegramChatId)}
                      botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
                    />
                  </motion.div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 opacity-20 blur-2xl" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <BentoGridItem
                key={card.title}
                delay={index * 0.1}
                className="h-full"
              >
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={card.onClick}
                >
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
                      {card.value}
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {card.title}
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
            Quick Actions
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

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  أحداث سريعة
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  أحدث مواعيد تمت جدولتها أو تحديثها
                </p>
              </div>
              <button
                onClick={() => navigate("/secretary/appointments")}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                عرض الكل
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((apt, index) => (
                  <motion.div
                    key={apt._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                    onClick={() => navigate("/secretary/appointments")}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
                      {apt.patientId?.name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {apt.patientId?.name || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(apt.date).toLocaleDateString("ar-EG", {
                          calendar: "gregory",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • {apt.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} size="xs" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No recent activity"
                description="There are no recent appointments to display."
                size="sm"
              />
            )}
          </GlassCard>

          {/* Upcoming Today */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  مواعيد اليوم
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  مواعيد اليوم
                </p>
              </div>
              <button
                onClick={() => navigate("/secretary/appointments")}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                عرض الكل
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stats.todayAppointments}
                  </div>
                  <p className="text-sm">appointments today</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <GuidedTour
          isOpen={tourOpen}
          steps={SECRETARY_TOUR_STEPS}
          currentStep={tourStep}
          onNext={handleTourNext}
          onBack={handleTourBack}
          onClose={handleTourClose}
        />
      </div>
    </MainLayout>
  );
};
