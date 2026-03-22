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
 * <ProtectedRoute requiredRole="doctor">
 *   <DoctorDashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, userRole } = useAuth();
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

  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    console.log(
      `ProtectedRoute: User role '${userRole}' does not match required role '${requiredRole}', redirecting.`,
    );
    // Redirect to appropriate dashboard based on user role
    const redirectPath =
      userRole === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
