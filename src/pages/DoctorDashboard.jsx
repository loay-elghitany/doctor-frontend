import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { MedicalHeroIllustration } from "../components/illustrations/MedicalHeroIllustration";
import { GuidedTour } from "../components/GuidedTour";
import { Modal, Button, Input } from "../components/ui";
import authService from "../services/authService";

// LOCAL DASHBOARD PRESENTATION LAYER MAPPING
// This mapping is used ONLY for dashboard statistics display
// It maps system appointment statuses to dashboard display categories
// NOTE: This is NOT a system status change - it's purely for presentation
const DASHBOARD_STATUS_MAPPING = {
  // "Completed Appointments" = only appointments actually marked completed by doctor
  completedStatuses: ["completed"],
  // "Upcoming Appointments" = scheduled or confirmed (backward compat) appointments
  upcomingStatuses: ["scheduled", "confirmed"],
  // "Pending Requests" = pending confirmation or awaiting patient choice on rescheduled times
  pendingStatuses: ["pending", "reschedule_proposed"],
};

const DOCTOR_TOUR_STEPS = [
  {
    title: "Welcome to your clinic hub",
    description:
      "This dashboard surfaces your most important appointments, patient flow, and daily metrics in one premium view.",
    tip: "Use the theme toggle in the header to switch between light and dark mode.",
  },
  {
    title: "Live appointment stats",
    description:
      "Track your daily appointment volume, pending confirmations, completed care, and cancellations instantly.",
    tip: "Hover over a card to see smooth motion and priority feedback.",
  },
  {
    title: "Upcoming appointments",
    description:
      "Access the next 7 days of appointments with a fast action button for the full schedule.",
    tip: "Click the appointments button to open the full calendar experience.",
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

  const { user } = useAuth();
  const navigate = useNavigate();
  const welcomeName = user?.name ? user.name.split(" ")[0] : "Doctor";
  const formattedDate = format(new Date(), "EEEE, MMMM do");

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats.today,
      icon: CalendarDays,
      accent: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Pending Confirmations",
      value: stats.pending,
      icon: Clock3,
      accent: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      accent: "bg-red-500/10 text-red-600",
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        debugLog("DoctorDashboard", "Fetching dashboard data");
        const response = await appointmentService.getAppointments();

        // Extract appointments from nested data structure
        const appointments = response.data?.data || [];
        debugLog("DoctorDashboard", "Appointments retrieved", {
          count: appointments.length,
        });

        // Calculate statistics
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
          // Count by status
          if (DASHBOARD_STATUS_MAPPING.pendingStatuses.includes(apt.status))
            pendingCount++;
          // Count actual completed appointments
          if (DASHBOARD_STATUS_MAPPING.completedStatuses.includes(apt.status))
            completedCount++;
          if (apt.status === "cancelled") cancelledCount++;

          // Count today's appointments
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);
          if (aptDate.getTime() === today.getTime()) {
            todayCount++;
          }

          // Get upcoming appointments (next 7 days, not cancelled, and scheduled/confirmed)
          if (
            apt.date &&
            new Date(apt.date) >= today &&
            new Date(apt.date) <
              new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
            apt.status !== "cancelled" &&
            DASHBOARD_STATUS_MAPPING.upcomingStatuses.includes(apt.status)
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

        // Sort upcoming by date and time
        upcomingList.sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.timeSlot || "").localeCompare(b.timeSlot || "");
        });

        setUpcomingAppointments(upcomingList.slice(0, 5)); // Show top 5
      } catch (err) {
        const errorMsg = handleApiError(err);
        debugError("DoctorDashboard", "Failed to fetch dashboard data", err);
        setError(errorMsg || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("clinic-tour-seen")) {
      setTimeout(() => setTourOpen(true), 600);
    }
  }, []);

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

      setSecretarySuccess("Secretary created successfully!");
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

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8">
        <div className="rounded-[30px] bg-white p-8 shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500 mb-3">
                Welcome back
              </p>
              <h1 className="text-4xl font-semibold text-slate-900">
                Welcome, Dr. {welcomeName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{formattedDate}</p>
              <p className="mt-4 max-w-xl text-sm text-slate-500">
                Your clinic overview is ready — manage appointments, monitor
                patient flow, and stay in control of every care detail.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setTourOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start tour
                </button>
                <button
                  onClick={() => navigate("/doctor/appointments")}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
                >
                  Explore schedule
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="hidden xl:block xl:w-96">
              <MedicalHeroIllustration />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: "easeInOut",
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-6 text-4xl font-semibold text-slate-900">
                  {loading ? "-" : card.value}
                </div>
                <p className="mt-3 text-sm text-slate-500">{card.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="card p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Upcoming Appointments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Next 7 days of scheduled appointments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSecretaryModalOpen}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Add Secretary
              </button>
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View all appointments
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => {
                const aptDate = new Date(apt.date);
                const patientName = apt.patientId?.name || "Unknown Patient";
                return (
                  <motion.div
                    key={apt._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {patientName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {aptDate.toLocaleDateString()} • {apt.timeSlot}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`badge ${
                          apt.status === "scheduled"
                            ? "badge-scheduled"
                            : apt.status === "confirmed"
                              ? "badge-confirmed"
                              : apt.status === "cancelled"
                                ? "badge-cancelled"
                                : "badge-pending"
                        }`}
                      >
                        {apt.status}
                      </span>
                      <button
                        onClick={() => navigate("/doctor/appointments")}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500">
              No appointments scheduled.
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                View all appointments
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Secretary Creation Modal */}
      <Modal
        isOpen={secretaryModalOpen}
        onClose={handleSecretaryModalClose}
        title="Add New Secretary"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleSecretaryModalClose}
              disabled={secretaryLoading}
            >
              Cancel
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {secretaryError}
            </div>
          )}
          {secretarySuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {secretarySuccess}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="Enter secretary's full name"
            value={secretaryForm.name}
            onChange={handleSecretaryFormChange}
            required
            disabled={secretaryLoading}
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter secretary's email"
            value={secretaryForm.email}
            onChange={handleSecretaryFormChange}
            required
            disabled={secretaryLoading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter a secure password"
            value={secretaryForm.password}
            onChange={handleSecretaryFormChange}
            required
            disabled={secretaryLoading}
          />
        </form>
      </Modal>

      <GuidedTour
        isOpen={tourOpen}
        steps={DOCTOR_TOUR_STEPS}
        currentStep={tourStep}
        onNext={handleTourNext}
        onBack={handleTourBack}
        onClose={handleTourClose}
      />
    </MainLayout>
  );
};
