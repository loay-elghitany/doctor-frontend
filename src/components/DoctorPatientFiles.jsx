import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "./ui";
import { medicalFileService } from "../services/medicalFileService";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../utils/helpers";

export const DoctorPatientFiles = ({ patientId, appointmentId, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const role = user?.role;

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (appointmentId) {
        res = await medicalFileService.getAppointmentFiles(appointmentId);
      } else {
        res = await medicalFileService.getPatientFiles(patientId);
      }
      setFiles(res.data?.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [patientId, appointmentId]);

  const handleDownload = async (file) => {
    try {
      const storedName = file.storedName;
      if (!storedName) {
        throw new Error("File name not available");
      }
      await medicalFileService.downloadMedicalFile(storedName, role);
    } catch (err) {
      setError(handleApiError(err) || "Failed to download file");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Patient Files</h3>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert type="danger" message={error} />
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-500">No files available.</p>
      ) : (
        <div className="space-y-3">
          {files.map((f) => (
            <div
              key={f._id}
              className="p-3 bg-white border rounded flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{f.title || f.fileName}</p>
                <p className="text-sm text-gray-600">
                  {new Date(f.uploadedAt).toLocaleString()} ·{" "}
                  {f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {f.storedName ? (
                  <button
                    onClick={() => handleDownload(f)}
                    className="text-blue-600 hover:underline"
                  >
                    View / Download
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPatientFiles;
