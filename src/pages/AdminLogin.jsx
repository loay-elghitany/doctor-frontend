import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Input, Button, Alert, Card } from "../components/ui";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { debugLog, debugError } from "../utils/debug";
import api from "../services/api.js";

/**
 * AdminLogin - Admin authentication page
 * Admin enters email and password to access subscription management dashboard
 */
export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAdminAuthenticated } = useContext(AdminAuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(location.state?.from?.pathname || "/admin/dashboard", {
        replace: true,
      });
    }
  }, [isAdminAuthenticated, navigate, location.state]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      debugLog("AdminLogin", "Admin authentication attempt");

      const res = await api.post("/admin/login", {
        email,
        password,
      });

      login(res.data.token);

      debugLog("AdminLogin", "Admin authenticated successfully");
      setEmail("");
      setPassword("");

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      debugError("AdminLogin", "Authentication failed", err);
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-600 mt-2">Manual Subscription Management</p>
          </div>

          {error && (
            <Alert type="danger" message={error} onClose={() => setError("")} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              disabled={loading}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />

            <div className="text-sm text-gray-600">
              <p>
                This portal allows you to manually create and manage doctor
                subscriptions.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Access Admin Portal"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 This portal requires authentication</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
