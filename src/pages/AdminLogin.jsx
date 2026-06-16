import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            <h1 className="text-3xl font-bold text-gray-900">
              {t("pages_AdminLogin.text_admin_portal")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("pages_AdminLogin.text_manual_subscription_management")}
            </p>
          </div>

          {error && (
            <Alert type="danger" message={error} onClose={() => setError("")} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("pages_AdminLogin.attr_label_email")}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(
                "pages_AdminLogin.attr_placeholder_enter_your_admin_email",
              )}
              disabled={loading}
              required
            />

            <Input
              label={t("pages_AdminLogin.attr_label_password")}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(
                "pages_AdminLogin.attr_placeholder_enter_your_password",
              )}
              disabled={loading}
              required
            />

            <div className="text-sm text-gray-600">
              <p>
                {t(
                  "pages_AdminLogin.text_this_portal_allows_you_to_manually_creat",
                )}
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
            <p>
              {t("pages_AdminLogin.text_this_portal_requires_authentication")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
