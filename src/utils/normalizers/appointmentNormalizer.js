import { normalizeStatus } from "../status/normalizeStatus";

const normalizePerson = (person) => {
  if (!person) {
    return { _id: "", name: "", email: "" };
  }

  if (typeof person === "string") {
    return { _id: person, name: "", email: "" };
  }

  return {
    _id: String(person._id ?? person.id ?? "") || "",
    name: String(person.name ?? person.fullName ?? "") || "",
    email: String(person.email ?? person.emailAddress ?? "") || "",
  };
};

const getValidDate = (value) => {
  if (!value) return null;
  const rawDate = typeof value === "string" ? value.trim() : value;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
};

export const normalizeAppointment = (rawAppointment) => {
  const appointment = rawAppointment || {};

  const normalized = {
    ...appointment,
    _id: String(appointment._id ?? appointment.id ?? "") || "",
    date: getValidDate(
      appointment.date ??
        appointment.appointmentDate ??
        appointment.scheduledAt,
    ),
    timeSlot: String(
      appointment.timeSlot ?? appointment.slot ?? appointment.time ?? "—",
    ),
    status: normalizeStatus(
      appointment.status ?? appointment.state ?? "unknown",
    ),
    notes: String(appointment.notes ?? appointment.note ?? "") || "",
    patientId: normalizePerson(appointment.patientId ?? appointment.patient),
    doctorId: normalizePerson(appointment.doctorId ?? appointment.doctor),
    patient: normalizePerson(appointment.patient ?? appointment.patientId),
    doctor: normalizePerson(appointment.doctor ?? appointment.doctorId),
  };

  return normalized;
};

export const normalizeAppointments = (rawArray) => {
  if (Array.isArray(rawArray)) {
    return rawArray.map(normalizeAppointment);
  }

  if (rawArray && typeof rawArray === "object") {
    if (Array.isArray(rawArray.appointments)) {
      return rawArray.appointments.map(normalizeAppointment);
    }

    return [normalizeAppointment(rawArray)];
  }

  return [];
};
