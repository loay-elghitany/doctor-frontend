import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AdminAuthContext } from "../../context/AdminAuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { isAdminAuthenticated } = useContext(AdminAuthContext);
  const location = useLocation();
  const adminAccess = isAdminAuthenticated || isAdmin;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!adminAccess) {
    console.log(
      "AdminRoute: Admin not authenticated, redirecting to admin login.",
    );
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
