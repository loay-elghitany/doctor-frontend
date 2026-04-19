import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

/**
 * AdminRoute component for admin-only access control
 *
 * Strictly validates admin auth ONLY using AdminAuthContext:
 * - Does NOT depend on user auth logic
 * - Does NOT mix contexts
 *
 * Usage:
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 */
const AdminRoute = ({ children }) => {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdminAuthenticated) {
    if (import.meta.env.DEV) {
      console.log(
        "AdminRoute: Admin not authenticated. Redirecting to /admin/login.",
      );
    }
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (import.meta.env.DEV) {
    console.log("AdminRoute: Admin authenticated. Granting access.");
  }

  return children;
};

export default AdminRoute;
