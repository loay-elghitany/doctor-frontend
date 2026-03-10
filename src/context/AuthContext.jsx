import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setupInterceptors } from "../services/api";
import { setAuthToken, clearAuthToken, getAuthToken } from "../utils/helpers";
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

  const logout = () => {
    debugLog("AuthContext:logout", "Logging out user");
    clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
  };

  useEffect(() => {
    setupInterceptors(logout);

    const loadUser = async () => {
      debugLog("AuthContext:loadUser", "Checking for token and loading user");
      const token = getAuthToken();
      if (token) {
        setAuthToken(token); // Ensure axios header is set
        debugLog("AuthContext:loadUser", "Token found, fetching user profile");
        try {
          // Decode token to get role
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          const role = tokenPayload.role;

          debugLog("AuthContext:loadUser", "Token decoded", { role });

          // Fetch appropriate profile based on role
          let response;
          if (role === "doctor") {
            response = await authService.getDoctorProfile();
            setUserRole("doctor");
          } else {
            response = await authService.getPatientProfile();
            setUserRole("patient");
          }

          setUser(response.data.data);
          setIsAuthenticated(true);
          debugLog("AuthContext:loadUser", "User profile loaded", {
            role,
            userName: response.data.data?.name,
          });
        } catch (error) {
          debugError(
            "AuthContext:loadUser",
            "Failed to load user profile",
            error,
          );
          logout();
        }
      } else {
        debugLog("AuthContext:loadUser", "No token found");
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password, userType) => {
    debugLog("AuthContext:login", "Starting login", { email, userType });
    try {
      debugLog("AuthContext:login", "Calling auth service");
      const response =
        userType === "patient"
          ? await authService.loginPatient(email, password)
          : await authService.loginDoctor(email, password);

      debugLog("AuthContext:login", "Auth service returned", {
        hasToken: !!response.data.data?.token,
      });

      const { token } = response.data.data;

      // Set token for future requests
      setAuthToken(token);
      localStorage.setItem("token", token);

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
        } else {
          profileResponse = await authService.getPatientProfile();
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
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
