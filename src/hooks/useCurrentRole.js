import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

/**
 * Unified role detection hook
 * Determines the current user's role and authentication status
 *
 * Strictly separates admin auth from user auth:
 * - isAdmin ONLY true if AdminAuthContext.isAdminAuthenticated === true
 * - role comes ONLY from AuthContext.userRole when not admin
 *
 * @returns {Object} { role: string | null, isAdmin: boolean, isAuthenticated: boolean, loading: boolean }
 */
export const useCurrentRole = () => {
  const {
    isAuthenticated: isUserAuthenticated,
    userRole,
    loading: userLoading,
  } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading } = useAdminAuth();

  // isAdmin MUST be true ONLY if AdminAuthContext.isAdminAuthenticated === true
  const isAdmin = Boolean(isAdminAuthenticated);

  // isAuthenticated is true if either admin OR user is authenticated
  const isAuthenticated = isAdmin || Boolean(isUserAuthenticated);

  // role comes ONLY from AuthContext.userRole when not admin, never mix contexts
  const role = isAdmin
    ? "admin"
    : typeof userRole === "string"
      ? userRole
      : null;

  // loading state from either context
  const loading = userLoading || adminLoading;

  if (import.meta.env.DEV) {
    console.log("Role Debug:", { isAdmin, role, isAuthenticated, loading });
  }

  return {
    role,
    isAdmin,
    isAuthenticated,
    loading,
  };
};
