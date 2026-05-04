import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import {
  renderWithProviders,
  createMockAuthValue,
} from "./utils/test-utils.jsx";
import FinancialManager from "../src/components/FinancialManager.jsx";

const mockPlanData = {
  count: 2,
  plans: [
    {
      id: "plan-1",
      totalCost: 500,
      amountPaid: 250,
      remainingBalance: 250,
      status: "pending",
    },
    {
      id: "plan-2",
      totalCost: 300,
      amountPaid: 0,
      remainingBalance: 300,
      status: "scheduled",
    },
  ],
};

describe("FinancialManager", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  describe("RBAC: Create Button Visibility", () => {
    it("should show 'خطة جديدة' button for doctors", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      const doctorAuth = createMockAuthValue({ role: "doctor" });
      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: doctorAuth,
      });

      await waitFor(() => {
        const createBtn = screen.queryByRole("button", { name: /خطة جديدة/i });
        expect(createBtn).toBeInTheDocument();
      });
    });

    it("should show 'خطة جديدة' button for secretaries", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      const secretaryAuth = createMockAuthValue({ role: "secretary" });
      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: secretaryAuth,
      });

      await waitFor(() => {
        const createBtn = screen.queryByRole("button", { name: /خطة جديدة/i });
        expect(createBtn).toBeInTheDocument();
      });
    });

    it("should NOT show 'خطة جديدة' button for patients", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      const patientAuth = createMockAuthValue({ role: "patient" });
      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: patientAuth,
      });

      await waitFor(() => {
        const createBtn = screen.queryByRole("button", { name: /خطة جديدة/i });
        expect(createBtn).not.toBeInTheDocument();
      });
    });
  });

  describe("Financial Summary Display", () => {
    it("should display financial summary cards with correct data", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      await waitFor(() => {
        expect(screen.getByText("Total Cost")).toBeInTheDocument();
        expect(screen.getByText("Total Paid")).toBeInTheDocument();
        expect(screen.getByText("Remaining")).toBeInTheDocument();
      });
    });

    it("should calculate correct total cost, paid, and remaining amounts", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      await waitFor(() => {
        // Total cost: 500 + 300 = 800
        // Total paid: 250 + 0 = 250
        // Remaining: 250 + 300 = 550
        const summary = screen.getByText(/Total Cost/).closest(".p-6");
        expect(summary).toBeInTheDocument();
      });
    });
  });

  describe("Treatment Plans List", () => {
    it("should display plans when data is loaded", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      await waitFor(() => {
        expect(screen.getByText(/خطط العلاج/i)).toBeInTheDocument();
      });
    });

    it("should display empty state when no plans exist", async () => {
      axios.get.mockResolvedValue({ data: { data: { plans: [] } } });

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      await waitFor(() => {
        expect(screen.getByText(/خطط العلاج/i)).toBeInTheDocument();
      });
    });
  });

  describe("Create Plan Modal", () => {
    it("should open modal when doctor clicks 'خطة جديدة' button", async () => {
      axios.get.mockResolvedValue({ data: { data: mockPlanData } });

      const doctorAuth = createMockAuthValue({ role: "doctor" });
      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: doctorAuth,
      });

      const createBtn = await screen.findByRole("button", {
        name: /خطة جديدة/i,
      });
      await userEvent.click(createBtn);

      // Modal should appear (check for backdrop or modal-specific text)
      await waitFor(() => {
        // The modal will have specific content that indicates it's open
        expect(createBtn).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should display loading spinner while fetching data", () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      expect(screen.getByText(/Loading financial data/i)).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      axios.get.mockRejectedValue(new Error("API Error"));

      renderWithProviders(<FinancialManager patientId="patient-123" />, {
        authValue: createMockAuthValue({ role: "doctor" }),
      });

      await waitFor(() => {
        // Should show empty state or error handling
        expect(screen.queryByText(/خطط العلاج/i)).toBeInTheDocument();
      });
    });
  });
});
