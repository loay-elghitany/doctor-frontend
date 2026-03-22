import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import { Input, Button, Alert, Card } from "../components/ui";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { debugLog, debugError } from "../utils/debug";

/**
 * AdminLogin - Admin authentication page
 * Admin enters ADMIN_SECRET_TOKEN to access subscription management dashboard
 */
export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AdminAuthContext);

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!token.trim()) {
      setError("Admin token is required");
      setLoading(false);
      return;
    }

    try {
      debugLog("AdminLogin", "Admin authentication attempt");

      // Store token in context and localStorage
      login(token);

      debugLog("AdminLogin", "Admin authenticated successfully");
      setToken("");

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
              label="Admin Authentication Token"
              type="password"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your admin secret token"
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
