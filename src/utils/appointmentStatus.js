export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULE_PROPOSED: "reschedule_proposed",
  REJECTED: "rejected",
};

export const STATUS_TAB_ORDER = [
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.RESCHEDULE_PROPOSED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.REJECTED,
];

export const NORMALIZE_STATUS = {
  [APPOINTMENT_STATUS.SCHEDULED]: APPOINTMENT_STATUS.CONFIRMED,
  [APPOINTMENT_STATUS.CONFIRMED]: APPOINTMENT_STATUS.CONFIRMED,
};

export const normalizeStatus = (status) => {
  if (!status || typeof status !== "string") return status;
  return NORMALIZE_STATUS[status] || status;
};

export const buildStatusTabs = (appointments) => {
  const counts = appointments.reduce((acc, appointment) => {
    const status = normalizeStatus(appointment?.status);
    if (!status) return acc;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { id: "all", label: "All" },
    ...STATUS_TAB_ORDER.filter((status) => counts[status] > 0).map(
      (status) => ({
        id: status,
        label:
          status === APPOINTMENT_STATUS.CONFIRMED
            ? "Confirmed"
            : status === APPOINTMENT_STATUS.PENDING
              ? "Pending"
              : status === APPOINTMENT_STATUS.RESCHEDULE_PROPOSED
                ? "Awaiting Reschedule"
                : status === APPOINTMENT_STATUS.COMPLETED
                  ? "Completed"
                  : status === APPOINTMENT_STATUS.CANCELLED
                    ? "Cancelled"
                    : status,
      }),
    ),
  ];

  return tabs;
};
