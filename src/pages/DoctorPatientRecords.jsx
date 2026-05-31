import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import {
  GlassCard,
  BentoGridItem,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  PremiumSearch,
} from "../components/ui";
import { DoctorPatientTimeline } from "../components/DoctorPatientTimeline";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";
import api from "../services/api";
import WhatsAppButtonForDoctor from "../components/WhatsAppButtonForDoctor";
import {
  Users,
  Search,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  History,
  Filter,
  ArrowRight,
  Activity,
  Clock,
  FileText,
  Lock,
  Plus,
  Mic,
  Pin,
  Edit,
  Trash2,
} from "lucide-react";

export const DoctorPatientRecords = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] =
    useState(null);
  const [patientAppointments, setPatientAppointments] = useState({});
  const [appointmentLoading, setAppointmentLoading] = useState({});
  const [privateNotes, setPrivateNotes] = useState({});
  const [notesLoading, setNotesLoading] = useState({});
  const [showAddNoteForm, setShowAddNoteForm] = useState({});
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("yellow");
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Static color mappings to prevent Tailwind purging
  const pickerColors = {
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    default: "bg-gray-200",
  };

  const cardColors = {
    red: "bg-red-50",
    green: "bg-green-50",
    blue: "bg-blue-50",
    yellow: "bg-yellow-50",
    default: "bg-white",
  };

  // Fetch all patients for this doctor
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError("");
      try {
        debugLog("DoctorPatientRecords", "Fetching patients");
        const response = await api.get("/doctors/patients");

        const data = response.data?.data || [];
        debugLog("DoctorPatientRecords", "Patients retrieved", {
          count: data.length,
        });

        setPatients(data);
      } catch (err) {
        const errorMsg = handleApiError(err);
        debugError("DoctorPatientRecords", "Failed to fetch patients", err);
        setError(errorMsg || "Failed to load patient records");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Fetch appointments for a specific patient
  const fetchPatientAppointments = async (patientId) => {
    if (patientAppointments[patientId]) {
      // Already loaded, just toggle expansion
      return;
    }

    setAppointmentLoading((prev) => ({
      ...prev,
      [patientId]: true,
    }));

    try {
      const response = await api.get(
        `/doctors/patients/${patientId}/appointments`,
      );
      const appointments = response.data?.data || [];

      setPatientAppointments((prev) => ({
        ...prev,
        [patientId]: appointments,
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to fetch appointments", err);
      setPatientAppointments((prev) => ({
        ...prev,
        [patientId]: [],
      }));
    } finally {
      setAppointmentLoading((prev) => ({
        ...prev,
        [patientId]: false,
      }));
    }
  };

  // Fetch private notes for a patient
  const fetchPrivateNotes = async (patientId) => {
    setNotesLoading((prev) => ({
      ...prev,
      [patientId]: true,
    }));

    try {
      const response = await api.get(
        `/doctors/patients/${patientId}/private-notes`,
      );
      const notes = response.data?.data || [];

      setPrivateNotes((prev) => ({
        ...prev,
        [patientId]: notes,
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to fetch private notes", err);
      setPrivateNotes((prev) => ({
        ...prev,
        [patientId]: [],
      }));
    } finally {
      setNotesLoading((prev) => ({
        ...prev,
        [patientId]: false,
      }));
    }
  };

  // Handle patient expansion
  const handleExpandPatient = async (patientId) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
    } else {
      await Promise.all([
        fetchPatientAppointments(patientId),
        fetchPrivateNotes(patientId),
      ]);
      setExpandedPatientId(patientId);
    }
  };

  // Handle creating a new private note
  const handleCreateNote = async (patientId) => {
    if (!newNoteContent.trim()) return;

    try {
      const response = await api.post(
        `/doctors/patients/${patientId}/private-notes`,
        {
          content: newNoteContent,
          color: newNoteColor,
          isPinned: newNotePinned,
        },
      );

      const newNote = response.data?.data;
      setPrivateNotes((prev) => ({
        ...prev,
        [patientId]: [newNote, ...prev[patientId]],
      }));

      // Reset form
      setNewNoteContent("");
      setNewNoteColor("yellow");
      setNewNotePinned(false);
      setShowAddNoteForm((prev) => ({ ...prev, [patientId]: false }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to create note", err);
      // Handle error (could add toast notification)
    }
  };

  // Handle updating a note
  const handleUpdateNote = async (patientId, noteId, updates) => {
    try {
      const response = await api.put(
        `/doctors/patients/${patientId}/private-notes/${noteId}`,
        updates,
      );

      const updatedNote = response.data?.data;
      setPrivateNotes((prev) => ({
        ...prev,
        [patientId]: prev[patientId].map((note) =>
          note._id === noteId ? updatedNote : note,
        ),
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to update note", err);
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (patientId, noteId) => {
    try {
      await api.delete(
        `/doctors/patients/${patientId}/private-notes/${noteId}`,
      );

      setPrivateNotes((prev) => ({
        ...prev,
        [patientId]: prev[patientId].filter((note) => note._id !== noteId),
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to delete note", err);
    }
  };

  // Voice dictation
  const startVoiceDictation = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Voice dictation is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "ar-EG"; // Arabic (Egypt)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewNoteContent((prev) => prev + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // Filter and search patients
  const filteredPatients = patients.filter((patient) => {
    // Search filter
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Status filter
    if (filterType === "all") return true;

    const now = new Date();
    const hasUpcoming = patient.lastAppointmentDate
      ? new Date(patient.lastAppointmentDate) >= now
      : false;
    const hasPast = patient.lastAppointmentDate
      ? new Date(patient.lastAppointmentDate) < now
      : false;
    const hasCancelled =
      patient.statusSummary && patient.statusSummary.includes("cancelled");

    if (filterType === "upcoming") return hasUpcoming;
    if (filterType === "past") return hasPast;
    if (filterType === "cancelled") return hasCancelled;

    return true;
  });

  // Calculate stats
  const stats = {
    total: patients.length,
    withUpcoming: patients.filter(
      (p) =>
        p.lastAppointmentDate && new Date(p.lastAppointmentDate) >= new Date(),
    ).length,
    withPast: patients.filter(
      (p) =>
        p.lastAppointmentDate && new Date(p.lastAppointmentDate) < new Date(),
    ).length,
  };

  const statCards = [
    {
      title: "إجمالي المرضى",
      value: stats.total,
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "المواعيد القادمة",
      value: stats.withUpcoming,
      icon: Calendar,
      gradient: "from-emerald-500 to-green-400",
    },
    {
      title: "الزيارات السابقة",
      value: stats.withPast,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-blue-600 dark:text-blue-400 mb-3 font-semibold"
                  >
                    إدارة المرضى
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    سجل المرضى
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    عرض و إدارة تاريخ المرضى، والمواعيد، والجداول الطبية.
                  </motion.p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <BentoGridItem key={card.title} delay={index * 0.1}>
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {/* Timeline View - Show if patient selected */}
        {selectedPatientForTimeline ? (
          <GlassCard>
            <motion.button
              onClick={() => setSelectedPatientForTimeline(null)}
              whileHover={{ x: -4 }}
              className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              العودة إلى قائمة المرضى
            </motion.button>
            <DoctorPatientTimeline
              patientId={selectedPatientForTimeline.id}
              patientName={selectedPatientForTimeline.name}
            />
          </GlassCard>
        ) : (
          <>
            {/* Search and Filter Section */}
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="md:col-span-8">
                  <PremiumSearch
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full"
                  />
                </div>

                {/* Filter */}
                <div className="md:col-span-4">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="all">جميع المرضى</option>
                      <option value="upcoming">مع مواعيد قادمة</option>
                      <option value="past">مع مواعيد سابقة</option>
                      <option value="cancelled">مع مواعيد ملغاة</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Showing{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {filteredPatients.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {patients.length}
                </span>{" "}
                patients
              </p>
            </GlassCard>

            {/* Patients List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" message="Loading patients..." />
              </div>
            ) : filteredPatients.length === 0 ? (
              <EmptyState
                icon={Users}
                title={
                  searchTerm || filterType !== "all"
                    ? "لم يتم العثور على مرضى"
                    : "لا يوجد مرضى بعد"
                }
                description={
                  searchTerm || filterType !== "all"
                    ? "لا يوجد مرضى يطابق معايير البحث. حاول تعديل الفلاتر."
                    : "أنشئ مواعيد لبدء بناء قائمة المرضى."
                }
              />
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GlassCard className="overflow-hidden">
                        {/* Patient Header - Clickable to expand */}
                        <div
                          onClick={() => handleExpandPatient(patient.id)}
                          className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 p-5 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-lg">
                                {patient.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {patient.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    {patient.email}
                                  </span>
                                  {patient.phone && (
                                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                      <Phone className="w-4 h-4" />
                                      {patient.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {patient.totalAppointments}
                                  {patient.totalAppointments !== 1
                                    ? "مواعيد"
                                    : "موعد"}
                                </p>
                                {patient.lastAppointmentDate && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Last:{" "}
                                    {patient.lastAppointmentDate
                                      ? new Date(
                                          patient.lastAppointmentDate,
                                        ).toLocaleDateString("ar-EG", {
                                          calendar: "gregory",
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "-"}
                                  </p>
                                )}
                              </div>
                              <motion.div
                                animate={{
                                  rotate:
                                    expandedPatientId === patient.id ? 180 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                              >
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Status Summary Badges */}
                          {patient.statusSummary &&
                            patient.statusSummary.length > 0 && (
                              <div className="mt-4 flex gap-2 flex-wrap">
                                {Array.from(new Set(patient.statusSummary)).map(
                                  (status) => (
                                    <StatusBadge
                                      key={status}
                                      status={status}
                                      size="sm"
                                    />
                                  ),
                                )}
                              </div>
                            )}
                        </div>

                        {/* Appointment History - Expandable */}
                        <AnimatePresence>
                          {expandedPatientId === patient.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-100 dark:border-gray-800"
                            >
                              <div className="p-5 space-y-5">
                                {/* Medical Timeline Button */}
                                <motion.button
                                  onClick={() =>
                                    setSelectedPatientForTimeline(patient)
                                  }
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                                >
                                  <History className="w-5 h-5" />
                                  عرض الجدول الطبي
                                </motion.button>

                                {/* Appointments */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    تاريخ المواعيد
                                  </h4>

                                  {appointmentLoading[patient.id] ? (
                                    <div className="flex justify-center py-4">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  ) : patientAppointments[patient.id]
                                      ?.length === 0 ? (
                                    <EmptyState
                                      icon={Calendar}
                                      title="No appointments"
                                      description="This patient has no appointment history yet."
                                      size="sm"
                                    />
                                  ) : (
                                    <div className="space-y-3">
                                      {patientAppointments[patient.id]?.map(
                                        (apt, idx) => (
                                          <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                          >
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                  {apt.date
                                                    ? new Date(
                                                        apt.date,
                                                      ).toLocaleDateString(
                                                        "ar-EG",
                                                        {
                                                          calendar: "gregory",
                                                          year: "numeric",
                                                          month: "short",
                                                          day: "numeric",
                                                        },
                                                      )
                                                    : "-"}
                                                </p>
                                                <span className="text-gray-400">
                                                  •
                                                </span>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                  {apt.timeSlot}
                                                </p>
                                              </div>
                                              {apt.notes && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                  {apt.notes}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <WhatsAppButtonForDoctor
                                                patientId={patient.id}
                                              />
                                              <StatusBadge
                                                status={apt.status}
                                                size="sm"
                                              />
                                            </div>
                                          </motion.div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Private Notes Section */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    ملاحظاتي الخاصة 🔒
                                  </h4>

                                  {/* Add Note Button */}
                                  <motion.button
                                    onClick={() =>
                                      setShowAddNoteForm((prev) => ({
                                        ...prev,
                                        [patient.id]: !prev[patient.id],
                                      }))
                                    }
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mb-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg"
                                  >
                                    <Plus className="w-4 h-4" />
                                    إضافة ملاحظة
                                  </motion.button>

                                  {/* Add Note Form */}
                                  <AnimatePresence>
                                    {showAddNoteForm[patient.id] && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                      >
                                        <textarea
                                          value={newNoteContent}
                                          onChange={(e) =>
                                            setNewNoteContent(e.target.value)
                                          }
                                          placeholder="اكتب ملاحظتك هنا..."
                                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                          rows={3}
                                        />
                                        <div className="flex items-center gap-4 mt-3">
                                          {/* Color Selector */}
                                          <div className="flex gap-2">
                                            {[
                                              "red",
                                              "green",
                                              "blue",
                                              "yellow",
                                            ].map((color) => (
                                              <button
                                                key={color}
                                                onClick={() =>
                                                  setNewNoteColor(color)
                                                }
                                                className={`w-6 h-6 rounded-full border-2 ${
                                                  newNoteColor === color
                                                    ? "ring-2 ring-offset-2 ring-gray-600"
                                                    : ""
                                                } ${pickerColors[color] || pickerColors.default}`}
                                              />
                                            ))}
                                          </div>
                                          {/* Pin Toggle */}
                                          <label className="flex items-center gap-2 text-sm">
                                            <input
                                              type="checkbox"
                                              checked={newNotePinned}
                                              onChange={(e) =>
                                                setNewNotePinned(
                                                  e.target.checked,
                                                )
                                              }
                                              className="rounded"
                                            />
                                            <Pin className="w-4 h-4" />
                                            تثبيت في الأعلى
                                          </label>
                                          {/* Voice Dictation */}
                                          <motion.button
                                            onClick={startVoiceDictation}
                                            disabled={isRecording}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`p-2 rounded-lg ${
                                              isRecording
                                                ? "bg-red-500 text-white"
                                                : "bg-blue-500 text-white hover:bg-blue-600"
                                            }`}
                                          >
                                            <Mic className="w-4 h-4" />
                                          </motion.button>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                          <motion.button
                                            onClick={() =>
                                              handleCreateNote(patient.id)
                                            }
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                                          >
                                            حفظ
                                          </motion.button>
                                          <motion.button
                                            onClick={() =>
                                              setShowAddNoteForm((prev) => ({
                                                ...prev,
                                                [patient.id]: false,
                                              }))
                                            }
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium"
                                          >
                                            إلغاء
                                          </motion.button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Notes List */}
                                  {notesLoading[patient.id] ? (
                                    <div className="flex justify-center py-4">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  ) : privateNotes[patient.id]?.length === 0 ? (
                                    <EmptyState
                                      icon={Lock}
                                      title="لا توجد ملاحظات خاصة"
                                      description="أضف ملاحظاتك الخاصة لهذا المريض."
                                      size="sm"
                                    />
                                  ) : (
                                    <div className="space-y-3">
                                      {privateNotes[patient.id]?.map(
                                        (note, idx) => (
                                          <motion.div
                                            key={note._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-4 rounded-xl border-2 relative group ${
                                              note.isPinned
                                                ? "border-yellow-400 shadow-lg"
                                                : "border-gray-200 dark:border-gray-700"
                                            } ${cardColors[note.color] || cardColors.default}`}
                                          >
                                            {note.isPinned && (
                                              <Pin className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />
                                            )}
                                            <p
                                              className="text-gray-800 dark:text-gray-200 blur-sm cursor-pointer transition-all duration-300 group-hover:blur-none"
                                              onClick={() => {
                                                // Optional: toggle blur on click
                                              }}
                                            >
                                              {note.content}
                                            </p>
                                            <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <span className="text-xs text-gray-500">
                                                {note.createdAt
                                                  ? new Date(
                                                      note.createdAt,
                                                    ).toLocaleDateString(
                                                      "ar-EG",
                                                      {
                                                        calendar: "gregory",
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                      },
                                                    )
                                                  : "-"}
                                              </span>
                                              <div className="flex gap-1">
                                                <motion.button
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  onClick={() =>
                                                    handleUpdateNote(
                                                      patient.id,
                                                      note._id,
                                                      {
                                                        isPinned:
                                                          !note.isPinned,
                                                      },
                                                    )
                                                  }
                                                  className="p-1 text-gray-500 hover:text-yellow-500"
                                                >
                                                  <Pin className="w-3 h-3" />
                                                </motion.button>
                                                <motion.button
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  onClick={() =>
                                                    handleDeleteNote(
                                                      patient.id,
                                                      note._id,
                                                    )
                                                  }
                                                  className="p-1 text-gray-500 hover:text-red-500"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </motion.button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
