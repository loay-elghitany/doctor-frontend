import { useState } from "react";

// Doctor Prescription Form - for creating new prescriptions
export const PrescriptionForm = ({
  appointmentId,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [errors, setErrors] = useState({});

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const validateForm = () => {
    const newErrors = {};

    // At least one medication name required
    if (!medications.some((med) => med.name.trim())) {
      newErrors.medications = "At least one medication is required";
    }

    // Each medication must have name and dosage at minimum
    medications.forEach((med, idx) => {
      if ((med.name || med.dosage || med.frequency) && !med.name) {
        newErrors[`med_${idx}_name`] = "Medication name is required";
      }
      if ((med.name || med.dosage || med.frequency) && !med.dosage) {
        newErrors[`med_${idx}_dosage`] = "Dosage is required";
      }
    });

    if (!diagnosis.trim()) {
      newErrors.diagnosis = "Diagnosis is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty medications
    const activeMedications = medications.filter((med) => med.name.trim());

    onSubmit({
      appointmentId,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      medications: activeMedications,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Diagnosis */}
      <div>
        <label
          htmlFor="diagnosis"
          className="block text-sm font-medium text-gray-700"
        >
          Diagnosis <span className="text-red-500">*</span>
        </label>
        <textarea
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter patient diagnosis"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          rows="3"
        />
        {errors.diagnosis && (
          <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
        )}
      </div>

      {/* Medications */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Medications <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addMedication}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Medication
          </button>
        </div>

        {errors.medications && (
          <p className="mb-2 text-sm text-red-600">{errors.medications}</p>
        )}

        <div className="space-y-3">
          {medications.map((med, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-700">
                  Medication {index + 1}
                </h4>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Medication Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) =>
                      updateMedication(index, "name", e.target.value)
                    }
                    placeholder="e.g., Amoxicillin"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {errors[`med_${index}_name`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`med_${index}_name`]}
                    </p>
                  )}
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, "dosage", e.target.value)
                    }
                    placeholder="e.g., 500mg"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {errors[`med_${index}_dosage`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`med_${index}_dosage`]}
                    </p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) =>
                      updateMedication(index, "frequency", e.target.value)
                    }
                    placeholder="e.g., 3 times daily"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) =>
                      updateMedication(index, "duration", e.target.value)
                    }
                    placeholder="e.g., 7 days"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Instructions */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) =>
                      updateMedication(index, "instructions", e.target.value)
                    }
                    placeholder="e.g., Take with food"
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes or warnings"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          rows="2"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Prescription"}
        </button>
      </div>
    </form>
  );
};

// Doctor Prescription View - Read/Edit view with delete option
export const DoctorPrescriptionView = ({
  prescription,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(prescription._id);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Diagnosis */}
      <div>
        <label className="text-sm font-medium text-gray-700">Diagnosis</label>
        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
          {prescription.diagnosis}
        </p>
      </div>

      {/* Medications */}
      <div>
        <label className="text-sm font-medium text-gray-700">Medications</label>
        <div className="mt-2 space-y-3">
          {prescription.medications?.length > 0 ? (
            prescription.medications.map((med, index) => (
              <div
                key={index}
                className="bg-blue-50 p-3 rounded-md border border-blue-200"
              >
                <p className="font-medium text-gray-900">{med.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Dosage:</span> {med.dosage}
                  </p>
                  {med.frequency && (
                    <p>
                      <span className="font-medium">Frequency:</span>{" "}
                      {med.frequency}
                    </p>
                  )}
                  {med.duration && (
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {med.duration}
                    </p>
                  )}
                  {med.instructions && (
                    <p className="col-span-2">
                      <span className="font-medium">Instructions:</span>{" "}
                      {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No medications prescribed</p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      {prescription.notes && (
        <div>
          <label className="text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <p className="text-gray-900 mt-1 whitespace-pre-wrap">
            {prescription.notes}
          </p>
        </div>
      )}

      {/* Created Date */}
      <div>
        <label className="text-sm font-medium text-gray-700">Created</label>
        <p className="text-gray-900 mt-1">
          {new Date(prescription.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onDelete && (
          <>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary bg-red-100 text-red-700 hover:bg-red-200"
              >
                Delete Prescription
              </button>
            ) : (
              <>
                <p className="text-sm text-red-600 font-medium self-center">
                  Confirm delete?
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isLoading}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Patient Prescription View - Read-only view
export const PatientPrescriptionView = ({ prescription }) => {
  return (
    <div className="space-y-4">
      {/* Diagnosis */}
      <div>
        <label className="text-sm font-medium text-gray-700">Diagnosis</label>
        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
          {prescription.diagnosis}
        </p>
      </div>

      {/* Medications */}
      <div>
        <label className="text-sm font-medium text-gray-700">Medications</label>
        <div className="mt-2 space-y-3">
          {prescription.medications?.length > 0 ? (
            prescription.medications.map((med, index) => (
              <div
                key={index}
                className="bg-green-50 p-3 rounded-md border border-green-200"
              >
                <p className="font-medium text-gray-900">{med.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Dosage:</span> {med.dosage}
                  </p>
                  {med.frequency && (
                    <p>
                      <span className="font-medium">Frequency:</span>{" "}
                      {med.frequency}
                    </p>
                  )}
                  {med.duration && (
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {med.duration}
                    </p>
                  )}
                  {med.instructions && (
                    <p className="col-span-2">
                      <span className="font-medium">Instructions:</span>{" "}
                      {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No medications prescribed</p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      {prescription.notes && (
        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <p className="text-gray-900 mt-1 whitespace-pre-wrap">
            {prescription.notes}
          </p>
        </div>
      )}

      {/* Created Date */}
      <div>
        <label className="text-sm font-medium text-gray-700">Issued Date</label>
        <p className="text-gray-900 mt-1">
          {new Date(prescription.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
