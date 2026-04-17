export const normalizeStatus = (status) => {
  if (status === null || status === undefined) return "unknown";
  let normalized = String(status).trim().toLowerCase();
  normalized = normalized.replace(/\s+/g, "_").replace(/-/g, "_");
  if (normalized === "") return "unknown";
  return normalized;
};
