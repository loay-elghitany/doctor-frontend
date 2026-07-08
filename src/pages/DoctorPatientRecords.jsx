import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
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
import {
  getPrivateFiles,
  createPrivateFile,
  deletePrivateFile,
} from "../services/doctorPrivateFilesService";
import { uploadFileToCloudinary } from "../utils/cloudinaryStorage";
import WhatsAppButtonForDoctor from "../components/WhatsAppButtonForDoctor";
import {
  Users,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  History,
  Filter,
  ArrowRight,
  Clock,
  FileText,
  Lock,
  Plus,
  Mic,
  Pin,
  X,
  Trash2,
} from "lucide-react";

export const DoctorPatientRecords = () => {
  const { t } = useTranslation();
  const { patientId } = useParams();
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
  const [privateFiles, setPrivateFiles] = useState({});
  const [filesLoading, setFilesLoading] = useState({});
  const [showAddFileForm, setShowAddFileForm] = useState({});
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("image");
  const [newFileNotes, setNewFileNotes] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingSeconds, setAudioRecordingSeconds] = useState(0);
  const [, setRecordedAudioBlob] = useState(null);
  const addNoteTextareaRef = useRef(null);
  const audioMediaRecorder = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const [isUploadingFile, setIsUploadingFile] = useState({});
  const [filePreviewModal, setFilePreviewModal] = useState({
    isOpen: false,
    file: null,
  });

  const closeFilePreviewModal = () => {
    setFilePreviewModal({ isOpen: false, file: null });
  };

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
        const response = await api.get("/doctors/patients?limit=1000&page=1");

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

  useEffect(() => {
    if (!patientId || !patients.length) return;

    const targetPatient = patients.find(
      (patient) =>
        patient?._id === patientId ||
        patient?.id === patientId ||
        patient?.patientId === patientId,
    );

    if (targetPatient) {
      const targetPatientId = targetPatient._id || targetPatient.id;
      handleExpandPatient(targetPatientId, { autoOpenInput: true });
    }
  }, [patientId, patients]);

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
  const handleExpandPatient = async (patientId, options = {}) => {
    const { autoOpenInput = false } = options;

    if (expandedPatientId === patientId) {
      if (autoOpenInput) {
        setShowAddNoteForm((prev) => ({ ...prev, [patientId]: true }));
        setShowAddFileForm((prev) => ({ ...prev, [patientId]: true }));
        setTimeout(() => {
          addNoteTextareaRef.current?.focus();
        }, 120);
      }
      return;
    }

    await Promise.all([
      fetchPatientAppointments(patientId),
      fetchPrivateNotes(patientId),
      fetchPrivateFiles(patientId),
    ]);
    setExpandedPatientId(patientId);

    if (autoOpenInput) {
      setShowAddNoteForm((prev) => ({ ...prev, [patientId]: true }));
      setShowAddFileForm((prev) => ({ ...prev, [patientId]: true }));
      setTimeout(() => {
        addNoteTextareaRef.current?.focus();
      }, 180);
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

  // Fetch private files for a patient
  const fetchPrivateFiles = async (patientId) => {
    setFilesLoading((prev) => ({
      ...prev,
      [patientId]: true,
    }));

    try {
      const response = await getPrivateFiles(patientId);
      const files = response?.data || [];

      setPrivateFiles((prev) => ({
        ...prev,
        [patientId]: files,
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to fetch private files", err);
      setPrivateFiles((prev) => ({
        ...prev,
        [patientId]: [],
      }));
    } finally {
      setFilesLoading((prev) => ({
        ...prev,
        [patientId]: false,
      }));
    }
  };

  // Handle creating a new private file
  const handleCreateFile = async (patientId) => {
    const fileToUpload = selectedUploadFile || null;
    if (!newFileName.trim()) {
      alert("الرجاء إدخال اسم الملف قبل الرفع.");
      return;
    }

    if (!fileToUpload) {
      alert("الرجاء اختيار ملف أو تسجيل صوتي قبل الرفع.");
      return;
    }

    try {
      setIsUploadingFile((prev) => ({ ...prev, [patientId]: true }));

      // Upload file to Cloudinary
      const fileUrl = await uploadFileToCloudinary(fileToUpload, newFileType);

      // Create file record in database
      const response = await createPrivateFile(patientId, {
        title: newFileName,
        fileUrl,
        fileType: newFileType,
        notes: newFileNotes,
      });

      const newFile = response?.data;
      setPrivateFiles((prev) => ({
        ...prev,
        [patientId]: [newFile, ...prev[patientId]],
      }));

      // Reset form
      setNewFileName("");
      setNewFileType("image");
      setNewFileNotes("");
      setSelectedUploadFile(null);
      setRecordedAudioBlob(null);
      setAudioRecordingSeconds(0);
      setShowAddFileForm((prev) => ({ ...prev, [patientId]: false }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to create file", err);
    } finally {
      setIsUploadingFile((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const handleSelectUploadFile = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setSelectedUploadFile(file);
    setRecordedAudioBlob(null);
  };

  useEffect(() => {
    if (
      audioMediaRecorder.current &&
      audioMediaRecorder.current.state !== "inactive"
    ) {
      audioMediaRecorder.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    setSelectedUploadFile(null);
    setRecordedAudioBlob(null);
    setAudioRecordingSeconds(0);
  }, [newFileType]);

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("التسجيل الصوتي غير مدعوم في متصفحك.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      audioMediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedAudioBlob(audioBlob);
        setSelectedUploadFile(
          new File([audioBlob], "voice-note.mp3", { type: "audio/mp3" }),
        );
        setIsRecordingAudio(false);
        setAudioRecordingSeconds(0);
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecordingAudio(true);
      setAudioRecordingSeconds(0);
    } catch (err) {
      debugError(
        "DoctorPatientRecords",
        "Failed to start audio recording",
        err,
      );
      alert("فشل بدء التسجيل الصوتي. تأكد من منح الأذن للوصول إلى الميكروفون.");
    }
  };

  const stopAudioRecording = () => {
    if (
      audioMediaRecorder.current &&
      audioMediaRecorder.current.state !== "inactive"
    ) {
      audioMediaRecorder.current.stop();
    }
  };

  useEffect(() => {
    if (!isRecordingAudio) return undefined;

    const interval = setInterval(() => {
      setAudioRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  // Handle deleting a file
  const handleDeleteFile = async (patientId, fileId) => {
    try {
      await deletePrivateFile(fileId, patientId);

      // If the deleted file is currently open in the preview modal, close it to avoid stale state
      if (filePreviewModal?.file && filePreviewModal.file._id === fileId) {
        setFilePreviewModal({ isOpen: false, file: null });
      }

      setPrivateFiles((prev) => ({
        ...prev,
        [patientId]: prev[patientId].filter((file) => file._id !== fileId),
      }));
    } catch (err) {
      debugError("DoctorPatientRecords", "Failed to delete file", err);
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
                    placeholder={t(
                      "pages_DoctorPatientRecords.attr_placeholder_search_by_name_email_or_phone",
                    )}
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
                      <option
                        value={t("pages_DoctorPatientRecords.attr_value_all")}
                      >
                        جميع المرضى
                      </option>
                      <option
                        value={t(
                          "pages_DoctorPatientRecords.attr_value_upcoming",
                        )}
                      >
                        مع مواعيد قادمة
                      </option>
                      <option
                        value={t("pages_DoctorPatientRecords.attr_value_past")}
                      >
                        مع مواعيد سابقة
                      </option>
                      <option
                        value={t(
                          "pages_DoctorPatientRecords.attr_value_cancelled",
                        )}
                      >
                        مع مواعيد ملغاة
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                {t("pages_DoctorPatientRecords.text_showing")}{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {filteredPatients.length}
                </span>{" "}
                {t("pages_DoctorPatientRecords.text_of")}{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {patients.length}
                </span>{" "}
                {t("pages_DoctorPatientRecords.text_patients")}
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
                                    {t("pages_DoctorPatientRecords.text_last")}{" "}
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
                                      title={t(
                                        "pages_DoctorPatientRecords.attr_title_no_appointments",
                                      )}
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
                                          ref={addNoteTextareaRef}
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
                                                } ${
                                                  pickerColors[color] ||
                                                  pickerColors.default
                                                }`}
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
                                            } ${
                                              cardColors[note.color] ||
                                              cardColors.default
                                            }`}
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

                                {/* Private Medical Files Section */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    🔒 الملفات الطبية الخاصة المرفوعة
                                  </h4>

                                  {/* Add File Button */}
                                  <motion.button
                                    onClick={() =>
                                      setShowAddFileForm((prev) => ({
                                        ...prev,
                                        [patient.id]: !prev[patient.id],
                                      }))
                                    }
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg"
                                  >
                                    <Plus className="w-4 h-4" />
                                    رفع ملف طبي
                                  </motion.button>

                                  {/* Add File Form */}
                                  <AnimatePresence>
                                    {showAddFileForm[patient.id] && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-5 bg-gray-800/50 border border-gray-700/50 dark:border-gray-600/50 rounded-2xl backdrop-blur-sm"
                                      >
                                        {/* File Name Input */}
                                        <input
                                          type="text"
                                          value={newFileName}
                                          onChange={(e) =>
                                            setNewFileName(e.target.value)
                                          }
                                          placeholder="اسم الملف (مثال: أشعة رنين)"
                                          className="w-full mb-4 p-3 border border-gray-600 dark:border-gray-500 rounded-lg bg-gray-700/50 dark:bg-gray-900/50 text-gray-100 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition"
                                        />

                                        {/* File Type Dropdown */}
                                        <select
                                          value={newFileType}
                                          onChange={(e) =>
                                            setNewFileType(e.target.value)
                                          }
                                          className="w-full mb-4 p-3 border border-gray-600 dark:border-gray-500 rounded-lg bg-gray-700/50 dark:bg-gray-900/50 text-gray-100 dark:text-white focus:outline-none focus:border-blue-500/50 transition"
                                        >
                                          <option
                                            value={t(
                                              "pages_DoctorPatientRecords.attr_value_image",
                                            )}
                                          >
                                            أشعة / صورة
                                          </option>
                                          <option
                                            value={t(
                                              "pages_DoctorPatientRecords.attr_value_pdf",
                                            )}
                                          >
                                            {t(
                                              "pages_DoctorPatientRecords.text_pdf",
                                            )}
                                          </option>
                                          <option
                                            value={t(
                                              "pages_DoctorPatientRecords.attr_value_audio",
                                            )}
                                          >
                                            تسجيل صوتي
                                          </option>
                                          <option
                                            value={t(
                                              "pages_DoctorPatientRecords.attr_value_other",
                                            )}
                                          >
                                            أخرى
                                          </option>
                                        </select>

                                        {/* File Notes */}
                                        <textarea
                                          value={newFileNotes}
                                          onChange={(e) =>
                                            setNewFileNotes(e.target.value)
                                          }
                                          placeholder="ملاحظات اختيارية..."
                                          className="w-full mb-4 p-3 border border-gray-600 dark:border-gray-500 rounded-lg bg-gray-700/50 dark:bg-gray-900/50 text-gray-100 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition resize-none"
                                          rows={2}
                                        />

                                        {/* File Input and Upload Buttons */}
                                        <input
                                          type="file"
                                          id={`file-input-${patient.id}`}
                                          onChange={handleSelectUploadFile}
                                          className="hidden"
                                          accept={
                                            newFileType === "image"
                                              ? "image/*"
                                              : newFileType === "pdf"
                                                ? ".pdf"
                                                : newFileType === "audio"
                                                  ? "audio/*"
                                                  : "*"
                                          }
                                        />

                                        <div className="flex flex-wrap gap-3 mb-4">
                                          <motion.label
                                            htmlFor={`file-input-${patient.id}`}
                                            whileHover={{
                                              scale: 1.05,
                                              backgroundColor:
                                                "rgba(59, 130, 246, 0.1)",
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-4 py-2 border border-blue-500/50 dark:border-blue-400/60 bg-transparent hover:bg-blue-500/10 text-blue-300 dark:text-blue-200 rounded-full text-sm font-medium text-center cursor-pointer transition-all duration-200 flex-shrink-0"
                                          >
                                            {selectedUploadFile
                                              ? selectedUploadFile.name
                                              : "📁 اختر الملف"}
                                          </motion.label>

                                          {newFileType === "audio" &&
                                            !isRecordingAudio && (
                                              <motion.button
                                                onClick={startAudioRecording}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                type="button"
                                                className="px-4 py-2 border border-green-500/50 dark:border-green-400/60 bg-transparent hover:bg-green-500/10 text-green-300 dark:text-green-200 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                              >
                                                <Mic className="w-4 h-4" />
                                                تسجيل صوتي
                                              </motion.button>
                                            )}

                                          {isRecordingAudio && (
                                            <motion.button
                                              onClick={stopAudioRecording}
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              type="button"
                                              className="px-4 py-2 border border-red-500/50 dark:border-red-400/60 bg-red-500/10 text-red-300 dark:text-red-200 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                            >
                                              <span className="inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                                              إيقاف ({audioRecordingSeconds}
                                              {t(
                                                "pages_DoctorPatientRecords.text_s",
                                              )}
                                            </motion.button>
                                          )}
                                        </div>

                                        {selectedUploadFile && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200"
                                          >
                                            ✓ جاهز للرفع:{" "}
                                            {selectedUploadFile.name}
                                          </motion.div>
                                        )}

                                        <div className="flex flex-wrap gap-3">
                                          <motion.button
                                            onClick={() =>
                                              handleCreateFile(patient.id)
                                            }
                                            whileHover={{
                                              scale: 1.02,
                                              boxShadow:
                                                "0 0 20px rgba(99, 102, 241, 0.5)",
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={
                                              isUploadingFile[patient.id] ||
                                              !selectedUploadFile
                                            }
                                            className="flex-1 min-w-[120px] px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {isUploadingFile[patient.id]
                                              ? "جاري الرفع..."
                                              : "🚀 رفع الملف"}
                                          </motion.button>

                                          <motion.button
                                            onClick={() =>
                                              setShowAddFileForm((prev) => ({
                                                ...prev,
                                                [patient.id]: false,
                                              }))
                                            }
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            className="px-6 py-2 border border-gray-500/50 dark:border-gray-400/50 bg-transparent hover:bg-gray-500/10 text-gray-300 dark:text-gray-200 rounded-lg text-sm font-medium transition-all duration-200"
                                          >
                                            إلغاء
                                          </motion.button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Files List */}
                                  {filesLoading[patient.id] ? (
                                    <div className="flex justify-center py-4">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  ) : privateFiles[patient.id]?.length === 0 ? (
                                    <EmptyState
                                      icon={FileText}
                                      title="لا توجد ملفات طبية"
                                      description="رفع ملفات طبية آمنة وخاصة لهذا المريض."
                                      size="sm"
                                    />
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {privateFiles[patient.id]?.map(
                                        (file, idx) => (
                                          <motion.div
                                            key={file._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative group p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all"
                                          >
                                            {file.fileType === "image" && (
                                              <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                onClick={() =>
                                                  setFilePreviewModal({
                                                    isOpen: true,
                                                    file,
                                                  })
                                                }
                                                className="mb-3 w-full h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer"
                                              >
                                                <img
                                                  src={file.fileUrl}
                                                  alt={file.title}
                                                  className="w-full h-full object-cover"
                                                />
                                              </motion.div>
                                            )}

                                            {file.fileType === "audio" && (
                                              <div className="mb-3">
                                                <audio
                                                  controls
                                                  className="w-full"
                                                >
                                                  <source src={file.fileUrl} />
                                                  {t(
                                                    "pages_DoctorPatientRecords.text_your_browser_does_not_support_the_audio_",
                                                  )}
                                                </audio>
                                              </div>
                                            )}

                                            {file.fileType === "pdf" && (
                                              <div className="mb-3 flex items-center justify-center h-32 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <div className="text-center">
                                                  <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                                  <a
                                                    href={file.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                                  >
                                                    {t(
                                                      "pages_DoctorPatientRecords.text_pdf_1",
                                                    )}
                                                  </a>
                                                </div>
                                              </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                  {file.title}
                                                </p>
                                                {file.notes && (
                                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {file.notes}
                                                  </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                  {file.createdAt
                                                    ? new Date(
                                                        file.createdAt,
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
                                              </div>
                                              <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() =>
                                                  handleDeleteFile(
                                                    patient.id,
                                                    file._id,
                                                  )
                                                }
                                                className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </motion.button>
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
      {/* Image Preview Modal */}
      <AnimatePresence>
        {filePreviewModal.isOpen && filePreviewModal.file && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFilePreviewModal}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 overflow-visible"
            >
              {/* Top Premium Navbar */}
              <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-950/95 border-b border-slate-800 text-white">
                <div className="max-w-[85%]">
                  <h3 className="text-base font-semibold">
                    معاينة مستند الأشعة: {filePreviewModal.file.title}
                  </h3>
                  {filePreviewModal.file.notes && (
                    <p className="text-sm text-slate-300 mt-1">
                      {filePreviewModal.file.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilePreviewModal({ isOpen: false, file: null });
                  }}
                  className="relative z-[99999] p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 border border-slate-700/60 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
                  aria-label={t(
                    "pages_DoctorPatientRecords.attr_aria_label_close_preview",
                  )}
                >
                  <X className="w-5 h-5 pointer-events-none" />
                </button>
              </div>

              {/* Unlimited Fullscreen Canvas Workspace */}
              <div className="absolute inset-0 flex items-center justify-center overflow-visible p-6">
                <div className="relative max-h-full max-w-full overflow-visible">
                  <Zoom>
                    <img
                      src={filePreviewModal.file.fileUrl}
                      alt={filePreviewModal.file.title}
                      className="w-full h-auto max-h-[calc(100vh-140px)] object-contain rounded-3xl shadow-2xl select-none"
                    />
                  </Zoom>
                </div>
              </div>

              {/* Footer Tip Indicator */}
              <div className="absolute bottom-6 left-6 z-20 rounded-2xl bg-slate-950/90 border border-slate-800 p-3 text-sm text-slate-200 shadow-lg">
                💡 انقر على الصورة مباشرة للتكبير الاحترافي وحرك الماوس بحرية
                تامة للتصفح
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};
