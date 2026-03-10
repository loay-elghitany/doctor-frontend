import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Input, Textarea, Button, Alert, Spinner } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { handleApiError, formatDate } from "../utils/helpers";

/**
 * CreateAppointment - Patient books a new appointment with auto-assigned clinic doctor
 * No doctor selection required - uses patient's assignedDoctorId from registration
 */
export const CreateAppointment = () => {
  const navigate = useNavigate();

  // Form state (no doctorId field - backend assigns automatically)
  const [formData, setFormData] = useState({
    date: "",
    timeSlot: "09:00", // Default time slot
    notes: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.date) {
      setError("Please select a date");
      setLoading(false);
      return;
    }

    if (!formData.timeSlot) {
      setError("Please select a time slot");
      setLoading(false);
      return;
    }

    try {
      // Convert date to ISO string with selected time
      const [dateStr] = formData.date.split("T");
      const [hours, minutes] = formData.timeSlot.split(":");
      const appointmentDate = new Date(`${dateStr}T${hours}:${minutes}:00`);

      if (isNaN(appointmentDate.getTime())) {
        setError("Invalid date or time format");
        setLoading(false);
        return;
      }

      // Call API WITHOUT doctorId - backend will auto-assign from patient's assignedDoctorId
      // Still pass undefined/null for backward compatibility with appointment service
      await appointmentService.createAppointment(
        undefined, // doctorId not provided - backend resolves it
        appointmentDate.toISOString(),
        formData.timeSlot,
        formData.notes,
      );

      setSuccess("Appointment created successfully!");

      // Redirect to patient dashboard after brief delay
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 1500);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg || "Failed to create appointment");
      console.error("Appointment creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout userType="patient">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Book New Appointment
        </h1>

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

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info: Auto-assigned to clinic doctor */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                ℹ️ Your appointment will be automatically scheduled with your
                clinic doctor.
              </p>
            </div>

            {/* Appointment Date */}
            <Input
              label="Appointment Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              disabled={loading}
            />

            {/* Time Slot Selection */}
            <Input
              label="Preferred Time"
              type="select"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="17:00">5:00 PM</option>
            </Input>

            {/* Notes */}
            <Textarea
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes or special requests..."
              disabled={loading}
              rows={4}
            />

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Book Appointment"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => navigate("/patient/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
