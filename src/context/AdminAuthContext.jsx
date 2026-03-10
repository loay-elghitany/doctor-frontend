import React, { createContext, useState, useEffect } from "react";

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
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
    }
  }, []);

  const login = (token) => {
    setAdminToken(token);
    setIsAdminAuthenticated(true);
    localStorage.setItem("adminToken", token);
  };

  const logout = () => {
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem("adminToken");
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
