import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Input, Modal, Alert } from "./ui";
import { patientService } from "../services/patientService";

const EditPatientModal = ({ isOpen, onClose, patient, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    age: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen && patient) {
      setFormData({
        name: patient.name || "",
        phoneNumber: patient.phoneNumber || patient.phone || "",
        email: patient.email || "",
        age:
          patient.age !== undefined && patient.age !== null
            ? String(patient.age)
            : "",
      });
      setErrors({});
      setSubmitError("");
    }
  }, [isOpen, patient]);

  const validate = () => {
    const nextErrors = {};
    const name = formData.name.trim();
    const phoneNumber = formData.phoneNumber.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name) {
      nextErrors.name = "الاسم مطلوب";
    }

    if (!phoneNumber) {
      nextErrors.phoneNumber = "رقم الهاتف مطلوب";
    } else if (!/^\+?[0-9\s\-()]{7,15}$/.test(phoneNumber)) {
      nextErrors.phoneNumber = "رقم الهاتف غير صحيح";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "البريد الإلكتروني غير صحيح";
    }

    return nextErrors;
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!patient?._id && !patient?.id) {
      setSubmitError("تعذر تحديد المريض");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        age:
          formData.age !== undefined &&
          formData.age !== null &&
          String(formData.age).trim() !== ""
            ? Number(formData.age)
            : undefined,
      };

      const response = await patientService.updatePatient(
        patient?._id || patient?.id,
        payload,
      );

      const updatedPatient = response?.data?.data || response?.data || null;
      onUpdated?.(updatedPatient || { ...(patient || {}), ...payload });
      toast.success("تم تحديث بيانات المريض بنجاح");
      onClose();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "تعذر تحديث بيانات المريض";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تعديل بيانات المريض"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        {submitError && <Alert type="danger" message={submitError} />}

        <Input
          label="الاسم"
          placeholder="أدخل اسم المريض"
          value={formData.name}
          onChange={handleChange("name")}
          error={errors.name}
          required
        />

        <Input
          label="رقم الهاتف"
          placeholder="أدخل رقم الهاتف"
          value={formData.phoneNumber}
          onChange={handleChange("phoneNumber")}
          error={errors.phoneNumber}
          required
        />

        <Input
          label="السن (اختياري)"
          type="number"
          placeholder="أدخل سن المريض..."
          value={formData.age}
          onChange={handleChange("age")}
          error={errors.age}
          min={0}
          max={120}
        />

        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="أدخل البريد الإلكتروني"
          value={formData.email}
          onChange={handleChange("email")}
          error={errors.email}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={isSubmitting}>
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPatientModal;
