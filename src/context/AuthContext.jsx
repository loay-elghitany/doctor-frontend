import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { setupInterceptors } from "../services/api";
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  parseJwtToken,
} from "../utils/helpers";
import authService from "../services/authService";
import { debugLog, debugError } from "../utils/debug";

const defaultAuthContextValue = {
  user: null,
  isAuthenticated: false,
  loading: true,
  userRole: null,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
};

export const AuthContext = createContext(defaultAuthContextValue);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const logout = useCallback(() => {
    debugLog("AuthContext:logout", "Logging out user");
    clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);

    // Force immediate redirect to login
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    setupInterceptors(logout);

    const loadUserFromToken = async (token) => {
      setAuthToken(token); // Ensure axios header is set
      debugLog("AuthContext:loadUser", "Token found, fetching user profile");

      const tokenPayload = parseJwtToken(token);
      if (!tokenPayload || !tokenPayload.role) {
        throw new Error("Invalid authentication token");
      }
      const role = String(tokenPayload.role).toLowerCase();

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

      const token = getAuthToken();
      if (!token) {
        debugLog("AuthContext:loadUser", "No token found");
        setIsAuthenticated(false);
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

    const handleStorageChange = () => {
      // Handle storage changes (like token removal from other tabs)
      const currentToken = getAuthToken();
      if (!currentToken && isAuthenticated) {
        debugLog(
          "AuthContext:storage",
          "Token removed from storage, logging out",
        );
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, logout]);

  const login = useCallback(async (email, password, userType, options = {}) => {
    debugLog("AuthContext:login", "Starting login", { email, userType });
    try {
      debugLog("AuthContext:login", "Calling auth service");
      const response =
        userType === "patient"
          ? await authService.loginPatient(email, password, options.clinicSlug)
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

      // Safely decode token to get role
      let role = null;
      try {
        const tokenPayload = parseJwtToken(token);
        if (!tokenPayload || !tokenPayload.role) {
          throw new Error("Invalid authentication token received");
        }
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
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      userRole,
      isAdmin: false,
      login,
      logout,
    }),
    [user, isAuthenticated, loading, userRole, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
