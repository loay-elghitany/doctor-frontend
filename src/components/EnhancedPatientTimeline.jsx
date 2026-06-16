import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Calendar,
  Pill,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  Loader,
} from "lucide-react";

/**
 * Enhanced Patient Timeline Component
 * Features: Filtering, search, pagination, lazy-loading, badges
 * Displays appointments, prescriptions, and doctor notes
 */
const EnhancedPatientTimeline = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    eventType: "all", // all, appointment, prescription, note
    startDate: "",
    endDate: "",
    doctorId: "",
    searchText: "",
    limit: 20,
    offset: 0,
  });

  // Expanded state for collapsible events
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
  });

  // Fetch timeline events
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `/api/patient/timeline/filtered?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch timeline");

      const result = await response.json();

      if (result.success) {
        const data = result.data || {};
        setEvents(Array.isArray(data.events) ? data.events : []);
        setPagination({
          total: data.pagination?.total ?? 0,
          hasMore: data.pagination?.hasMore ?? false,
        });
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/patient/timeline/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.data ?? {});
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTimeline();
    fetchStats();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      offset: 0, // Reset pagination when filtering
    }));
  };

  // Apply filter
  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, offset: 0 }));
    fetchTimeline();
  };

  // Pagination
  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  // Toggle expand
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get icon for event type
  const getEventIcon = (type) => {
    switch (type) {
      case "appointment":
        return <Calendar className="text-blue-500" size={20} />;
      case "prescription":
        return <Pill className="text-purple-500" size={20} />;
      case "note":
        return <FileText className="text-green-500" size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  // Get badge styling
  const getBadgeStyle = (badge, color) => {
    const colorMap = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            الجدول الزمني للمرضى
          </h1>
          <p className="text-gray-600 mt-2">
            تاريخك الطبي الكامل مع المواعيد والوصفات والملاحظات الطبية
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">إجمالي الأحداث</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">المواعيد</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.byType?.appointments || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">الروشتات</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.byType?.prescriptions || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">الملاحظات الطبية</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.byType?.notes || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">التصفية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الحدث
              </label>
              <select
                name="eventType"
                value={filters.eventType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option
                  value={t("components_EnhancedPatientTimeline.attr_value_all")}
                >
                  جميع الأحداث
                </option>
                <option
                  value={t(
                    "components_EnhancedPatientTimeline.attr_value_appointment",
                  )}
                >
                  المواعيد
                </option>
                <option
                  value={t(
                    "components_EnhancedPatientTimeline.attr_value_prescription",
                  )}
                >
                  الروشتات
                </option>
                <option
                  value={t(
                    "components_EnhancedPatientTimeline.attr_value_note",
                  )}
                >
                  ملاحظات الطبيب
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                بحث
              </label>
              <input
                type="text"
                name="searchText"
                placeholder={t(
                  "components_EnhancedPatientTimeline.attr_placeholder_search_by_doctor_not",
                )}
                value={filters.searchText}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى تاريخ
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              تطبيق التصفية
            </button>

            <button
              onClick={() => {
                setFilters({
                  eventType: "all",
                  startDate: "",
                  endDate: "",
                  doctorId: "",
                  searchText: "",
                  limit: 20,
                  offset: 0,
                });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
            >
              تصفية جديدة
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader
                className="animate-spin mx-auto text-blue-600"
                size={32}
              />

              <p className="mt-2 text-gray-600">
                {t("components_EnhancedPatientTimeline.text_loading_timeline")}
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">
                  {t("components_EnhancedPatientTimeline.text_error")}
                </p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">لا توجد أحداث طبية بعد</p>
            </div>
          ) : (
            <>
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                    event.isHighPriority ? "border-l-4 border-red-500" : ""
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getEventIcon(event.type)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.eventDate).toLocaleDateString(
                            "ar-EG",
                            {
                              calendar: "gregory",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {event.badge && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeStyle(
                          event.badge,
                          event.badgeColor,
                        )}`}
                      >
                        {event.badge}
                      </span>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="bg-gray-50 rounded-md p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.metadata?.doctorName && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            الطبيب
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.doctorName}
                          </p>
                        </div>
                      )}

                      {event.metadata?.status && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            الحالة
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.status}
                          </p>
                        </div>
                      )}

                      {event.metadata?.timeSlot && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            الوقت
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.timeSlot}
                          </p>
                        </div>
                      )}

                      {event.metadata?.medications && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            الأدوية
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.medications}
                          </p>
                        </div>
                      )}

                      {event.metadata?.diagnosis && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            التشخيص
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes/Description */}
                  {(event.metadata?.notes || event.metadata?.description) && (
                    <div className="border-t pt-3">
                      <button
                        onClick={() => toggleExpand(event.id)}
                        className="w-full flex items-center justify-between text-left py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
                      >
                        <span>ملاحظات</span>
                        {expandedIds.has(event.id) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>

                      {expandedIds.has(event.id) && (
                        <p className="mt-2 text-gray-700 bg-blue-50 p-3 rounded text-sm leading-relaxed">
                          {event.metadata?.notes || event.metadata?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                  >
                    تحميل المزيد من الأحداث
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center text-sm text-gray-600 py-4">
                {t("components_EnhancedPatientTimeline.text_showing")}
                {events.length}
                {t("components_EnhancedPatientTimeline.text_of")}
                {pagination.total}
                {t("components_EnhancedPatientTimeline.text_events")}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPatientTimeline;
