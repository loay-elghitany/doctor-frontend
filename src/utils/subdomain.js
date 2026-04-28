const RESERVED_HOSTS = new Set(["localhost", "127.0.0.1"]);

const normalizeHost = (host = "") => String(host).toLowerCase().split(":")[0];

/**
 * Get the configured main domain from environment variables.
 * In production, this should be set to something like 'mydoc90.com'
 * In development, it might be 'localhost'
 */
export const getMainDomain = () => {
  const envDomain = import.meta.env.VITE_MAIN_DOMAIN;

  if (envDomain) {
    return normalizeHost(envDomain);
  }

  // Fallback: Extract main domain from current host
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) {
    // Return the last two parts as the main domain (e.g., mydoc90.com)
    return parts.slice(-2).join(".");
  }
  
  return normalizeHost(host);
};

/**
 * Extract tenant subdomain from hostname.
 * Handles cases like:
 * - doctorname.mydoc90.com -> doctorname
 * - www.mydoc90.com -> null
 * - mydoc90.com -> null
 * - localhost -> null
 */
export const getTenantSubdomain = (host = window.location.hostname) => {
  const cleanHost = normalizeHost(host);

  // تخطي الدومينات الأساسية المباشرة
  if (!cleanHost || RESERVED_HOSTS.has(cleanHost)) {
    return null;
  }

  const mainDomain = getMainDomain();

  // الطريقة الأذكى: هل الرابط ينتهي بالدومين الأساسي؟
  // (مثال: هل loay.localhost تنتهي بـ .localhost ؟)
  if (cleanHost.endsWith(`.${mainDomain}`)) {
    const subdomain = cleanHost.replace(`.${mainDomain}`, "");
    
    if (subdomain && subdomain !== "www") {
      return subdomain;
    }
  }

  // خط الدفاع الثاني (نفس كودك القديم للإنتاج تحسباً لأي خطأ)
  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
};

export const isTenantSubdomain = (host = window.location.hostname) =>
  Boolean(getTenantSubdomain(host));
