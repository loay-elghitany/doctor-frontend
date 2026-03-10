/**
 * Frontend debug logging utility
 * Controls verbosity based on development mode
 */

const DEBUG = import.meta.env.DEV === true;

export const debugLog = (context, message, data = null) => {
  if (!DEBUG) return;

  const timestamp = new Date().toISOString();
  const prefix = `%c[${timestamp}] [${context}]`;
  const style = "color: #0066cc; font-weight: bold;";

  if (data) {
    console.log(prefix, style, message, data);
  } else {
    console.log(prefix, style, message);
  }
};

export const debugError = (context, message, error = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `%c[${timestamp}] [${context}]`;
  const style = "color: #cc0000; font-weight: bold;";

  if (error) {
    console.error(prefix, style, message, error);
  } else {
    console.error(prefix, style, message);
  }
};

export default { debugLog, debugError };
