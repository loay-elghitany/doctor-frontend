import { useState, useEffect } from "react";
import {
  PrescriptionForm,
  DoctorPrescriptionView,
  PatientPrescriptionView,
} from "./PrescriptionForm";
import * as prescriptionService from "../../services/prescriptionService";

// Prescription Manager Modal - Used in appointment details
export const PrescriptionModal = ({
  appointmentId,
  userRole,
  onClose,
  onSuccess,
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load prescriptions on mount
  useEffect(() => {
    loadPrescriptions();
  }, [appointmentId, userRole]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prescriptionService.getAppointmentPrescriptions(
        appointmentId,
        userRole,
      );
      setPrescriptions(data.data || []);
    } catch (err) {
      console.error("Error loading prescriptions:", err);
      setError("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (prescriptionData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await prescriptionService.createPrescription(prescriptionData);
      setShowForm(false);
      setSelectedPrescription(null);
      setSuccessMessage("✓ Prescription created successfully!");
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadPrescriptions();
      onSuccess?.();
    } catch (err) {
      console.error("Error creating prescription:", err);
      setError(
        err.message || "Failed to create prescription. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    try {
      setSubmitting(true);
      setError(null);
      await prescriptionService.deletePrescription(prescriptionId);
      setSelectedPrescription(null);
      await loadPrescriptions();
      onSuccess?.();
    } catch (err) {
      console.error("Error deleting prescription:", err);
      setError(
        err.message || "Failed to delete prescription. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-content space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedPrescription
            ? "Prescription Details"
            : showForm
              ? "Create New Prescription"
              : "Prescriptions"}
        </h3>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {/* Loading State */}
      {loading && !selectedPrescription && !showForm && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading prescriptions...</p>
        </div>
      )}

      {/* Main Content */}
      {!selectedPrescription && !showForm && !loading && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500 mb-4">
                {userRole === "doctor"
                  ? "No prescriptions created for this appointment yet"
                  : "No prescriptions available"}
              </p>
              {userRole === "doctor" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary text-sm"
                >
                  Create Prescription
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {prescriptions.length} prescription
                  {prescriptions.length !== 1 ? "s" : ""}
                </p>
                {userRole === "doctor" && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary text-sm"
                  >
                    + Add Prescription
                  </button>
                )}
              </div>

              {prescriptions.map((prescription, index) => (
                <div
                  key={prescription._id}
                  className="bg-gray-50 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Prescription {index + 1}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {prescription.diagnosis.substring(0, 100)}
                        {prescription.diagnosis.length > 100 ? "..." : ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {prescription.medications?.length || 0} medication
                        {prescription.medications?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescription Form */}
      {showForm && !selectedPrescription && (
        <PrescriptionForm
          appointmentId={appointmentId}
          onSubmit={handleCreatePrescription}
          onCancel={() => setShowForm(false)}
          isLoading={submitting}
        />
      )}

      {/* Prescription Details - Doctor View */}
      {selectedPrescription && userRole === "doctor" && (
        <DoctorPrescriptionView
          prescription={selectedPrescription}
          onDelete={handleDeletePrescription}
          isLoading={submitting}
        />
      )}

      {/* Prescription Details - Patient View */}
      {selectedPrescription && userRole === "patient" && (
        <PatientPrescriptionView prescription={selectedPrescription} />
      )}

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        {selectedPrescription && (
          <button
            onClick={() => setSelectedPrescription(null)}
            className="btn-secondary"
          >
            Back
          </button>
        )}
        {!showForm && (
          <button onClick={onClose} className="btn-secondary">
            {selectedPrescription ? "Close" : "Done"}
          </button>
        )}
      </div>
    </div>
  );
};

// Prescription Badge for appointment cards
export const PrescriptionBadge = ({ appointmentId, userRole }) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const data = await prescriptionService.getAppointmentPrescriptions(
          appointmentId,
          userRole,
        );
        setCount(data.prescriptions?.length || 0);
      } catch (err) {
        console.error("Error loading prescription count:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCount();
  }, [appointmentId, userRole]);

  if (loading || count === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      📋 {count} Rx
    </span>
  );
};
