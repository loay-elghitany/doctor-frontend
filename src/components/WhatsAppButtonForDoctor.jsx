import React, { useState } from "react";
import { Spinner, Alert } from "./ui";
import { communicationService } from "../services/communicationService";
import { handleApiError } from "../utils/helpers";

const WhatsAppButtonForDoctor = ({ patientId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWhatsAppClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res =
        await communicationService.getWhatsAppLinkForPatient(patientId);
      const { whatsappLink } = res.data.data;
      window.open(whatsappLink, "_blank");
    } catch (err) {
      setError(handleApiError(err) || "Failed to open WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleWhatsAppClick}
        disabled={loading}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? <Spinner size="sm" /> : "💬"}
        {loading ? "Opening..." : "WhatsApp"}
      </button>
      {error && <Alert type="danger" message={error} />}
    </div>
  );
};

export default WhatsAppButtonForDoctor;
