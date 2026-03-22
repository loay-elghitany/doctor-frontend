import React, { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/Layout";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="text-3xl font-bold text-blue-600">
              {loading ? "-" : stats.today}
            </div>
            <p className="text-gray-600 mt-2">Today's Appointments</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-yellow-600">
              {loading ? "-" : stats.pending}
            </div>
            <p className="text-gray-600 mt-2">Pending Confirmations</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">
              {loading ? "-" : stats.completed}
            </div>
            <p className="text-gray-600 mt-2">Completed</p>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-red-600">
              {loading ? "-" : stats.cancelled}
            </div>
            <p className="text-gray-600 mt-2">Cancelled</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Upcoming Appointments
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => {
                const aptDate = new Date(apt.date);
                const patientName = apt.patientId?.name || "Unknown Patient";
                return (
                  <div
                    key={apt._id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{patientName}</p>
                      <p className="text-sm text-gray-500">
                        {aptDate.toLocaleDateString()} at {apt.timeSlot}
                      </p>
                    </div>
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-medium ${
                        apt.status === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : apt.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">
              No appointments scheduled.{" "}
              <a
                href="/doctor/appointments"
                className="text-blue-600 hover:underline"
              >
                View all appointments
              </a>
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
