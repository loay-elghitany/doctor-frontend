import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { Table } from "../components/ui/DataDisplay";
import { Button, Card, Alert, Spinner, Modal, Input } from "../components/ui";
import { patientService } from "../services/patientService";
import { debugLog, debugError } from "../utils/debug";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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
      setError("Patient name is required");
      return;
    }

    if (!newPatient.email || !newPatient.email.trim()) {
      setError("Patient email is required");
      return;
    }

    if (!newPatient.password || !newPatient.password.trim()) {
      setError("Patient password is required");
      return;
    }

    const clinicSlug = newPatient.clinicSlug || user?.clinicSlug;
    if (!clinicSlug) {
      setError("Clinic information is missing. Please contact support.");
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

      setSuccess("Patient added successfully!");

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
        "Failed to add patient. Please try again.";
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
      render: (_, patient) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {patient?.name ?? "-"}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (_, patient) => (
        <div className="text-gray-600 dark:text-gray-300">
          {patient?.email ?? "-"}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (_, patient) => (
        <div className="text-gray-600 dark:text-gray-300">
          {patient?.phoneNumber ?? "Not provided"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, patient) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/secretary/patients/${patient?._id ?? ""}`)
            }
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="secretary">
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="secretary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Patients
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage patient records
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add Patient
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && <Alert type="success" message={success} className="mb-6" />}
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Patients Table */}
        <Card>
          <Table
            columns={columns}
            data={patients}
            emptyMessage="No patients found"
          />
        </Card>

        {/* Add Patient Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Patient"
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={newPatient.name}
              onChange={(e) =>
                setNewPatient({ ...newPatient, name: e.target.value })
              }
              placeholder="Enter patient's full name"
              required
              disabled={addingPatient}
            />
            <Input
              label="Email"
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
              label="Password"
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
              label="Phone Number"
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
                Cancel
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
