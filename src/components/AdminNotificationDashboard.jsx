import { useState, useEffect } from "react";
import { BarChart } from "lucide-react";
import { createAdminService } from "../services/adminService";

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

  const adminService = createAdminService();

  // Fetch notifications
  const fetchNotifications = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getNotifications(activeFilters);
      const result = response.data;

      if (result.success) {
        setNotifications(
          Array.isArray(result.data?.notifications)
            ? result.data.notifications
            : [],
        );
        setPagination({
          total: result.data?.pagination?.total ?? 0,
          limit: result.data?.pagination?.limit ?? activeFilters.limit,
          offset: result.data?.pagination?.offset ?? activeFilters.offset,
          hasMore: result.data?.pagination?.hasMore ?? false,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await adminService.getNotificationStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
        doctorId: filters.doctorId,
        patientId: filters.patientId,
      });

      const result = response.data;
      if (result.success) {
        setStats(result.data ?? {});
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
      const response = await adminService.retryNotifications();
      const result = response.data;
      const retriedCount = result?.data?.retriedCount ?? 0;

      if (result.success) {
        alert(`Retried ${retriedCount} notifications`);
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
      const params = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && key !== "limit" && key !== "offset") {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await adminService.exportNotifications(params);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notifications-${filters.startDate || "all"}-${filters.endDate || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export notifications");
      console.error("Error:", err);
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    setFilters((prev) => {
      const next = {
        ...prev,
        offset: prev.offset + prev.limit,
      };
      fetchNotifications(next);
      return next;
    });
  };

  const handlePrevPage = () => {
    setFilters((prev) => {
      const next = {
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      };
      fetchNotifications(next);
      return next;
    });
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
                    {stats?.byStatus?.sent || 0}
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
                    {stats?.byStatus?.failed || 0}
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
                    {stats?.byStatus?.pending || 0}
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
                        {notif.createdAt
                          ? `${new Date(notif.createdAt).toLocaleDateString("ar-EG", { calendar: "gregory", year: "numeric", month: "short", day: "numeric" })} ${new Date(notif.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {notif.sentAt
                          ? `${new Date(notif.sentAt).toLocaleDateString("ar-EG", { calendar: "gregory", year: "numeric", month: "short", day: "numeric" })} ${new Date(notif.sentAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`
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
