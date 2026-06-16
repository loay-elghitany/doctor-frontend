import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import {
  Button,
  Alert,
  Modal,
  Card,
  Input,
  Spinner,
  Badge,
} from "../components/ui";
import { Table } from "../components/ui/DataDisplay";
import { createAdminService } from "../services/adminService";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { handleApiError } from "../utils/helpers";
import { formatDateSafe } from "../utils/date/formatDateSafe";
import { debugLog, debugError } from "../utils/debug";

/**
 * AdminDashboard - Doctor account management for admins
 * Admin can:
 * - Create new doctor accounts
 * - View all active and inactive doctors
 * - Deactivate/reactivate accounts
 * - Delete doctor accounts (permanent)
 */
export const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { adminToken, isAdminAuthenticated, logout } =
    useContext(AdminAuthContext);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAdminAuthenticated, navigate]);

  // Create admin service with token
  const adminService = createAdminService(adminToken);

  // State management
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Create doctor modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createData, setCreateData] = useState({
    name: "",
    email: "",
    clinicSlug: "",
    password: "",
    phoneNumber: "",
  });
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Action modals
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'deactivate', 'reactivate', 'delete'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState("");

  // Tabs
  const tabs = [
    { id: "all", label: "كافة الأطباء" },
    { id: "active", label: "نشط" },
    { id: "inactive", label: "غير نشط" },
  ];

  // Fetch doctors on mount
  // FIX: Corrected response structure - response is the full API response object
  // API returns: { success, message, data: { total, active, inactive, doctors } }
  // NOT: { data: { data: { doctors } } }
  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      debugLog("AdminDashboard", "Fetching all doctors");
      const response = await adminService.getAllDoctors();

      // response.data is the axios body object { success, message, data }
      const doctorsList = response?.data?.data?.doctors || [];
      debugLog("AdminDashboard", "Doctors fetched", {
        count: doctorsList.length,
        total: response?.data?.data?.total,
        active: response?.data?.data?.active,
        inactive: response?.data?.data?.inactive,
      });
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("AdminDashboard", "Failed to fetch doctors", err);
      setError(errorMsg || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors by tab
  const filteredDoctors =
    activeTab === "all"
      ? doctors
      : activeTab === "active"
        ? doctors.filter((d) => Boolean(d.isActive))
        : doctors.filter((d) => !d.isActive);

  // Handle create doctor form submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError("");

    if (!createData.name || !createData.email) {
      setError("Name and email are required");
      setCreateLoading(false);
      return;
    }

    // Optional E.164 phone validation (only if provided)
    if (createData.phoneNumber) {
      const e164Regex = /^\+?[1-9]\d{1,14}$/;
      if (!e164Regex.test(createData.phoneNumber)) {
        setError("Phone number must be in E.164 format (e.g. +201234567890)");
        setCreateLoading(false);
        return;
      }
    }

    try {
      debugLog("AdminDashboard", "Creating new doctor", {
        email: createData.email,
      });

      const response = await adminService.createDoctor(
        createData.name,
        createData.email,
        createData.clinicSlug || undefined,
        createData.password || undefined,
        createData.phoneNumber || undefined,
      );

      const newDoctor = response.data?.data;
      debugLog("AdminDashboard", "Doctor created successfully", {
        doctorId: newDoctor?.id,
      });

      // Store generated password to display to admin
      if (newDoctor?.generatedPassword) {
        setGeneratedPassword(newDoctor.generatedPassword);
      }

      setSuccess(
        `Doctor "${createData.name}" created successfully. ${newDoctor?.generatedPassword ? `Generated Password: ${newDoctor.generatedPassword}` : ""}`,
      );

      // Refresh doctor list
      await fetchDoctors();

      // Reset form
      setCreateData({
        name: "",
        email: "",
        clinicSlug: "",
        password: "",
        phoneNumber: "",
      });
      setGeneratedPassword("");
      setShowCreateModal(false);

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("AdminDashboard", "Failed to create doctor", err);
      setError(errorMsg || "Failed to create doctor");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open action confirmation modal
  const confirmAction = (type, doctor) => {
    setActionType(type);
    setSelectedDoctor(doctor);
    setShowActionModal(true);
    setActionReason("");
  };

  // Handle action (deactivate, reactivate, delete)
  const handleAction = async () => {
    if (!selectedDoctor) return;

    setActionLoading(true);
    setError("");

    try {
      let response;

      if (actionType === "deactivate") {
        debugLog("AdminDashboard", "Deactivating doctor", {
          doctorId: selectedDoctor._id,
        });
        response = await adminService.deactivateDoctor(
          selectedDoctor._id,
          actionReason,
        );
        setSuccess(`Doctor "${selectedDoctor.name}" deactivated successfully`);
      } else if (actionType === "reactivate") {
        debugLog("AdminDashboard", "Reactivating doctor", {
          doctorId: selectedDoctor._id,
        });
        response = await adminService.reactivateDoctor(selectedDoctor._id);
        setSuccess(`Doctor "${selectedDoctor.name}" reactivated successfully`);
      } else if (actionType === "delete") {
        debugLog("AdminDashboard", "Permanently deleting doctor", {
          doctorId: selectedDoctor._id,
        });
        response = await adminService.deleteDoctorPermanent(
          selectedDoctor._id,
          true,
        );
        setSuccess(`Doctor "${selectedDoctor.name}" deleted permanently`);
      }

      // Refresh doctor list
      await fetchDoctors();
      setShowActionModal(false);
      setSelectedDoctor(null);
      setActionType(null);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("AdminDashboard", `Failed to ${actionType} doctor`, err);
      setError(errorMsg || `Failed to ${actionType} doctor`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format subscription dates safely
  const formatDate = (dateStr) => formatDateSafe(dateStr);

  // Doctor table columns
  const columns = [
    { key: "name", label: "Doctor Name" },
    { key: "email", label: "Email" },
    { key: "clinicSlug", label: "Clinic Slug" },
    {
      key: "isActive",
      label: "Status",
      render: (row, _val) => {
        const isActive = Boolean(row?.isActive);

        return (
          <Badge variant={isActive ? "success" : "warning"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "subscriptionStartedAt",
      label: "Started",
      render: (_row, val) => formatDate(val),
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="admin">
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("pages_AdminDashboard.text_manual_subscription_management")}
          </h1>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              {t("pages_AdminDashboard.text_create_doctor_account")}
            </Button>
            <Button variant="secondary" onClick={logout} disabled={loading}>
              {t("pages_AdminDashboard.text_logout")}
            </Button>
          </div>
        </div>

        {error && (
          <Alert type="danger" message={error} onClose={() => setError("")} />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {doctors.length}
              </div>
              <p className="text-gray-600 mt-2">
                {t("pages_AdminDashboard.text_total_doctors")}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {doctors.filter((d) => d.isActive).length}
              </div>
              <p className="text-gray-600 mt-2">
                {t("pages_AdminDashboard.text_active_subscriptions")}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {doctors.filter((d) => !d.isActive).length}
              </div>
              <p className="text-gray-600 mt-2">
                {t("pages_AdminDashboard.text_inactive_subscriptions")}
              </p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Table */}
        <Card>
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {t(
                  "pages_AdminDashboard.text_no_doctors_found_in_this_category",
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("pages_AdminDashboard.text_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => {
                    console.log("Doctor Row:", doctor);
                    return (
                      <tr
                        key={doctor._id}
                        className="border-b hover:bg-gray-50"
                      >
                        {columns.map((col) => (
                          <td
                            key={`${doctor._id}-${col.key}`}
                            className="px-6 py-3 text-sm text-gray-900"
                          >
                            {col.render
                              ? col.render(doctor, doctor[col.key])
                              : doctor[col.key]}
                          </td>
                        ))}
                        <td className="px-6 py-3 text-sm">
                          <div className="flex gap-2">
                            {doctor.isActive ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  confirmAction("deactivate", doctor)
                                }
                              >
                                {t("pages_AdminDashboard.text_pause")}
                              </Button>
                            ) : (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() =>
                                  confirmAction("reactivate", doctor)
                                }
                              >
                                {t("pages_AdminDashboard.text_activate")}
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => confirmAction("delete", doctor)}
                            >
                              {t("pages_AdminDashboard.text_delete")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Doctor Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateData({
            name: "",
            email: "",
            clinicSlug: "",
            password: "",
            phoneNumber: "",
          });
          setGeneratedPassword("");
        }}
        title={t("pages_AdminDashboard.attr_title_create_new_doctor_account")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setCreateData({
                  name: "",
                  email: "",
                  clinicSlug: "",
                  password: "",
                  phoneNumber: "",
                });
              }}
            >
              {t("pages_AdminDashboard.text_cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Account"}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label={t("pages_AdminDashboard.attr_label_doctor_name")}
            type="text"
            name="name"
            value={createData.name}
            onChange={(e) =>
              setCreateData({ ...createData, name: e.target.value })
            }
            placeholder={t(
              "pages_AdminDashboard.attr_placeholder_dr_john_smith",
            )}
            disabled={createLoading}
            required
          />

          <Input
            label={t("pages_AdminDashboard.attr_label_email")}
            type="email"
            name="email"
            value={createData.email}
            onChange={(e) =>
              setCreateData({ ...createData, email: e.target.value })
            }
            placeholder={t(
              "pages_AdminDashboard.attr_placeholder_doctor_clinic_com",
            )}
            disabled={createLoading}
            required
          />

          <Input
            label={t("pages_AdminDashboard.attr_label_phone_optional")}
            type="tel"
            name="phoneNumber"
            value={createData.phoneNumber}
            onChange={(e) =>
              setCreateData({ ...createData, phoneNumber: e.target.value })
            }
            placeholder={t(
              "pages_AdminDashboard.attr_placeholder_201234567890_e_164",
            )}
            disabled={createLoading}
          />

          <p className="text-sm text-gray-500 -mt-2 mb-2">
            {t(
              "pages_AdminDashboard.text_optional_use_e_164_format_like_201234567",
            )}
          </p>

          <Input
            label={t("pages_AdminDashboard.attr_label_clinic_slug_optional")}
            type="text"
            name="clinicSlug"
            value={createData.clinicSlug}
            onChange={(e) =>
              setCreateData({ ...createData, clinicSlug: e.target.value })
            }
            placeholder="smith-clinic (auto-generated if left empty)"
            disabled={createLoading}
          />

          <Input
            label={t("pages_AdminDashboard.attr_label_password_optional")}
            type="password"
            name="password"
            value={createData.password}
            onChange={(e) =>
              setCreateData({ ...createData, password: e.target.value })
            }
            placeholder={t(
              "pages_AdminDashboard.attr_placeholder_leave_empty_to_auto_generate",
            )}
            disabled={createLoading}
          />

          {generatedPassword && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>
                {t("pages_AdminDashboard.text_generated_password")}
              </strong>{" "}
              {generatedPassword}
              <p className="mt-2 text-xs text-blue-700">
                {t(
                  "pages_AdminDashboard.text_share_this_securely_with_the_doctor",
                )}
              </p>
            </div>
          )}
        </form>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedDoctor(null);
          setActionType(null);
        }}
        title={
          actionType === "deactivate"
            ? "Deactivate Doctor Account?"
            : actionType === "reactivate"
              ? "Reactivate Doctor Account?"
              : "Delete Doctor Account?"
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowActionModal(false)}
            >
              {t("pages_AdminDashboard.text_cancel_1")}
            </Button>
            <Button
              variant={actionType === "delete" ? "danger" : "primary"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading
                ? "Processing..."
                : actionType === "deactivate"
                  ? "Deactivate"
                  : actionType === "reactivate"
                    ? "Reactivate"
                    : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionType === "deactivate" && (
            <>
              <p>
                {t(
                  "pages_AdminDashboard.text_are_you_sure_you_want_to_deactivate",
                )}{" "}
                <strong>{selectedDoctor?.name}</strong>
                {t("pages_AdminDashboard.text_s_account")}
              </p>
              <p className="text-sm text-gray-600">
                {t(
                  "pages_AdminDashboard.text_the_doctor_will_not_be_able_to_create_ne",
                )}
              </p>
              <Input
                label={t("pages_AdminDashboard.attr_label_reason_optional")}
                type="textarea"
                name="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={t(
                  "pages_AdminDashboard.attr_placeholder_e_g_account_hold_etc",
                )}
                rows={3}
              />
            </>
          )}

          {actionType === "reactivate" && (
            <>
              <p>
                {t(
                  "pages_AdminDashboard.text_are_you_sure_you_want_to_reactivate",
                )}{" "}
                <strong>{selectedDoctor?.name}</strong>
                {t("pages_AdminDashboard.text_s_account_1")}
              </p>
              <p className="text-sm text-gray-600">
                {t(
                  "pages_AdminDashboard.text_the_doctor_will_be_able_to_create_new_ap",
                )}
              </p>
            </>
          )}

          {actionType === "delete" && (
            <>
              <p>
                {t(
                  "pages_AdminDashboard.text_are_you_sure_you_want_to_permanently_del",
                )}{" "}
                <strong>{selectedDoctor?.name}</strong>
                {t("pages_AdminDashboard.text_s_account_2")}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                {t(
                  "pages_AdminDashboard.text_warning_this_action_cannot_be_undone_the",
                )}
              </p>
            </>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
};
