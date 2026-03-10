import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

/**
 * Admin Analytics Dashboard Component
 * Features: KPIs, top doctors, trends, alerts, CSV export
 */
const AdminAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    period: "weekly", // daily, weekly, monthly
  });

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("startDate", dateRange.startDate);
      queryParams.append("endDate", dateRange.endDate);
      queryParams.append("limit", 10);

      const response = await fetch(
        `/api/admin/analytics?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch analytics");

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trends
  const fetchTrends = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("period", dateRange.period);
      queryParams.append("days", dateRange.period === "daily" ? 7 : 30);

      const response = await fetch(
        `/api/admin/analytics/trends?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch trends");

      const result = await response.json();

      if (result.success) {
        setTrends(result.data.trends);
      }
    } catch (err) {
      console.error("Error fetching trends:", err);
    }
  };

  // Export analytics
  const handleExport = async () => {
    try {
      setExporting(true);

      const queryParams = new URLSearchParams();
      queryParams.append("startDate", dateRange.startDate);
      queryParams.append("endDate", dateRange.endDate);

      const response = await fetch(
        `/api/admin/analytics/export?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalytics();
    fetchTrends();
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Colors for charts
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Notification Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor notification delivery, system health, and user engagement
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  handleDateRangeChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  handleDateRangeChange("endDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trend Period
              </label>
              <select
                value={dateRange.period}
                onChange={(e) =>
                  handleDateRangeChange("period", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPIs */}
        {analytics?.kpis && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.kpis.total}
                  </p>
                </div>
                <MessageSquare size={32} className="text-blue-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Sent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.kpis.sent}
                  </p>
                </div>
                <CheckCircle size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.kpis.failed}
                  </p>
                </div>
                <AlertTriangle size={32} className="text-red-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.kpis.pending}
                  </p>
                </div>
                <Clock size={32} className="text-yellow-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Delivery Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.kpis.overallDeliveryRate?.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp size={32} className="text-purple-200" />
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {analytics?.alerts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* High Priority Failures */}
            {analytics.alerts.highPriorityFailures &&
              analytics.alerts.highPriorityFailures.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-red-600" size={20} />
                    <h3 className="font-bold text-red-800">
                      High Priority Failures
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {analytics.alerts.highPriorityFailures
                      .slice(0, 5)
                      .map((alert, i) => (
                        <div key={i} className="text-sm text-red-700">
                          <p className="font-medium">
                            Doctor ID: {alert.doctorId} - {alert.failureCount}{" "}
                            failures
                          </p>
                          <p>Retry Count: {alert.maxRetryCount}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Consecutive Failures */}
            {analytics.alerts.consecutiveFailures &&
              analytics.alerts.consecutiveFailures.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-orange-600" size={20} />
                    <h3 className="font-bold text-orange-800">
                      Consecutive Failures (≥5)
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {analytics.alerts.consecutiveFailures
                      .slice(0, 5)
                      .map((alert, i) => (
                        <div key={i} className="text-sm text-orange-700">
                          <p className="font-medium">
                            Doctor ID: {alert.doctorId} -{" "}
                            {alert.consecutiveCount} consecutive
                          </p>
                          <p>Last Status: {alert.lastStatus}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Trends Chart */}
          {trends && trends.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Notification Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" style={{ fontSize: 12 }} />
                  <YAxis style={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#10b981"
                    name="Sent"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    name="Failed"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Type Breakdown */}
          {analytics?.typeBreakdown && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Notification Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.typeBreakdown).map(
                      ([name, value]) => ({
                        name,
                        value,
                      }),
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analytics.typeBreakdown).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Doctors */}
        {analytics?.topDoctors && analytics.topDoctors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Top Doctors by Notifications
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-gray-700 font-bold">
                      Doctor
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 font-bold">
                      Total Notifications
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 font-bold">
                      Delivery Rate
                    </th>
                    <th className="text-right py-2 px-4 text-gray-700 font-bold">
                      Failed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topDoctors.map((doctor) => (
                    <tr
                      key={doctor.doctorId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {doctor.name || doctor.doctorId}
                      </td>
                      <td className="text-right py-3 px-4">
                        {doctor.notificationCount}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            doctor.deliveryRate >= 95
                              ? "bg-green-100 text-green-800"
                              : doctor.deliveryRate >= 80
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doctor.deliveryRate?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 font-bold">
                        {doctor.failedCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Patients */}
        {analytics?.activePatients && analytics.activePatients.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Top Active Patients
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.activePatients.slice(0, 6).map((patient) => (
                <div
                  key={patient.patientId}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <p className="font-bold text-gray-800">
                    {patient.name || patient.patientId}
                  </p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                  <p className="mt-2 text-lg font-bold text-blue-600">
                    {patient.notificationsReceived} notifications
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
