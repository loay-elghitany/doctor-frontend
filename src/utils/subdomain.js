const RESERVED_HOSTS = new Set(["localhost", "127.0.0.1"]);

const normalizeHost = (host = "") => String(host).toLowerCase().split(":")[0];

/**
 * Get the configured main domain from environment variables.
 * In production, this should be set to something like 'mydoc90.com'
 * In development, it might be 'localhost:5173'
 */
export const getMainDomain = () => {
  const envDomain = import.meta.env.VITE_MAIN_DOMAIN;

  // Log in production for debugging
  if (import.meta.env.PROD && !envDomain) {
    console.warn(
      "WARNING: VITE_MAIN_DOMAIN environment variable is not set. " +
        "Subdomain detection may not work correctly.",
    );
  }

  return normalizeHost(envDomain || "");
};

/**
 * Extract tenant subdomain from hostname.
 * Handles cases like:
 * - loay-ahmed.mydoc90.com -> loay-ahmed
 * - doctor1.clinic.vercel.app -> doctor1
 * - localhost:5173 -> null (reserved)
 */
export const getTenantSubdomain = (host = window.location.hostname) => {
  const cleanHost = normalizeHost(host);

  // Skip reserved hosts (localhost, etc.)
  if (!cleanHost || RESERVED_HOSTS.has(cleanHost)) {
    return null;
  }

  const configuredMainDomain = getMainDomain();

  // If we have a configured main domain, use it for precise matching
  if (configuredMainDomain) {
    // Check if current host ends with .mainDomain
    if (cleanHost.endsWith(`.${configuredMainDomain}`)) {
      // Extract subdomain by removing .mainDomain suffix
      const subdomain = cleanHost.slice(0, -(configuredMainDomain.length + 1));
      return subdomain || null;
    }

    // Handle edge case where host equals main domain (no subdomain)
    if (cleanHost === configuredMainDomain) {
      return null;
    }
  }

  // Fallback: generic subdomain detection for unknown domains
  // This handles cases where VITE_MAIN_DOMAIN might not be set correctly
  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    // For domains like subdomain.example.com, extract first part
    const potentialSubdomain = parts[0];

    // Validate it's not a common TLD or www
    const invalidSubdomains = new Set(["www", "com", "org", "net", "co", "io"]);
    if (!invalidSubdomains.has(potentialSubdomain)) {
      return potentialSubdomain;
    }
  }

  return null;
};

export const isTenantSubdomain = (host = window.location.hostname) =>
  Boolean(getTenantSubdomain(host));
