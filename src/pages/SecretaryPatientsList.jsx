import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  QuickActionButton,
} from "../components/ui";
import { Button, Alert, Modal, Input } from "../components/ui";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  User,
  ArrowRight,
  Calendar,
  Copy,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";

/**
 * SecretaryPatientsList - Display and manage patients for secretary's doctor
 */
export const SecretaryPatientsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    phoneNumber: "",
  });
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);
  const [copiedCredentialsStatus, setCopiedCredentialsStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterType, setFilterType] = useState("all");

  const fetchPatients = async (pageNumber = 1, search = "") => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryPatientsList", "Fetching secretary patients", {
        page: pageNumber,
        search,
      });
      const response = await api.get(
        `/patients?page=${pageNumber}&limit=20&search=${encodeURIComponent(search)}`,
      );
      const patientsList = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      const pagination = response?.data?.pagination || {};
      debugLog("SecretaryPatientsList", "Patients fetched", {
        count: patientsList.length,
        pagination,
      });
      setPatients(patientsList);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || 0);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch patients";
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError("SecretaryPatientsList", "Failed to fetch patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(page, searchTerm);
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle adding new patient
  const handleAddPatient = async () => {
    // Validation
    if (!newPatient.name || !newPatient.name.trim()) {
      setError("اسم المريض مطلوب");
      return;
    }

    if (!newPatient.phoneNumber || !newPatient.phoneNumber.trim()) {
      setError("رقم الهاتف مطلوب");
      return;
    }

    setAddingPatient(true);
    setError("");
    setSuccess("");

    try {
      debugLog("SecretaryPatientsList", "Creating new patient", {
        name: newPatient.name,
        phoneNumber: newPatient.phoneNumber,
      });

      const currentToken = localStorage.getItem("token");
      console.log("SecretaryPatientsList - token before POST", currentToken);

      // Create patient using the secretary-specific endpoint
      const response = await api.post("/secretaries/patients", {
        name: newPatient.name.trim(),
        phoneNumber: newPatient.phoneNumber.trim() || "",
      });

      console.log("Patient created successfully:", response.data);

      const createdPatient = response.data?.data;
      debugLog("SecretaryPatientsList", "Patient created successfully", {
        patientId: createdPatient?._id,
        name: createdPatient?.name,
      });

      // Update patients list immediately with the newly created patient
      if (createdPatient) {
        setPatients((prevPatients) => [...prevPatients, createdPatient]);
        setCreatedCredentialsModal({
          name: createdPatient.name,
          phoneNumber: createdPatient.phoneNumber,
        });
      }

      setSuccess(t("add_patient_success"));

      // Reset form and close modal
      setNewPatient({
        name: "",
        phoneNumber: "",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Add patient error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "فشل إضافة المريض. يرجى المحاولة مرة أخرى.";
      setError(errorMsg);
      debugError("SecretaryPatientsList", "Failed to add patient", err);
    } finally {
      setAddingPatient(false);
    }
  };

  const copyCreatedCredentials = async () => {
    if (!createdCredentialsModal) return;
    const phone = createdCredentialsModal.phoneNumber || "";
    const email = `${phone}@mydoc90.local`;
    const password = `Pt@${phone}`;
    const text = `اسم المريض: ${createdCredentialsModal.name}\nالبريد الإلكتروني: ${email}\nكلمة المرور الافتراضية: ${password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCredentialsStatus("تم النسخ إلى الحافظة");
      setTimeout(() => setCopiedCredentialsStatus(""), 3000);
    } catch (e) {
      setCopiedCredentialsStatus("فشل النسخ");
      setTimeout(() => setCopiedCredentialsStatus(""), 3000);
    }
  };

  // Table columns
  const columns = [
    {
      key: "name",
      header: "Name",
      render: (patient, value) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {patient?.name ?? "-"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (patient, value) => (
        <div className="text-gray-600 dark:text-gray-300">
          {patient?.email ?? "-"}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (patient, value) => (
        <div className="text-gray-600 dark:text-gray-300">
          {patient?.phoneNumber ?? "Not provided"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (patient, value) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/secretary/patients/${patient?._id ?? ""}`)
            }
          >
            عرض التفاصيل
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <div className="flex justify-center items-center min-h-96"></div>
      </MainLayout>
    );
  }

  // Calculate stats
  const stats = {
    total: totalItems || patients.length,
    withPhone: patients.filter((p) => p.phoneNumber).length,
  };

  const statCards = [
    {
      title: "إجمالي المرضى",
      value: stats.total,
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "مع رقم هاتف",
      value: stats.withPhone,
      icon: Phone,
      gradient: "from-emerald-500 to-green-400",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: "أضف المريض",
      onClick: () => setShowAddModal(true),
    },
    {
      icon: Calendar,
      label: "المواعيد",
      onClick: () => navigate("/secretary/appointments"),
    },
  ];

  return (
    <MainLayout userType="secretary">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="relative overflow-hidden" gradient>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-300/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400 mb-3 font-semibold"
                  >
                    دليل المرضى
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                  >
                    المرضى
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-lg text-gray-600 dark:text-gray-300"
                  >
                    إدارة سجلات المرضى ومعلومات الاتصال.
                  </motion.p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <BentoGridItem key={card.title} delay={index * 0.1}>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {card.value}
                    </motion.div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.title}
                    </p>
                  </div>
                </div>
              </BentoGridItem>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <PremiumSearch
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="ابحث عن مريض بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                className="w-full"
              />
            </div>

            <div className="md:col-span-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-sm"
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
            يتم عرض{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {patients.length}
            </span>{" "}
            من أصل{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {totalItems}
            </span>{" "}
            مرضى
          </p>
        </GlassCard>

        {/* Patients List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message={t("loading_patients")} />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("no_patients")}
            description={t("add_patient")}
            actionLabel={t("add_patient")}
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {patients.map((patient, index) => (
                <motion.div
                  key={patient._id || patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Patient Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white font-semibold text-lg">
                          {(patient.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {patient.name || "Unknown"}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                              <Mail className="w-4 h-4" />
                              {patient.email}
                            </span>
                            {patient.phoneNumber && (
                              <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                <Phone className="w-4 h-4" />
                                {patient.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          navigate(
                            `/secretary/patients/${patient._id || patient.id}`,
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
                      >
                        عرض التفاصيل
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              الصفحة {page} من {totalPages}
            </p>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}

        {/* Add Patient Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="أضف مريض جديد"
        >
          <div className="space-y-4">
            <Input
              label="الاسم الكامل"
              value={newPatient.name}
              onChange={(e) =>
                setNewPatient({ ...newPatient, name: e.target.value })
              }
              placeholder={t(
                "pages_SecretaryPatientsList.attr_placeholder_enter_patient_s_full_name",
              )}
              required
              disabled={addingPatient}
            />

            <Input
              label="رقم الهاتف"
              value={newPatient.phoneNumber}
              onChange={(e) =>
                setNewPatient({ ...newPatient, phoneNumber: e.target.value })
              }
              placeholder={t(
                "pages_SecretaryPatientsList.attr_placeholder_enter_patient_s_phon",
              )}
              disabled={addingPatient}
            />

            {error && <Alert type="error" message={error} />}
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                disabled={addingPatient}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleAddPatient}
                disabled={addingPatient}
              >
                {addingPatient ? "Adding..." : t("add_patient")}
              </Button>
            </div>
          </div>
        </Modal>
        {/* Created credentials bottom modal */}
        {createdCredentialsModal && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      تم تسجيل المريض بنجاح! إليك بيانات تسجيل الدخول الخاصة
                      بالبوابة:
                    </div>
                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500">
                              البريد الإلكتروني
                            </div>
                            <div className="font-mono mt-1 text-sm text-gray-900 dark:text-white">
                              {createdCredentialsModal.phoneNumber}
                              @mydoc90.local
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs text-gray-500">
                            كلمة المرور الافتراضية
                          </div>
                          <div className="font-mono mt-1 text-sm text-gray-900 dark:text-white">
                            Pt@{createdCredentialsModal.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="primary"
                        onClick={copyCreatedCredentials}
                      >
                        <Copy className="w-4 h-4 mr-2" /> نسخ بيانات الدخول
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setCreatedCredentialsModal(null)}
                      >
                        <X className="w-4 h-4 mr-2" /> إغلاق
                      </Button>
                      {copiedCredentialsStatus && (
                        <div className="text-sm text-green-600 dark:text-green-300">
                          {copiedCredentialsStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
