import React, { useState, useEffect } from "react";
import { BarChart, LineChart, PieChart } from "lucide-react";

/**
 * Admin Dashboard Component
 * Displays WhatsApp notification history, statistics, filtering, and retry options
 */
const AdminNotificationDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    doctorId: "",
    patientId: "",
    startDate: "",
    endDate: "",
    limit: 50,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `/api/admin/notifications?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.doctorId) queryParams.append("doctorId", filters.doctorId);
      if (filters.patientId) queryParams.append("patientId", filters.patientId);

      const response = await fetch(
        `/api/admin/notifications/stats?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch statistics");

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  // Apply filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0, // Reset pagination when filtering
    }));
  };

  // Apply date filter
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0,
    }));
  };

  // Search button click
  const handleSearch = () => {
    fetchNotifications();
    fetchStats();
  };

  // Retry failed
  const handleRetry = async () => {
    try {
      const response = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`Retried ${result.data.retriedCount} notifications`);
        handleSearch();
      }
    } catch (err) {
      alert("Failed to retry notifications");
      console.error("Error:", err);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "limit" && key !== "offset") {
          queryParams.append(key, value);
        }
      });

      window.location.href = `/api/admin/notifications/export?${queryParams.toString()}`;
    } catch (err) {
      alert("Failed to export notifications");
      console.error("Error:", err);
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
    fetchNotifications();
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, filters.offset - filters.limit);
    setFilters((prev) => ({
      ...prev,
      offset: newOffset,
    }));
    fetchNotifications();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            WhatsApp Notifications Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage all WhatsApp notifications
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total}
                  </p>
                </div>
                <BarChart className="text-blue-400" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Sent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.sent || 0}
                  </p>
                </div>
                <div className="text-green-400 text-2xl">✓</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.byStatus.failed || 0}
                  </p>
                </div>
                <div className="text-red-400 text-2xl">✗</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.byStatus.pending || 0}
                  </p>
                </div>
                <div className="text-yellow-400 text-2xl">⏳</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="appointment_created">Appointment Created</option>
                <option value="appointment_confirmed">
                  Appointment Confirmed
                </option>
                <option value="appointment_cancelled">
                  Appointment Cancelled
                </option>
                <option value="appointment_proposed">
                  Appointment Proposed
                </option>
                <option value="prescription_created">
                  Prescription Created
                </option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              Search
            </button>

            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none"
            >
              Retry Failed
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
            >
              Export CSV
            </button>

            <button
              onClick={() => {
                setFilters({
                  type: "",
                  status: "",
                  doctorId: "",
                  patientId: "",
                  startDate: "",
                  endDate: "",
                  limit: 50,
                  offset: 0,
                  sortBy: "createdAt",
                  sortOrder: "desc",
                });
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>No notifications found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Recipient
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Phone (Masked)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Retries
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notifications.map((notif) => (
                    <tr key={notif._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-block px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                          {notif.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {notif.recipientId?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {notif.phoneNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-md font-medium ${
                            notif.status === "sent"
                              ? "bg-green-100 text-green-800"
                              : notif.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {notif.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {notif.retryCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {notif.sentAt
                          ? new Date(notif.sentAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filters.offset + 1} to{" "}
                  {Math.min(filters.offset + filters.limit, pagination.total)}{" "}
                  of {pagination.total} notifications
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={filters.offset === 0}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationDashboard;
