import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IntakeFormViewModal } from "../src/components/IntakeFormViewModal";
import doctorService from "../src/services/doctorService";

vi.mock("../src/services/doctorService", () => ({
  default: {
    getDoctorProfile: vi.fn(),
  },
}));

describe("IntakeFormViewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses doctor custom question labels when the appointment payload is missing them", async () => {
    doctorService.getDoctorProfile.mockResolvedValue({
      data: {
        data: {
          customIntakeQuestions: [
            { id: "bloodPressure", questionText: "ضغط الدم", type: "text" },
            { id: "smoking", questionText: "هل المريض يدخن؟", type: "boolean" },
          ],
        },
      },
    });

    render(
      <IntakeFormViewModal
        isOpen
        onClose={() => {}}
        appointment={{
          intakeForm: {
            vitals: { bloodPressure: "120/80" },
            medicalHistory: { smoking: true },
          },
          doctorId: { _id: "doc-1", name: "Dr. Test" },
        }}
      />,
    );

    expect(await screen.findByText("ضغط الدم")).toBeInTheDocument();
    expect(await screen.findByText("هل المريض يدخن؟")).toBeInTheDocument();
    expect(await screen.findByText("نعم")).toBeInTheDocument();
  });
});
