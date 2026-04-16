import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setupInterceptors } from "../services/api";
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  getAdminToken,
  clearAdminToken,
} from "../utils/helpers";
import authService from "../services/authService";
import { debugLog, debugError } from "../utils/debug";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const logout = () => {
    debugLog("AuthContext:logout", "Logging out user");
    clearAuthToken();
    clearAdminToken();
    window.dispatchEvent(new CustomEvent("adminAuthChanged"));
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    setupInterceptors(logout);

    const getSavedAdminToken = () => getAdminToken();

    const loadUserFromToken = async (token) => {
      setAuthToken(token); // Ensure axios header is set
      debugLog("AuthContext:loadUser", "Token found, fetching user profile");

      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const role = String(tokenPayload.role || "").toLowerCase();

      debugLog("AuthContext:loadUser", "Token decoded", { role });

      let response;
      if (role === "doctor") {
        response = await authService.getDoctorProfile();
        setUserRole("doctor");
      } else if (role === "secretary") {
        response = await authService.getSecretaryProfile();
        setUserRole("secretary");
      } else if (role === "patient") {
        response = await authService.getPatientProfile();
        setUserRole("patient");
      } else {
        throw new Error(`Unsupported role '${role}'`);
      }

      setUser(response.data.data);
      setIsAuthenticated(true);
      debugLog("AuthContext:loadUser", "User profile loaded", {
        role,
        userName: response.data.data?.name,
      });
    };

    const initializeAuth = async () => {
      debugLog("AuthContext:loadUser", "Checking for token and loading user");
      const adminToken = getSavedAdminToken();

      if (adminToken) {
        debugLog(
          "AuthContext:loadUser",
          "Admin token found, activating admin mode",
        );
        setIsAdmin(true);
        setIsAuthenticated(true);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        debugLog("AuthContext:loadUser", "No token found");
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        await loadUserFromToken(token);
      } catch (error) {
        debugError(
          "AuthContext:loadUser",
          "Failed to load user profile",
          error,
        );
        logout();
      }
      setLoading(false);
    };

    initializeAuth();

    const handleAdminAuthChanged = () => {
      const adminToken = getSavedAdminToken();
      if (adminToken) {
        debugLog(
          "AuthContext:adminAuthChanged",
          "Admin auth detected, switching to admin mode",
        );
        setIsAdmin(true);
        setIsAuthenticated(true);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      debugLog(
        "AuthContext:adminAuthChanged",
        "Admin auth cleared, reloading normal auth",
      );
      setIsAdmin(false);
      setLoading(true);
      initializeAuth();
    };

    window.addEventListener("adminAuthChanged", handleAdminAuthChanged);
    window.addEventListener("storage", handleAdminAuthChanged);

    return () => {
      window.removeEventListener("adminAuthChanged", handleAdminAuthChanged);
      window.removeEventListener("storage", handleAdminAuthChanged);
    };
  }, []);

  const login = async (email, password, userType) => {
    debugLog("AuthContext:login", "Starting login", { email, userType });
    try {
      debugLog("AuthContext:login", "Calling auth service");
      const response =
        userType === "patient"
          ? await authService.loginPatient(email, password)
          : userType === "doctor"
            ? await authService.loginDoctor(email, password)
            : await authService.loginSecretary(email, password);

      debugLog("AuthContext:login", "Auth service returned", {
        hasToken: !!response.data.data?.token,
      });

      const token = response.data?.data?.token;
      if (!token) {
        throw new Error("Invalid authentication response");
      }

      setAuthToken(token);
      localStorage.setItem("token", token);
      clearAdminToken();
      setIsAdmin(false);

      // Safely decode token to get role
      let role = null;
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        role = tokenPayload.role;
        debugLog("AuthContext:login", "Token decoded", { role });
      } catch (decodeErr) {
        debugError("AuthContext:login", "Failed to decode token", decodeErr);
        // Defensive: clear saved token and throw
        clearAuthToken();
        throw new Error("Invalid authentication token received");
      }

      setUserRole(role);

      // Fetch appropriate profile based on role
      debugLog("AuthContext:login", "Fetching profile", { role });
      let profileResponse;
      try {
        if (role === "doctor") {
          profileResponse = await authService.getDoctorProfile();
        } else if (role === "secretary") {
          profileResponse = await authService.getSecretaryProfile();
        } else if (role === "patient") {
          profileResponse = await authService.getPatientProfile();
        } else {
          throw new Error(`Unsupported role '${role}'`);
        }
        debugLog("AuthContext:login", "Profile fetched", {
          role,
          hasData: !!profileResponse.data?.data,
        });
      } catch (profileErr) {
        debugError("AuthContext:login", "Profile fetch failed", {
          role,
          error: profileErr.response?.data?.message || profileErr.message,
        });
        throw profileErr;
      }

      setUser(profileResponse.data.data);
      setIsAuthenticated(true);
      if (!getAdminToken()) {
        setIsAdmin(false);
      }
      debugLog("AuthContext:login", "Login completed successfully");
      return profileResponse.data.data;
    } catch (err) {
      debugError("AuthContext:login", "Login failed", {
        error: err.response?.data || err.message,
      });
      // Ensure no partial auth state remains
      clearAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    userRole,
    isAdmin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
