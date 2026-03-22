import React, { useState } from "react";
import { Spinner, Alert } from "./ui";
import { communicationService } from "../services/communicationService";
import { handleApiError } from "../utils/helpers";

const WhatsAppButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWhatsAppClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await communicationService.getWhatsAppLinkForDoctor();
      const { whatsappLink } = res.data.data;
      window.open(whatsappLink, "_blank");
    } catch (err) {
      setError(handleApiError(err) || "Failed to open WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Contact Your Doctor</h3>
      <div className="space-y-2">
        <button
          onClick={handleWhatsAppClick}
          disabled={loading}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner size="sm" /> : "💬"}
          {loading ? "Opening WhatsApp..." : "Message Doctor via WhatsApp"}
        </button>
        {error && <Alert type="danger" message={error} />}
      </div>
    </div>
  );
};

export default WhatsAppButton;
