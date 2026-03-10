import React, { useState, useEffect } from "react";
import { Spinner, Alert } from "./ui";
import { medicalFileService } from "../services/medicalFileService";
import { handleApiError } from "../utils/helpers";

export const PatientMedicalFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await medicalFileService.getMyFiles();
      setFiles(res.data?.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return setError("Please choose a file to upload.");
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("title", title);
      form.append("notes", notes);

      await medicalFileService.uploadMedicalFile(form);
      setTitle("");
      setNotes("");
      setSelectedFile(null);
      fetchFiles();
    } catch (err) {
      setError(handleApiError(err) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this file? This will be a soft-delete.");
    if (!ok) return;
    setDeletingId(id);
    try {
      await medicalFileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      setError(handleApiError(err) || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  // Download file with Authorization header (includes token in fetch, avoids blank page)
  const handleDownload = async (file) => {
    try {
      // Extract storedName: use storedName field if available, otherwise from fileUrl
      const storedName = file.storedName || file.fileUrl.split("/").pop();
      await medicalFileService.downloadFile(storedName, file.fileName);
    } catch (err) {
      setError(handleApiError(err) || "Failed to download file");
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Upload Medical Files</h3>

      <div className="space-y-2 mb-4">
        <input type="file" onChange={onFileChange} />
        <input
          type="text"
          placeholder="Optional title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <textarea
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <div>
          <button
            onClick={handleUpload}
            className="btn-primary bg-blue-600 text-white px-4 py-2 rounded"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-4">
          <Spinner size="sm" />
        </div>
      ) : error ? (
        <Alert type="danger" message={error} />
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f._id}
              className="p-3 bg-gray-50 rounded flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{f.title || f.fileName}</p>
                <p className="text-sm text-gray-600">
                  {new Date(f.uploadedAt).toLocaleString()} ·{" "}
                  {f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(f)}
                  className="text-blue-600 hover:underline"
                >
                  {f.fileType === "image" ? "Preview" : "Download"}
                </button>
                <button
                  onClick={() => handleDelete(f._id)}
                  className="text-red-600"
                  disabled={deletingId === f._id}
                >
                  {deletingId === f._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientMedicalFiles;
