import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Input } from "../components/ui";
import { AuthLayout } from "../components/layout/Layout";
import authService from "../services/authService";

export const Register = () => {
  const navigate = useNavigate();
  // Form state
  const [formData, setFormData] = useState({
    clinicSlug: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Validate individual field
   */
  const validateField = (name, value, allData = formData) => {
    const fieldErrors = {};

    switch (name) {
      case "clinicSlug":
        if (!value.trim()) {
          fieldErrors.clinicSlug = "Clinic slug is required";
        } else if (!/^[a-z0-9-]+$/.test(value.trim())) {
          fieldErrors.clinicSlug =
            "Use lowercase letters, numbers, and hyphens only";
        }
        break;

      case "name":
        if (!value.trim()) {
          fieldErrors.name = "Full name is required";
        } else if (value.trim().length < 2) {
          fieldErrors.name = "Full name must be at least 2 characters";
        }
        break;

      case "email":
        if (!value.trim()) {
          fieldErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.email = "Please enter a valid email address";
        }
        break;

      case "password":
        if (!value) {
          fieldErrors.password = "Password is required";
        } else if (value.length < 6) {
          fieldErrors.password = "Password must be at least 6 characters";
        }
        break;

      case "confirmPassword":
        if (!value) {
          fieldErrors.confirmPassword = "Please confirm your password";
        } else if (value !== allData.password) {
          fieldErrors.confirmPassword = "Passwords do not match";
        }
        break;

      case "phone":
        // Phone is optional, but if provided must match E.164 format
        if (value && value.trim()) {
          const v = value.trim();
          const e164 = /^\+[1-9]\d{1,14}$/;
          if (!e164.test(v)) {
            fieldErrors.phone =
              "Please enter a valid phone number in E.164 format (e.g., +12025550123)";
          }
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    Object.keys(formData).forEach((field) => {
      const fieldErrors = validateField(field, formData[field], formData);
      Object.assign(newErrors, fieldErrors);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate confirm password if password changed
    if (name === "password" && formData.confirmPassword) {
      const confirmErrors = validateField(
        "confirmPassword",
        formData.confirmPassword,
        { ...formData, [name]: value },
      );
      if (confirmErrors.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: confirmErrors.confirmPassword,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setSuccessMessage("");
    setErrorMessage("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log(
        "Starting patient registration with clinic:",
        formData.clinicSlug,
      );

      // Call registration API endpoint using authService
      const response = await authService.registerPatient(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.clinicSlug.trim(),
        formData.phone && formData.phone.trim()
          ? formData.phone.trim()
          : undefined,
      );

      console.log("Registration response:", response);

      const { data } = response.data;

      // Save patient ID and clinic slug to localStorage
      if (data.id) {
        localStorage.setItem("patientId", data.id);
        localStorage.setItem("clinicSlug", formData.clinicSlug.trim());
      }

      // Show success message
      setSuccessMessage("Registration successful! Redirecting to dashboard...");

      // Redirect to patient dashboard
      navigate("/patient/dashboard");
    } catch (err) {
      // Handle API errors with detailed logging
      console.error("Registration error:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.response?.data?.error,
        fullError: err,
      });

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";

      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Create Account
        </h2>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clinic Slug Input */}
          <Input
            label="Clinic Slug"
            type="text"
            name="clinicSlug"
            placeholder="e.g., dr-ahmed"
            value={formData.clinicSlug}
            onChange={handleChange}
            error={errors.clinicSlug}
            required={true}
            disabled={loading}
          />

          {/* Full Name Input */}
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required={true}
            disabled={loading}
          />

          {/* Email Input */}
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required={true}
            disabled={loading}
          />

          {/* Phone Input (optional, E.164) */}
          <Input
            label="Phone Number (optional)"
            type="tel"
            name="phone"
            placeholder="e.g., +12025550123"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required={false}
            disabled={loading}
          />

          {/* Password Input */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={true}
            disabled={loading}
          />

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required={true}
            disabled={loading}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login here
          </a>
        </p>
      </Card>
    </AuthLayout>
  );
};
