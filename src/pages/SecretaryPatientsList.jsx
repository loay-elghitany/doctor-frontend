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
} from "lucide-react";

/**
 * SecretaryPatientsList - Display and manage patients for secretary's doctor
 */
export const SecretaryPatientsList = () => {
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
    email: "",
    phoneNumber: "",
    password: "",
    clinicSlug: user?.clinicSlug || "",
  });

  // Fetch secretary patients on mount
  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("SecretaryPatientsList", "Fetching secretary patients");
      const response = await patientService.getPatients();
      console.log("FULL RESPONSE:", response);
      console.log("FULL PATIENTS RESPONSE:", response?.data);
      const patientsList = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      console.log("EXTRACTED PATIENTS ARRAY:", patientsList);
      debugLog("SecretaryPatientsList", "Patients fetched", {
        count: patientsList.length,
      });
      setPatients(patientsList);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch patients";
      // Don't set error for 401s as they trigger logout automatically
      if (err.response?.status !== 401) {
        setError(errorMsg);
      }
      debugError("SecretaryPatientsList", "Failed to fetch patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

    if (!newPatient.email || !newPatient.email.trim()) {
      setError("بريد المريض الإلكتروني مطلوب");
      return;
    }

    if (!newPatient.password || !newPatient.password.trim()) {
      setError("كلمة مرور المريض مطلوبة");
      return;
    }

    const clinicSlug = newPatient.clinicSlug || user?.clinicSlug;
    if (!clinicSlug) {
      setError("معلومات العيادة مفقودة. يرجى التواصل مع الدعم.");
      return;
    }

    setAddingPatient(true);
    setError("");
    setSuccess("");

    try {
      debugLog("SecretaryPatientsList", "Creating new patient", {
        name: newPatient.name,
        email: newPatient.email,
        clinicSlug,
      });

      const currentToken = localStorage.getItem("token");
      console.log("SecretaryPatientsList - token before POST", currentToken);

      // Create patient using the secretary-specific endpoint
      const response = await api.post("/secretaries/patients", {
        name: newPatient.name.trim(),
        email: newPatient.email.trim(),
        phoneNumber: newPatient.phoneNumber.trim() || "",
        password: newPatient.password,
        clinicSlug,
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
      }

      setSuccess("تم إضافة المريض بنجاح!");

      // Reset form and close modal
      setNewPatient({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
        clinicSlug: user?.clinicSlug || "",
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
    total: patients.length,
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

        {/* Patients List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading patients..." />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="أضف المريض الأول لبدء العمل."
            actionLabel="Add Patient"
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
              placeholder="Enter patient's full name"
              required
              disabled={addingPatient}
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={newPatient.email}
              onChange={(e) =>
                setNewPatient({ ...newPatient, email: e.target.value })
              }
              placeholder="Enter patient's email"
              required
              disabled={addingPatient}
            />
            <Input
              label="كلمة المرور"
              type="password"
              value={newPatient.password}
              onChange={(e) =>
                setNewPatient({ ...newPatient, password: e.target.value })
              }
              placeholder="Set a password for the patient"
              required
              disabled={addingPatient}
            />
            <Input
              label="رقم الهاتف"
              value={newPatient.phoneNumber}
              onChange={(e) =>
                setNewPatient({ ...newPatient, phoneNumber: e.target.value })
              }
              placeholder="Enter patient's phone number (optional)"
              disabled={addingPatient}
            />
            <Input
              label="Clinic Slug"
              value={newPatient.clinicSlug}
              onChange={(e) =>
                setNewPatient({ ...newPatient, clinicSlug: e.target.value })
              }
              placeholder="Clinic identifier"
              disabled={addingPatient}
              readOnly={!newPatient.clinicSlug && user?.clinicSlug}
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
                {addingPatient ? "Adding..." : "Add Patient"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};
