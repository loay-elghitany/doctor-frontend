import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Button } from "../components/ui";
import { AuthLayout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

// Placeholder for Home/Landing Page
export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-600">ClinicSaaS</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 text-center text-white">
        <h2 className="text-5xl font-bold mb-6">
          Multi-Doctor Clinic Management
        </h2>
        <p className="text-xl mb-8">
          Manage appointments, doctors, and patients all in one place.
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => (window.location.href = "/login")}
          >
            Get Started
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => (window.location.href = "/about")}
          >
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="bg-white text-gray-900">
            <h3 className="text-xl font-bold mb-2">For Patients</h3>
            <p className="text-gray-600">
              Book and manage appointments with ease.
            </p>
          </Card>
          <Card className="bg-white text-gray-900">
            <h3 className="text-xl font-bold mb-2">For Doctors</h3>
            <p className="text-gray-600">
              Manage your schedule and patient appointments.
            </p>
          </Card>
          <Card className="bg-white text-gray-900">
            <h3 className="text-xl font-bold mb-2">Multi-Tenant</h3>
            <p className="text-gray-600">
              Support multiple clinics in one platform.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Placeholder Login Page
export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [userType, setUserType] = React.useState("patient");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const from =
    location.state?.from?.pathname ||
    (userType === "patient" ? "/patient/dashboard" : "/doctor/dashboard");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    // Backend requires password for all roles (patient and doctor)
    if (!password) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    console.log("Login attempt:", { userType, email: trimmedEmail });

    try {
      const user = await login(trimmedEmail, password, userType);
      console.log("Login success:", user);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Login
        </h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="patient"
                checked={userType === "patient"}
                onChange={(e) => setUserType(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Patient</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="doctor"
                checked={userType === "doctor"}
                onChange={(e) => setUserType(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Doctor</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </Card>
    </AuthLayout>
  );
};
