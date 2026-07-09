import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import {
  processVoicePrescription,
  getDrugAlternatives,
} from "../../services/prescriptionService.js";

// Doctor Prescription Form - for creating new prescriptions
export const PrescriptionForm = ({
  appointmentId,
  onSubmit,
  onCancel,
  isLoading,
  patientName = "المريض",
  doctorName = "الدكتور",
  patientPhone = "",
  clinicName = "العيادة الطبية",
  doctorSpecialization = "التخصص الطبي",
}) => {
  const { t } = useTranslation();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [errors, setErrors] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [medicationAlternatives, setMedicationAlternatives] = useState({});
  const [alternativeLoading, setAlternativeLoading] = useState({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successPrescriptionContext, setSuccessPrescriptionContext] =
    useState(null);

  const formatPrescriptionDate = (value = new Date()) => {
    try {
      return new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(
        value,
      );
    } catch {
      return new Date(value).toLocaleDateString("ar-EG");
    }
  };

  const normalizePhoneNumber = (value = "") => {
    const digits = String(value || "")
      .replace(/[^\d+]/g, "")
      .trim();
    return digits.startsWith("+") ? digits : digits.replace(/^0+/, "20");
  };

  const buildWhatsAppText = (data) => {
    const dateLabel =
      data?.prescriptionDate || formatPrescriptionDate(new Date());
    const patient = data?.patientName || patientName || "المريض";
    const doctor = data?.doctorName || doctorName || "الدكتور";
    const clinic = data?.clinicName || clinicName || "العيادة الطبية";

    return `مرحباً ${patient}، نتمنى لك دوام الصحة والعافية. ${clinic} تعلن عن إصدار روشتة طبية جديدة بتاريخ ${dateLabel} من قبل ${doctor}. يرجى مراجعة التعليمات الطبية والالتزام بها.`;
  };

  const handlePrintPrescription = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window === "undefined") return;

    const phone = normalizePhoneNumber(
      successPrescriptionContext?.patientPhone || patientPhone || "",
    );
    const encodedText = encodeURIComponent(
      buildWhatsAppText(successPrescriptionContext),
    );
    const shareUrl = phone
      ? `https://wa.me/${phone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const recognitionRef = useRef(null);
  // 🌟 مرجع لتجميع النص تراكمياً بدون إرسال مبكر
  const accumulatedTranscriptRef = useRef("");

  const canUseSpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // 1️⃣ الدالة الأولى: معالجة النص وإرساله للباك إند (مكتوبة فوق عشان المتصفح يشوفها)
  // 1️⃣ الدالة الأولى: معالجة النص وإرساله للباك إند
  const handleVoiceTranscript = async (transcript) => {
    setVoiceError("");

    if (!transcript || !transcript.trim()) {
      setVoiceError("لم يتم التعرف على أي نص صوتي.");
      setIsListening(false);
      return;
    }

    try {
      setIsListening(false);
      setIsProcessingVoice(true);

      const response = await processVoicePrescription({
        rawText: transcript.trim(),
        existingDiagnosis: diagnosis,
        existingMedications: medications,
        existingNotes: notes,
      });
      const payload = response?.data || response;

      setDiagnosis(String(payload?.diagnosis || ""));
      setNotes(String(payload?.notes || ""));
      const extractedMedications = Array.isArray(payload?.medications)
        ? payload.medications.map((med) => ({
            name: med.name || "",
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            duration: med.duration || "",
            instructions: med.instructions || "",
          }))
        : [];

      setMedications(
        extractedMedications.length > 0
          ? extractedMedications
          : [
              {
                name: "",
                dosage: "",
                frequency: "",
                duration: "",
                instructions: "",
              },
            ],
      );
    } catch (error) {
      console.error("Voice prescription failed", error);
      setVoiceError("فشل معالجة الصوت. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsListening(false);
      setIsProcessingVoice(false);
      recognitionRef.current = null;
    }
  };

  // 2️⃣ الدالة الثانية: إيقاف الوصفة الصوتية يدوياً وبأمان
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      let finalTranscript = accumulatedTranscriptRef.current.trim();

      // 🌟 الإنقاذ السحري: لو المجمع فاضي بسبب لاق السيرفر، اسحب المقذوف المؤقت الأخير فوراً!
      if (!finalTranscript && window.lastInterimResult) {
        finalTranscript = window.lastInterimResult.trim();
        window.lastInterimResult = ""; // تصفير المخزن بعد الإنقاذ
      }

      // فك الارتباط بالـ Listeners تماماً لمنع التداخل وحماية الداتا
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;

      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Recognition already stopped; safely ignore.
      }

      recognitionRef.current = null;
      setIsListening(false);
      accumulatedTranscriptRef.current = ""; // تصفير بعد التجميع بأمان

      if (finalTranscript) {
        handleVoiceTranscript(finalTranscript);
      } else {
        setVoiceError("لم يتم تجميع أي نص صوتي، يرجى المحاولة مرة أخرى.");
      }
    }
  };

  // 3️⃣ الدالة الثالثة: تشغيل المايك والوضع التراكمي المستمر الحقيقي
  const startVoiceRecognition = () => {
    if (!canUseSpeechRecognition) {
      setVoiceError("ميزة التعرف على الكلام غير مدعومة في متصفحك.");
      return;
    }

    setVoiceError("");
    accumulatedTranscriptRef.current = ""; // تصفير آمن للبداية الجديدة

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "ar-EG";
    // Capture interim results locally; do NOT call backend here
    recognition.interimResults = true;
    recognition.continuous = true; // استماع مستمر

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        setVoiceError(`حدث خطأ في المايك: ${event.error}`);
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      try {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const piece =
            result[0] && result[0].transcript ? result[0].transcript : "";

          if (result.isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        // نحدث المرجع بصفة مستمرة باللي جاز بالكامل
        if (finalTranscript) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            " " +
            finalTranscript
          ).trim();
        }

        // سحر الـ Production: لو الدكتور وقف فجأة، نكون مأمنين النص المؤقت برضه في المرجع كخيار احتياطي
        if (interimTranscript) {
          // بنحفظه مؤقتاً عشان لو دالة الـ stop اتدعت حالا تلاقيه
          window.lastInterimResult = interimTranscript;
        }
      } catch (e) {
        console.warn("onresult handling error:", e);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
    }
  };

  const handleFetchAlternatives = async (index) => {
    const medName = String(medications[index]?.name || "").trim();
    if (!medName) {
      setMedicationAlternatives((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    if (alternativeLoading[index]) return;

    try {
      setAlternativeLoading((prev) => ({ ...prev, [index]: true }));
      setVoiceError("");

      const response = await getDrugAlternatives(medName);
      const result = response?.data || response;
      const alternatives = Array.isArray(result?.alternatives)
        ? result.alternatives.filter(Boolean).slice(0, 3)
        : [];

      setMedicationAlternatives((prev) => ({ ...prev, [index]: alternatives }));
    } catch (error) {
      console.error("Drug alternatives failed", error);
      setVoiceError("فشل جلب البدائل الذكية. يرجى المحاولة مرة أخرى.");
      setMedicationAlternatives((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setAlternativeLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const selectAlternative = (index, alternative) => {
    updateMedication(index, "name", alternative);
    setMedicationAlternatives((prev) => ({ ...prev, [index]: [] }));
  };

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

    if (!medications.some((med) => med.name.trim())) {
      newErrors.medications = "At least one medication is required";
    }

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const activeMedications = medications.filter((med) => med.name.trim());
    const finalPayload = {
      appointmentId,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      medications: activeMedications,
    };

    try {
      if (typeof onSubmit === "function") {
        await onSubmit(finalPayload);
      }

      setSuccessPrescriptionContext({
        ...finalPayload,
        patientName,
        doctorName,
        patientPhone,
        clinicName,
        doctorSpecialization,
        prescriptionDate: formatPrescriptionDate(new Date()),
      });
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Prescription submission failed", error);
    }
  };

  const PrintablePrescription = ({ prescriptionData }) => (
    <div className="hidden print:block" dir="rtl">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print {
          /* Force-hide interactive or duplicate UI during printing */
          .no-print, [data-testid="doctor-view"], [data-testid="patient-view"] {
            display: none !important;
          }

          /* Ensure only the printable prescription shell is visible and fits a single page */
          body * { visibility: hidden !important; }
          .printable-prescription-shell, .printable-prescription-shell * {
            visibility: visible !important;
            display: block !important;
          }

          .printable-prescription-shell {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 190mm !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 16mm !important;
            background: white !important;
            color: #111827 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Hide form controls inside printable shell */
          .printable-prescription-shell button,
          .printable-prescription-shell input,
          .printable-prescription-shell textarea {
            display: none !important;
          }
        }
      `}</style>
      <div className="printable-prescription-shell rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Medical Prescription
              </p>
              <h3 className="text-xl font-semibold text-slate-900">
                {prescriptionData?.clinicName || clinicName || "العيادة الطبية"}
              </h3>
              <p className="text-sm text-slate-600">
                {prescriptionData?.doctorSpecialization ||
                  doctorSpecialization ||
                  "التخصص الطبي"}
              </p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {prescriptionData?.prescriptionDate ||
                formatPrescriptionDate(new Date())}
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Patient Name
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {prescriptionData?.patientName || patientName || "المريض"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Date
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {prescriptionData?.prescriptionDate ||
                formatPrescriptionDate(new Date())}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Diagnosis
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {prescriptionData?.diagnosis || diagnosis || "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-3 text-right font-semibold">
                  Medication
                </th>
                <th className="px-3 py-3 text-right font-semibold">Dosage</th>
                <th className="px-3 py-3 text-right font-semibold">
                  Frequency
                </th>
                <th className="px-3 py-3 text-right font-semibold">
                  Instructions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(prescriptionData?.medications || medications || []).map(
                (med, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {med?.name || ""}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {med?.dosage || ""}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {med?.frequency || ""}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {med?.instructions || med?.duration || ""}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-56 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Doctor&apos;s Signature
            </p>
            <div className="mt-6 h-16 border-b border-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {prescriptionData?.doctorName || doctorName || "الدكتور"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diagnosis */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label
              htmlFor="diagnosis"
              className="block text-sm font-medium text-gray-700"
            >
              التشخيص <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={
                isListening ? stopVoiceRecognition : startVoiceRecognition
              }
              disabled={isProcessingVoice}
              className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white">
                {isListening && (
                  <span className="absolute inset-0 animate-pulse rounded-full bg-red-500" />
                )}
                <span
                  className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white ${
                    isListening ? "bg-red-500" : "bg-blue-600"
                  }`}
                >
                  🎙️
                </span>
              </span>
              {isProcessingVoice
                ? "جاري تحليل الوصفة..."
                : isListening
                  ? "إيقاف الاستماع"
                  : "استخدام الصوت"}
            </button>
          </div>
          <textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder={t(
              "components_Prescription_PrescriptionForm.attr_placeholder_enter_patient_diagno",
            )}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows="3"
          />

          {errors.diagnosis && (
            <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
          )}
          {voiceError && (
            <p className="mt-2 text-sm text-yellow-700">{voiceError}</p>
          )}
          {isProcessingVoice && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-50 p-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              </span>
              <p className="text-sm text-blue-700 font-medium">
                جاري تحليل الوصفة بالذكاء الاصطناعي...
              </p>
            </div>
          )}
        </div>

        {/* Medications */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              الأدوية <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  isListening ? stopVoiceRecognition : startVoiceRecognition
                }
                disabled={isProcessingVoice}
                className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white">
                  {isListening && (
                    <span className="absolute inset-0 animate-pulse rounded-full bg-red-500" />
                  )}
                  <span
                    className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white ${
                      isListening ? "bg-red-500" : "bg-blue-600"
                    }`}
                  >
                    🎙️
                  </span>
                </span>
                {isProcessingVoice
                  ? "جاري تحليل الوصفة..."
                  : isListening
                    ? "إيقاف الاستماع"
                    : "استخدام الصوت"}
              </button>
              <button
                type="button"
                onClick={addMedication}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + إضافة دواء
              </button>
            </div>
          </div>

          {errors.medications && (
            <p className="mb-2 text-sm text-red-600">{errors.medications}</p>
          )}

          <div className="space-y-3">
            {medications.map((med, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    دواء {index + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFetchAlternatives(index)}
                      disabled={alternativeLoading[index]}
                      className="text-xs rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {alternativeLoading[index]
                        ? "جارٍ البحث..."
                        : "💊 البدائل الذكية"}
                    </button>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) =>
                        updateMedication(index, "name", e.target.value)
                      }
                      placeholder={t(
                        "components_Prescription_PrescriptionForm.attr_placeholder_e_g_amoxicillin",
                      )}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />

                    {errors[`med_${index}_name`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`med_${index}_name`]}
                      </p>
                    )}
                    {medicationAlternatives[index]?.length > 0 && (
                      <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-slate-800">
                        <p className="mb-2 text-xs font-semibold text-slate-600">
                          اختر بديلًا ذكيًا:
                        </p>
                        <div className="space-y-1">
                          {medicationAlternatives[index].map(
                            (alternative, altIndex) => (
                              <button
                                key={altIndex}
                                type="button"
                                onClick={() =>
                                  selectAlternative(index, alternative)
                                }
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                              >
                                {alternative}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      الجرعة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) =>
                        updateMedication(index, "dosage", e.target.value)
                      }
                      placeholder={t(
                        "components_Prescription_PrescriptionForm.attr_placeholder_e_g_500mg",
                      )}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />

                    {errors[`med_${index}_dosage`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[`med_${index}_dosage`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      التكرار
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) =>
                        updateMedication(index, "frequency", e.target.value)
                      }
                      placeholder={t(
                        "components_Prescription_PrescriptionForm.attr_placeholder_e_g_3_times_daily",
                      )}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      المدة
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) =>
                        updateMedication(index, "duration", e.target.value)
                      }
                      placeholder={t(
                        "components_Prescription_PrescriptionForm.attr_placeholder_e_g_7_days",
                      )}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      التعليمات
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) =>
                        updateMedication(index, "instructions", e.target.value)
                      }
                      placeholder={t(
                        "components_Prescription_PrescriptionForm.attr_placeholder_e_g_take_with_food",
                      )}
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
            ملاحظات إضافية
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(
              "components_Prescription_PrescriptionForm.attr_placeholder_any_additional_notes",
            )}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows="2"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ الوصفة"}
          </button>
        </div>
      </form>

      <PrintablePrescription prescriptionData={successPrescriptionContext} />

      {isSuccessModalOpen && successPrescriptionContext && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  ✅ تم حفظ الروشتة بنجاح
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  ما الذي تريده الآن؟
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {successPrescriptionContext.patientName || "المريض"}
              </p>
              <p className="mt-1">
                الطبيب: {successPrescriptionContext.doctorName || "الدكتور"}
              </p>
              <p className="mt-1">
                التاريخ: {successPrescriptionContext.prescriptionDate}
              </p>
              <p className="mt-2 text-slate-600">
                التشخيص: {successPrescriptionContext.diagnosis || "—"}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handlePrintPrescription}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                🖨️ طباعة الروشتة فوراً
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                💬 إرسال عبر الواتساب
              </button>
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
// 🌟 المكون الناقص الأول: عرض تفاصيل الروشتة للدكتور (مع زرار الحذف)
export const DoctorPrescriptionView = ({
  prescription,
  onDelete,
  isLoading,
}) => {
  return (
    <div
      data-testid="doctor-view"
      className="space-y-4 bg-gray-50 p-4 rounded-md border text-right no-print"
      dir="rtl"
    >
      <div>
        <h4 className="text-sm font-semibold text-gray-700">التشخيص الحالي:</h4>
        <p className="text-sm text-gray-900 bg-white p-2 rounded border mt-1">
          {prescription?.diagnosis || "لا يوجد تشخيص"}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          الأدوية الموصوفة:
        </h4>
        <div className="space-y-2">
          {prescription?.medications?.map((med, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded border text-sm space-y-1"
            >
              <p className="font-medium text-blue-700">💊 {med.name}</p>
              <p className="text-xs text-gray-600">
                الجرعة: {med.dosage} | التكرار: {med.frequency || "غير محدد"}
              </p>
              {med.duration && (
                <p className="text-xs text-gray-600">المدة: {med.duration}</p>
              )}
              {med.instructions && (
                <p className="text-xs text-gray-500 italic">
                  تعليمات: {med.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {prescription?.notes && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            ملاحظات إضافية:
          </h4>
          <p className="text-sm text-gray-600 bg-white p-2 rounded border mt-1">
            {prescription.notes}
          </p>
        </div>
      )}

      <div className="flex justify-start pt-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (window.confirm("هل أنت متأكد من حذف هذه الروشتة الطبية؟")) {
              onDelete(prescription._id);
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? "جاري الحذف..." : "حذف الروشتة الطبية"}
        </button>
      </div>
    </div>
  );
};

// 🌟 المكون الناقص الثاني: عرض تفاصيل الروشتة للمريض
export const PatientPrescriptionView = ({ prescription }) => {
  return (
    <div
      data-testid="patient-view"
      className="space-y-4 bg-blue-50/50 p-4 rounded-md border border-blue-100 text-right no-print"
      dir="rtl"
    >
      <div>
        <h4 className="text-sm font-semibold text-blue-900">تشخيص الطبيب:</h4>
        <p className="text-sm text-gray-800 bg-white p-2 rounded border mt-1">
          {prescription?.diagnosis || "لا يوجد"}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          الأدوية والعلاج:
        </h4>
        <div className="space-y-2">
          {prescription?.medications?.map((med, idx) => (
            <div key={idx} className="bg-white p-3 rounded border text-sm">
              <p className="font-semibold text-slate-900">
                🟢 {med.name} ({med.dosage})
              </p>
              <p className="text-xs text-gray-600 mt-1">
                🔄 النظام: {med.frequency || "حسب الحاجة"}
              </p>
              {med.duration && (
                <p className="text-xs text-gray-600">
                  📆 المدة: {med.duration}
                </p>
              )}
              {med.instructions && (
                <p className="text-xs text-blue-700 bg-blue-50 p-1 rounded mt-1">
                  💡 إرشادات: {med.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {prescription?.notes && (
        <div>
          <h4 className="text-sm font-semibold text-blue-900">
            توجيهات إضافية من الطبيب:
          </h4>
          <p className="text-sm text-gray-700 bg-white p-2 rounded border mt-1">
            {prescription.notes}
          </p>
        </div>
      )}
    </div>
  );
};
