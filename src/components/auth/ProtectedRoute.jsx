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
  const normalizedAllowedRoles = allowedRoles
    ? allowedRoles.map((role) => String(role || "").toLowerCase())
    : null;
  const normalizedUserRole =
    typeof userRole === "string" ? userRole.toLowerCase() : userRole;

  // Check role if required
  if (
    normalizedAllowedRoles &&
    !normalizedAllowedRoles.includes(normalizedUserRole)
  ) {
    if (import.meta.env.DEV) {
      console.log(
        `ProtectedRoute: User role '${userRole}' does not match allowed roles [${allowedRoles.join(", ")}], redirecting.`,
      );
    }
    // Redirect to appropriate dashboard based on user role
    const redirectPath =
      normalizedUserRole === "doctor"
        ? "/doctor/dashboard"
        : normalizedUserRole === "patient"
          ? "/patient/dashboard"
          : normalizedUserRole === "secretary"
            ? "/secretary/dashboard"
            : "/login"; // fallback
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
