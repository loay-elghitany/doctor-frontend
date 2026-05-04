import { screen } from "@testing-library/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthContext } from "../src/context/AuthContext.jsx";
import { AdminAuthContext } from "../src/context/AdminAuthContext.jsx";
import { SocketProvider } from "../src/context/SocketContext.jsx";
import ProtectedRoute from "../src/components/auth/ProtectedRoute.jsx";

// Test component to verify rendering
const TestComponent = ({ text = "Protected Content" }) => <div>{text}</div>;

const renderWithAuth = (
  protectedElement,
  authValue = {
    isAuthenticated: true,
    loading: false,
    userRole: "doctor",
    isAdmin: false,
  },
  adminAuthValue = {
    isAdminAuthenticated: false,
    loading: false,
    admin: null,
  },
) => {
  window.localStorage.setItem("token", "test-token");

  return render(
    <AuthContext.Provider value={authValue}>
      <AdminAuthContext.Provider value={adminAuthValue}>
        <SocketProvider>
          <BrowserRouter>{protectedElement}</BrowserRouter>
        </SocketProvider>
      </AdminAuthContext.Provider>
    </AuthContext.Provider>,
  );
};

describe("ProtectedRoute - RBAC Enforcement", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("Access Control for Single Role", () => {
    it("should grant access to doctor accessing doctor-only route", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "doctor",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="doctor">
                <TestComponent text="Doctor Route Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Doctor Route Content")).toBeInTheDocument();
    });

    it("should grant access to secretary accessing secretary-only route", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "secretary",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="secretary">
                <TestComponent text="Secretary Route Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Secretary Route Content")).toBeInTheDocument();
    });

    it("should grant access to patient accessing patient-only route", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "patient",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="patient">
                <TestComponent text="Patient Route Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Patient Route Content")).toBeInTheDocument();
    });
  });

  describe("Multi-Role Access Control", () => {
    it("should grant access when user role matches one of multiple allowed roles (doctor)", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "doctor",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRoles={["doctor", "secretary"]}>
                <TestComponent text="Staff Only" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Staff Only")).toBeInTheDocument();
    });

    it("should grant access when user role matches one of multiple allowed roles (secretary)", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "secretary",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRoles={["doctor", "secretary"]}>
                <TestComponent text="Staff Access Granted" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Staff Access Granted")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator while authentication is in progress", () => {
      const authValue = {
        isAuthenticated: false,
        loading: true,
        userRole: null,
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="doctor">
                <TestComponent text="Doctor Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Case-Insensitive Role Matching", () => {
    it("should match roles case-insensitively (uppercase user role, lowercase required)", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "DOCTOR",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="doctor">
                <TestComponent text="Case Insensitive Match" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Case Insensitive Match")).toBeInTheDocument();
    });

    it("should match roles case-insensitively in multi-role arrays", () => {
      const authValue = {
        isAuthenticated: true,
        loading: false,
        userRole: "Secretary",
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRoles={["DOCTOR", "SECRETARY"]}>
                <TestComponent text="Multi-Role Case Match" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      expect(screen.getByText("Multi-Role Case Match")).toBeInTheDocument();
    });
  });

  describe("Admin Access Blocking", () => {
    it("should show loading while admin context loads", () => {
      const authValue = {
        isAuthenticated: false,
        loading: true,
        userRole: null,
        isAdmin: false,
      };
      const adminAuthValue = {
        isAdminAuthenticated: false,
        loading: true,
        admin: null,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="doctor">
                <TestComponent text="Doctor Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
        adminAuthValue,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Unauthenticated Access Blocking", () => {
    it("should show loading when not authenticated and loading is false", () => {
      const authValue = {
        isAuthenticated: false,
        loading: false,
        userRole: null,
        isAdmin: false,
      };

      renderWithAuth(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="doctor">
                <TestComponent text="Doctor Content" />
              </ProtectedRoute>
            }
          />
        </Routes>,
        authValue,
      );

      // When not authenticated, ProtectedRoute blocks rendering and redirects
      // We should see an empty container or loading state
      expect(screen.queryByText("Doctor Content")).not.toBeInTheDocument();
    });
  });
});
