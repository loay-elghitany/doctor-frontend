import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../src/context/AuthContext.jsx";
import { SocketProvider } from "../../src/context/SocketContext.jsx";
import { vi } from "vitest";

export const createMockAuthValue = ({
  role = "secretary",
  user = null,
} = {}) => {
  const normalizedRole = String(role).toLowerCase();
  return {
    user: user || {
      _id: "user-1",
      name: `${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)} User`,
      role: normalizedRole,
      clinicSlug: "doc-a",
      doctorId: "doctor-1",
    },
    isAuthenticated: true,
    loading: false,
    userRole: normalizedRole,
    isAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
  };
};

export const renderWithProviders = (
  ui,
  { route = "/", authValue = createMockAuthValue() } = {},
) => {
  window.history.pushState({}, "Test page", route);
  window.localStorage.setItem("token", "test-token");

  return render(
    <AuthContext.Provider value={authValue}>
      <SocketProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </SocketProvider>
    </AuthContext.Provider>,
  );
};
