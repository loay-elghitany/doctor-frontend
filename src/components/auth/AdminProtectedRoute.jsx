import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AdminAuthContext } from "../../context/AdminAuthContext";

/**
 * AdminProtectedRoute component for admin-only access control
 * Ensures user is authenticated with valid admin token before allowing access
 *
 * Usage:
 * <AdminProtectedRoute>
 *   <AdminDashboard />
 * </AdminProtectedRoute>
 */
const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated } = useContext(AdminAuthContext);
  const location = useLocation();

  if (!isAdminAuthenticated) {
    console.log(
      "AdminProtectedRoute: Admin not authenticated, redirecting to admin login.",
    );
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
