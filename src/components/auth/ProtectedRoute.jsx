import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentRole } from "../../hooks/useCurrentRole";

/**
 * ProtectedRoute component for role-based access control
 *
 * Strictly validates user auth only (not admin):
 * - If user is admin: block and redirect to /admin/dashboard
 * - If user not authenticated: redirect to /login
 * - If role doesn't match: redirect to role-specific dashboard
 *
 * Usage:
 * <ProtectedRoute requiredRole="patient">
 *   <PatientDashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRoles={['doctor', 'secretary']}>
 *   <SharedComponent />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredRoles = null,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, loading, role, isAdmin } = useCurrentRole();
  const location = useLocation();

  if (loading) {
    return <div>{t("components_auth_ProtectedRoute.text_loading")}</div>;
  }

  // Block admin users from accessing normal user routes
  if (isAdmin) {
    if (import.meta.env.DEV) {
      console.log(
        "ProtectedRoute: Admin detected. Blocking access to user route. Redirecting to /admin/dashboard.",
      );
      console.log("Role Debug:", { isAdmin, role, isAuthenticated });
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Require user authentication
  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.log(
        "ProtectedRoute: User not authenticated. Redirecting to /login.",
      );
      console.log("Role Debug:", { isAdmin, role, isAuthenticated });
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require either requiredRole or requiredRoles to be specified
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : null);
  if (!allowedRoles) {
    if (import.meta.env.DEV) {
      console.log(
        "ProtectedRoute: Missing requiredRole/requiredRoles configuration. Denying access.",
      );
      console.log("Role Debug:", { isAdmin, role, isAuthenticated });
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validate user role matches allowed roles
  const normalizedAllowedRoles = allowedRoles.map((item) =>
    String(item || "").toLowerCase(),
  );
  const normalizedUserRole =
    typeof role === "string" ? role.toLowerCase() : role;

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    if (import.meta.env.DEV) {
      console.log(
        `ProtectedRoute: User role '${role}' not in allowed roles [${allowedRoles.join(", ")}]. Redirecting to role dashboard.`,
      );
      console.log("Role Debug:", { isAdmin, role, isAuthenticated });
    }

    const redirectPath =
      normalizedUserRole === "doctor"
        ? "/doctor/dashboard"
        : normalizedUserRole === "secretary"
          ? "/secretary/dashboard"
          : normalizedUserRole === "patient"
            ? "/patient/dashboard"
            : "/login";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
