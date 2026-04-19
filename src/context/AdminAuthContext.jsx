import { createContext, useContext, useState, useEffect } from "react";
import { debugLog } from "../utils/debug";

const ADMIN_TOKEN_KEY = "admin_token";
const LEGACY_ADMIN_TOKEN_KEY = "adminToken";

// Default context value to prevent undefined destructuring
const defaultContextValue = {
  adminToken: null,
  isAdminAuthenticated: false,
  admin: null,
  login: () => {},
  logout: () => {},
  loading: true,
};

/**
 * Admin Auth Context
 * Manages admin authentication token for manual subscription management
 * Completely independent from user authentication
 */
export const AdminAuthContext = createContext(defaultContextValue);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    debugLog("[AdminAuth] Initializing admin auth context");
    const savedToken =
      localStorage.getItem(ADMIN_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);

    if (savedToken) {
      debugLog("[AdminAuth] Found saved admin token, setting authenticated");
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
      // For now, we don't fetch admin profile, just use token presence
      setAdmin({ token: savedToken });
    } else {
      debugLog("[AdminAuth] No admin token found");
      setIsAdminAuthenticated(false);
      setAdmin(null);
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    debugLog("[AdminAuth] Admin login");
    setAdminToken(token);
    setIsAdminAuthenticated(true);
    setAdmin({ token });
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setLoading(false);
  };

  const logout = () => {
    debugLog("[AdminAuth] Admin logout");
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    setAdmin(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
    setLoading(false);
    // Force immediate redirect to admin login
    window.location.href = "/admin/login";
  };

  const value = {
    adminToken,
    isAdminAuthenticated,
    admin,
    login,
    logout,
    loading,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
