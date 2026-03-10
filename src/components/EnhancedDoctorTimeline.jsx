import React, { useState, useEffect } from "react";
import {
  Calendar,
  Pill,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  Search,
  Loader,
  Zap,
  Clock,
} from "lucide-react";

/**
 * Enhanced Doctor Timeline Component
 * Features: Collapsible events, new event highlighting, patient search, filtering
 */
const EnhancedDoctorTimeline = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    patientId: "",
    eventType: "all", // all, appointment, prescription, note
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
    newEventsCount: 0,
  });

  // Fetch doctor timeline events
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
        `/api/doctor/timeline/filtered?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch timeline");

      const result = await response.json();

      if (result.success) {
        setEvents(result.data.events);
        setPagination({
          total: result.data.pagination.total,
          hasMore: result.data.pagination.hasMore,
          newEventsCount: result.data.summary?.newEventsCount || 0,
        });

        // Mark as read after fetching
        markTimelineAsRead();
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching doctor timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/doctor/timeline/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching doctor timeline stats:", err);
    }
  };

  // Mark timeline as read
  const markTimelineAsRead = async () => {
    try {
      await fetch(`/api/doctor/timeline/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Error marking timeline as read:", err);
    }
  };

  // Search patient events by text
  const handleSearch = async () => {
    if (!filters.searchText.trim()) return;

    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      queryParams.append("searchText", filters.searchText);
      if (filters.patientId) {
        queryParams.append("patientId", filters.patientId);
      }

      const response = await fetch(
        `/api/doctor/timeline/search?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Search failed");

      const result = await response.json();

      if (result.success) {
        setEvents(result.data.events);
        setPagination({
          total: result.data.pagination?.total || result.data.events.length,
          hasMore: false,
          newEventsCount: 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      offset: 0,
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
            Patient Timeline Events
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage all appointments and prescriptions across your
            patients
          </p>
        </div>

        {/* New Events Alert */}
        {pagination.newEventsCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Zap className="text-blue-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-blue-800">
                {pagination.newEventsCount} New Event
                {pagination.newEventsCount !== 1 ? "s" : ""}
              </p>
              <p className="text-blue-700 text-sm">
                You have recent updates since your last login
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalEvents}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completedCount || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.cancelledCount || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">Unique Patients</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.uniquePatients || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">
              Filters & Search
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="eventType"
                value={filters.eventType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="appointment">Appointments</option>
                <option value="prescription">Prescriptions</option>
                <option value="note">Doctor Notes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search size={16} className="inline mr-1" />
                Quick Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="searchText"
                  placeholder="Search patient or event..."
                  value={filters.searchText}
                  onChange={handleFilterChange}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              Apply Filters
            </button>

            <button
              onClick={() => {
                setFilters({
                  patientId: "",
                  eventType: "all",
                  searchText: "",
                  limit: 20,
                  offset: 0,
                });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
            >
              Clear Filters
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
              <p className="mt-2 text-gray-600">Loading timeline...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">No events found</p>
            </div>
          ) : (
            <>
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                    event.isNew ? "border-l-4 border-blue-500 bg-blue-50" : ""
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getEventIcon(event.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {event.title}
                          </h3>
                          {event.isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                              <Zap size={12} />
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Patient Info */}
                        {event.patient && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-700">
                              <span className="font-medium">Patient:</span>{" "}
                              {event.patient.name}
                            </p>
                            <p className="text-gray-600">
                              {event.patient.email}
                            </p>
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mt-2">
                          {new Date(event.eventDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
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
                      {event.metadata?.status && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            Status
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.status}
                          </p>
                        </div>
                      )}

                      {event.metadata?.timeSlot && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            Time
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.timeSlot}
                          </p>
                        </div>
                      )}

                      {event.metadata?.medications && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            Medications
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.medications}
                          </p>
                        </div>
                      )}

                      {event.metadata?.diagnosis && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase">
                            Diagnosis
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.diagnosis}
                          </p>
                        </div>
                      )}

                      {event.metadata?.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-600 uppercase">
                            Notes
                          </p>
                          <p className="font-medium text-gray-800">
                            {event.metadata.notes.substring(0, 100)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {event.collapsible && (
                    <div className="border-t pt-3">
                      <button
                        onClick={() => toggleExpand(event.id)}
                        className="w-full flex items-center justify-between text-left py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Clock size={16} />
                          View Full Details
                        </span>
                        {expandedIds.has(event.id) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>

                      {expandedIds.has(event.id) && (
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                          <p className="text-gray-700 leading-relaxed">
                            {event.collapsible.fullContent ||
                              event.metadata?.notes}
                          </p>
                        </div>
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
                    Load More Events
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center text-sm text-gray-600 py-4">
                Showing {events.length} of {pagination.total} events
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDoctorTimeline;
