import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Input, Button, Card, Alert } from "../components/ui";
import { appointmentService } from "../services/appointmentService";
import { handleApiError } from "../utils/helpers";
import { debugLog, debugError } from "../utils/debug";

/**
 * ProposeAppointmentTimes - Doctor proposes 3 alternative time slots for rescheduling
 * Sends rescheduleOptions to backend in format: [{ date: Date, timeSlot: "HH:MM" }, ...]
 */
export const ProposeAppointmentTimes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state: array of 3 options, each with date and timeSlot
  const [options, setOptions] = useState([
    { date: "", timeSlot: "09:00" },
    { date: "", timeSlot: "10:00" },
    { date: "", timeSlot: "11:00" },
  ]);

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate all options are filled
    if (options.some((opt) => !opt.date || !opt.timeSlot)) {
      setError("Please provide all dates and times for 3 options");
      setLoading(false);
      return;
    }

    try {
      debugLog("ProposeAppointmentTimes", "Proposing times", {
        appointmentId: id,
        optionCount: options.length,
      });

      // Convert to backend format: rescheduleOptions array
      const rescheduleOptions = options.map((opt) => ({
        date: new Date(opt.date).toISOString(),
        timeSlot: opt.timeSlot,
      }));

      await appointmentService.proposeRescheduleTimes(id, rescheduleOptions);

      setSuccess("Alternative times proposed successfully!");
      debugLog("ProposeAppointmentTimes", "Times proposed successfully");

      // Redirect back to appointments list after brief delay
      setTimeout(() => {
        navigate("/doctor/appointments");
      }, 1500);
    } catch (err) {
      const errorMsg = handleApiError(err);
      debugError("ProposeAppointmentTimes", "Failed to propose times", err);
      setError(errorMsg || "Failed to propose times");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout userType="doctor">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Propose New Appointment Times
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

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 mb-4">
              Provide exactly 3 date and time options for the patient to choose
              from.
            </p>

            {options.map((option, index) => (
              <div key={index} className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Option {index + 1}
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Date"
                    type="date"
                    value={option.date}
                    onChange={(e) =>
                      handleOptionChange(index, "date", e.target.value)
                    }
                    required
                    disabled={loading}
                  />
                  <Input
                    label="Time Slot"
                    type="select"
                    value={option.timeSlot}
                    onChange={(e) =>
                      handleOptionChange(index, "timeSlot", e.target.value)
                    }
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
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Proposing..." : "Propose Times"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => navigate("/doctor/appointments")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};
