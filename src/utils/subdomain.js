const RESERVED_HOSTS = new Set(["localhost", "127.0.0.1"]);

const normalizeHost = (host = "") => String(host).toLowerCase().split(":")[0];

export const getMainDomain = () => normalizeHost(import.meta.env.VITE_MAIN_DOMAIN || "");

export const getTenantSubdomain = (host = window.location.hostname) => {
  const cleanHost = normalizeHost(host);
  if (!cleanHost || RESERVED_HOSTS.has(cleanHost)) {
    return null;
  }

  const configuredMainDomain = getMainDomain();
  if (configuredMainDomain && cleanHost.endsWith(`.${configuredMainDomain}`)) {
    return cleanHost.slice(0, -(configuredMainDomain.length + 1)) || null;
  }

  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    return parts[0] || null;
  }

  return null;
};

export const isTenantSubdomain = (host = window.location.hostname) =>
  Boolean(getTenantSubdomain(host));
