export const formatDateSafe = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  return new Date(dateValue).toLocaleDateString("ar-EG", {
    calendar: "gregory",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
