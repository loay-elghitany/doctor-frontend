import React, { createContext, useState, useEffect } from "react";

const ADMIN_TOKEN_KEY = "admin_token";
const LEGACY_ADMIN_TOKEN_KEY = "adminToken";

const dispatchAdminAuthChanged = () => {
  window.dispatchEvent(new CustomEvent("adminAuthChanged"));
};

/**
 * Admin Auth Context
 * Manages admin authentication token for manual subscription management
 */
export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken =
      localStorage.getItem(ADMIN_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
    }
  }, []);

  const login = (token) => {
    setAdminToken(token);
    setIsAdminAuthenticated(true);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    dispatchAdminAuthChanged();
  };

  const logout = () => {
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
    dispatchAdminAuthChanged();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        isAdminAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
