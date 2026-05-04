import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "./utils/test-utils.jsx";
import { SecretaryAppointmentsList } from "../src/pages/SecretaryAppointmentsList.jsx";

const appointmentMock = {
  _id: "appointment-1",
  patientId: {
    name: "Patient One",
    email: "patient.one@example.com",
  },
  date: "2026-08-01T09:00:00Z",
  timeSlot: "09:00",
  notes: "Annual checkup",
  status: "scheduled",
};

describe("SecretaryAppointmentsList", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.delete.mockReset();
  });

  it("renders action buttons and calls the cancel endpoint when Cancel is clicked", async () => {
    axios.get.mockResolvedValue({ data: { data: [appointmentMock] } });
    axios.delete.mockResolvedValue({
      data: { data: { ...appointmentMock, status: "cancelled" } },
    });

    renderWithProviders(<SecretaryAppointmentsList />);

    expect(await screen.findByText("Patient One")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/doctor-appointments/appointment-1",
      );
    });

    expect(
      await screen.findByText("Appointment cancelled successfully."),
    ).toBeInTheDocument();
  });
});
