import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecretaryCreateAppointment } from "../SecretaryCreateAppointment";
import { patientService } from "../../services/patientService";
import doctorService from "../../services/doctorService";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../components/layout/Layout", () => ({
  MainLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../components/ui", () => ({
  GlassCard: ({ children }) => <div>{children}</div>,
  BentoGridItem: ({ children }) => <div>{children}</div>,
  EmptyState: ({ children }) => <div>{children}</div>,
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Alert: ({ children }) => <div>{children}</div>,
  Input: ({ ...props }) => <input {...props} />,
}));

vi.mock("../../services/patientService", () => ({
  patientService: {
    getPatients: vi.fn(),
  },
}));

vi.mock("../../services/appointmentService", () => ({
  appointmentService: {
    createSecretaryAppointment: vi.fn(),
  },
}));

vi.mock("../../services/doctorService", () => ({
  default: {
    getDoctorProfile: vi.fn(),
  },
}));

vi.mock("../../utils/helpers", () => ({
  handleApiError: (error) => error?.message || "error",
}));

vi.mock("../../utils/debug", () => ({
  debugLog: vi.fn(),
  debugError: vi.fn(),
}));

describe("SecretaryCreateAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    doctorService.getDoctorProfile.mockResolvedValue({
      data: {
        data: {
          customIntakeQuestions: [],
        },
      },
    });
  });

  it("searches patients from the server as the user types", async () => {
    patientService.getPatients.mockImplementation(({ search } = {}) => {
      const results = search
        ? [{ _id: "p-1", name: "Alice", email: "alice@example.com" }]
        : [
            { _id: "p-1", name: "Alice", email: "alice@example.com" },
            { _id: "p-2", name: "Bob", email: "bob@example.com" },
          ];

      return Promise.resolve({ data: { data: results } });
    });

    render(<SecretaryCreateAppointment />);

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/ابحث باسم المريض/i);

    await user.type(input, "ali");

    await waitFor(() => {
      expect(patientService.getPatients).toHaveBeenCalledWith(
        expect.objectContaining({ search: "ali" }),
      );
    });

    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });
});
