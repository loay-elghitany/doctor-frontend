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
        const response = await appointmentService.getDoctorAppointments();

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

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8">
        <div className="rounded-[30px] bg-white p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500 mb-3">
                Welcome back
              </p>
              <h1 className="text-4xl font-semibold text-slate-900">
                Welcome, Dr. {welcomeName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{formattedDate}</p>
            </div>
            <div className="inline-flex items-center rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <CalendarDays className="h-5 w-5 text-slate-500 mr-2" />
              Today&apos;s overview
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
            <button
              onClick={() => navigate("/doctor/appointments")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View all appointments
              <ArrowRight className="h-4 w-4" />
            </button>
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
    </MainLayout>
  );
};
