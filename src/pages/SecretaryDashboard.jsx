import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { Spinner, Alert, Card, Button } from "../components/ui";
import { MedicalHeroIllustration } from "../components/illustrations/MedicalHeroIllustration";
import { GuidedTour } from "../components/GuidedTour";
import { useAuth } from "../context/AuthContext";
import { CalendarDays, Users, Clock } from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";

const SECRETARY_TOUR_STEPS = [
  {
    title: "Welcome to the Secretary Dashboard",
    description:
      "Manage clinic operations, appointments, and patient records from this central hub.",
    tip: "Use the sidebar navigation to access common tasks.",
  },
  {
    title: "Today's Overview",
    description:
      "See today's appointments, pending tasks, and patient statistics at a glance.",
    tip: "Click on any stat card to view detailed information.",
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
        // Don't fail completely if appointments fail - continue with empty array
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
        // Don't fail completely if patients fail
        patients = [];
      }

      // Calculate stats even if some data is missing
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter(
        (apt) =>
          typeof apt.date === "string" &&
          apt.date.startsWith(today) &&
          ["scheduled", "confirmed"].includes(apt.status),
      ).length;

      const pendingAppointments = appointments.filter((apt) =>
        ["pending", "reschedule_proposed"].includes(apt.status),
      ).length;

      setStats({
        todayAppointments,
        pendingAppointments,
        totalPatients: patients.length,
      });

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
      // Only set error for unexpected errors, not for expected API failures
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

  const statCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarDays,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      onClick: () => navigate("/secretary/appointments"),
    },
    {
      title: "Pending Tasks",
      value: stats.pendingAppointments,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      onClick: () => navigate("/secretary/appointments"),
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      onClick: () => navigate("/secretary/patients"),
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="secretary">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name || "Secretary"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setTourOpen(true)}
                className="flex items-center gap-2"
              >
                <span>Take Tour</span>
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className={`${stat.bgColor} border-0 hover:shadow-lg transition-all cursor-pointer`}
                  onClick={stat.onClick}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-white dark:bg-gray-800`}>
                      <stat.icon size={24} className={stat.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center"
          >
            <MedicalHeroIllustration />
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Alert type="error" message={error} />
            </motion.div>
          )}
        </div>

        {/* Guided Tour */}
        <GuidedTour
          steps={SECRETARY_TOUR_STEPS}
          isOpen={tourOpen}
          currentStep={tourStep}
          onClose={() => setTourOpen(false)}
          onNext={() => setTourStep((prev) => prev + 1)}
          onPrev={() => setTourStep((prev) => prev - 1)}
        />
      </div>
    </MainLayout>
  );
};
