import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ProtectedRoute component for role-based access control
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
  const { isAuthenticated, loading, userRole, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can add a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log(
      "ProtectedRoute: User not authenticated, redirecting to login.",
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    console.log(
      "ProtectedRoute: Admin user detected, blocking access to non-admin route.",
    );
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Support both single role and multiple roles
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : null);
  if (!allowedRoles) {
    console.log(
      "ProtectedRoute: Missing requiredRole/requiredRoles, denying access.",
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role || "").toLowerCase(),
  );
  const normalizedUserRole =
    typeof userRole === "string" ? userRole.toLowerCase() : userRole;

  // Check role if required
  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    if (import.meta.env.DEV) {
      console.log(
        `ProtectedRoute: User role '${userRole}' does not match allowed roles [${allowedRoles.join(", ")}], redirecting.`,
      );
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
