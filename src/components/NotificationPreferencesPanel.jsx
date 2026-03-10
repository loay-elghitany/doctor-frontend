import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Smartphone,
  Mail,
  Clock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
} from "lucide-react";

/**
 * Notification Preferences Component
 * Features: Per-type opt-in/out, quiet hours, SMS fallback, GDPR opt-out
 */
const NotificationPreferencesPanel = () => {
  // Notification types
  const NOTIFICATION_TYPES = [
    { id: "appointment_created", label: "Appointment Created" },
    { id: "appointment_confirmed", label: "Appointment Confirmed" },
    { id: "appointment_cancelled", label: "Appointment Cancelled" },
    { id: "appointment_proposed", label: "Appointment Proposed" },
    { id: "prescription_created", label: "Prescription Created" },
  ];

  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    whatsappEnabled: true,
    whatsappQuietHoursEnabled: false,
    whatsappQuietHoursStart: "22:00",
    whatsappQuietHoursEnd: "08:00",
    whatsappTypes: {},
    smsEnabled: false,
    smsPhoneNumber: "",
    smsFallbackOnly: false,
    smsTypes: {},
    emailEnabled: true,
    emailTypes: {},
    muteAll: false,
    gdprOptOut: false,
  });

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notification-preferences`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch preferences");

      const result = await response.json();

      if (result.success) {
        const prefs = result.data;
        setPreferences(prefs);
        setFormData({
          whatsappEnabled: prefs.whatsapp?.enabled ?? true,
          whatsappQuietHoursEnabled: prefs.whatsapp?.quietHoursEnabled ?? false,
          whatsappQuietHoursStart: prefs.whatsapp?.quietHoursStart ?? "22:00",
          whatsappQuietHoursEnd: prefs.whatsapp?.quietHoursEnd ?? "08:00",
          whatsappTypes: prefs.whatsapp?.types ?? {},
          smsEnabled: prefs.sms?.enabled ?? false,
          smsPhoneNumber: prefs.sms?.phoneNumber ?? "",
          smsFallbackOnly: prefs.sms?.fallbackOnly ?? false,
          smsTypes: prefs.sms?.types ?? {},
          emailEnabled: prefs.email?.enabled ?? true,
          emailTypes: prefs.email?.types ?? {},
          muteAll: prefs.muteAll ?? false,
          gdprOptOut: prefs.gdprOptOut ?? false,
        });
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        whatsapp: {
          enabled: formData.whatsappEnabled,
          quietHoursEnabled: formData.whatsappQuietHoursEnabled,
          quietHoursStart: formData.whatsappQuietHoursStart,
          quietHoursEnd: formData.whatsappQuietHoursEnd,
          types: formData.whatsappTypes,
        },
        sms: {
          enabled: formData.smsEnabled,
          phoneNumber: formData.smsPhoneNumber,
          fallbackOnly: formData.smsFallbackOnly,
          types: formData.smsTypes,
        },
        email: {
          enabled: formData.emailEnabled,
          types: formData.emailTypes,
        },
        muteAll: formData.muteAll,
        gdprOptOut: formData.gdprOptOut,
      };

      const response = await fetch(`/api/notification-preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      const result = await response.json();

      if (result.success) {
        setSuccessMessage("Preferences saved successfully!");
        await fetchPreferences();

        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error saving preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle notification type
  const toggleNotificationType = async (channel, type) => {
    try {
      const response = await fetch(`/api/notification-preferences/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          notificationType: type,
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle notification type");

      const result = await response.json();

      if (result.success) {
        await fetchPreferences();
      }
    } catch (err) {
      console.error("Error toggling notification type:", err);
      setError(err.message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle type toggles
  const handleTypeToggle = (channel, type) => {
    setFormData((prev) => ({
      ...prev,
      [`${channel}Types`]: {
        ...prev[`${channel}Types`],
        [type]: !prev[`${channel}Types`][type],
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Notification Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Control how and when you receive notifications
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

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-green-800">Success</p>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Global Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Global Settings
          </h2>

          <div className="space-y-4">
            {/* Mute All */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">
                  Mute All Notifications
                </p>
                <p className="text-sm text-gray-600">
                  Temporarily disable all notifications
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, muteAll: !prev.muteAll }))
                }
                className="focus:outline-none"
              >
                {formData.muteAll ? (
                  <ToggleRight className="text-blue-600" size={32} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={32} />
                )}
              </button>
            </div>

            {/* GDPR Opt-Out */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">GDPR Opt-Out</p>
                <p className="text-sm text-gray-600">
                  Opt out of all data processing and notifications (permanent)
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    gdprOptOut: !prev.gdprOptOut,
                  }))
                }
                className="focus:outline-none"
              >
                {formData.gdprOptOut ? (
                  <ToggleRight className="text-red-600" size={32} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={32} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-green-500" size={24} />
            <h2 className="text-lg font-bold text-gray-800">WhatsApp</h2>
          </div>

          <div className="space-y-4">
            {/* Enable WhatsApp */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Enable WhatsApp</p>
                <p className="text-sm text-gray-600">
                  Receive notifications via WhatsApp
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    whatsappEnabled: !prev.whatsappEnabled,
                  }))
                }
                className="focus:outline-none"
              >
                {formData.whatsappEnabled ? (
                  <ToggleRight className="text-blue-600" size={32} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={32} />
                )}
              </button>
            </div>

            {formData.whatsappEnabled && (
              <>
                {/* Quiet Hours */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-gray-600" />
                    <p className="font-medium text-gray-800">Quiet Hours</p>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="whatsappQuietHours"
                      name="whatsappQuietHoursEnabled"
                      checked={formData.whatsappQuietHoursEnabled}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="whatsappQuietHours"
                      className="text-gray-700"
                    >
                      Enable quiet hours
                    </label>
                  </div>

                  {formData.whatsappQuietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time (24hr)
                        </label>
                        <input
                          type="time"
                          name="whatsappQuietHoursStart"
                          value={formData.whatsappQuietHoursStart}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time (24hr)
                        </label>
                        <input
                          type="time"
                          name="whatsappQuietHoursEnd"
                          value={formData.whatsappQuietHoursEnd}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notification Types */}
                <div className="border-t pt-4">
                  <p className="font-medium text-gray-800 mb-3">
                    Notification Types
                  </p>
                  <div className="space-y-2">
                    {NOTIFICATION_TYPES.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <label
                          htmlFor={`whatsapp-${type.id}`}
                          className="text-gray-700"
                        >
                          {type.label}
                        </label>
                        <input
                          type="checkbox"
                          id={`whatsapp-${type.id}`}
                          checked={formData.whatsappTypes[type.id] ?? true}
                          onChange={() => handleTypeToggle("whatsapp", type.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SMS Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="text-blue-500" size={24} />
            <h2 className="text-lg font-bold text-gray-800">SMS</h2>
          </div>

          <div className="space-y-4">
            {/* Enable SMS */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Enable SMS</p>
                <p className="text-sm text-gray-600">
                  Receive notifications via SMS
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    smsEnabled: !prev.smsEnabled,
                  }))
                }
                className="focus:outline-none"
              >
                {formData.smsEnabled ? (
                  <ToggleRight className="text-blue-600" size={32} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={32} />
                )}
              </button>
            </div>

            {formData.smsEnabled && (
              <>
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="smsPhoneNumber"
                    value={formData.smsPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Include country code (e.g., +1 for USA)
                  </p>
                </div>

                {/* SMS Fallback Only */}
                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="smsFallbackOnly"
                    name="smsFallbackOnly"
                    checked={formData.smsFallbackOnly}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="smsFallbackOnly" className="text-gray-700">
                    Use SMS as fallback only when WhatsApp fails
                  </label>
                </div>

                {/* Notification Types */}
                <div>
                  <p className="font-medium text-gray-800 mb-3">
                    Notification Types
                  </p>
                  <div className="space-y-2">
                    {NOTIFICATION_TYPES.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <label
                          htmlFor={`sms-${type.id}`}
                          className="text-gray-700"
                        >
                          {type.label}
                        </label>
                        <input
                          type="checkbox"
                          id={`sms-${type.id}`}
                          checked={formData.smsTypes[type.id] ?? false}
                          onChange={() => handleTypeToggle("sms", type.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Email</h2>
          </div>

          <div className="space-y-4">
            {/* Enable Email */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Enable Email</p>
                <p className="text-sm text-gray-600">
                  Receive notifications via Email
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    emailEnabled: !prev.emailEnabled,
                  }))
                }
                className="focus:outline-none"
              >
                {formData.emailEnabled ? (
                  <ToggleRight className="text-blue-600" size={32} />
                ) : (
                  <ToggleLeft className="text-gray-400" size={32} />
                )}
              </button>
            </div>

            {formData.emailEnabled && (
              <div>
                <p className="font-medium text-gray-800 mb-3">
                  Notification Types
                </p>
                <div className="space-y-2">
                  {NOTIFICATION_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                    >
                      <label
                        htmlFor={`email-${type.id}`}
                        className="text-gray-700"
                      >
                        {type.label}
                      </label>
                      <input
                        type="checkbox"
                        id={`email-${type.id}`}
                        checked={formData.emailTypes[type.id] ?? true}
                        onChange={() => handleTypeToggle("email", type.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader className="animate-spin" size={20} />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesPanel;
