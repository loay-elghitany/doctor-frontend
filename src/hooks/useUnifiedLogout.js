import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

/**
 * Unified logout hook that handles both admin and user logout
 * Automatically detects the current user type and uses the appropriate logout function
 *
 * @returns {Object} { handleLogout: function }
 */
export const useUnifiedLogout = () => {
  const { logout: userLogout } = useAuth();
  const { isAdminAuthenticated, logout: adminLogout } = useAdminAuth();

  const handleLogout = () => {
    if (isAdminAuthenticated) {
      adminLogout();
    } else {
      userLogout();
    }
  };

  return { handleLogout };
};
