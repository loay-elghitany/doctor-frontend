export const formatDateSafe = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};
