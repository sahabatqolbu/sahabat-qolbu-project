/**
 * Centralized logging utility
 * Automatically disables logs in production unless explicitly enabled
 */

const isProduction = process.env.NODE_ENV === "production";
const enableLogs = process.env.ENABLE_LOGS === "true" || !isProduction;

/**
 * Format log message with timestamp
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaStr}`.trim();
};

/**
 * Safely serialize objects for logging (removes sensitive fields)
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  
  const sensitiveFields = ["password", "token", "otp", "secret", "apiKey", "authorization"];
  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "***REDACTED***";
    }
  }
  
  return sanitized;
};

export const logger = {
  /**
   * Log info message
   */
  info: (message, meta = {}) => {
    if (!enableLogs) return;
    console.log(formatMessage("info", message, sanitize(meta)));
  },

  /**
   * Log error message
   */
  error: (message, error = null, meta = {}) => {
    // Always log errors, even when regular logs are disabled.
    const errorMeta = error ? { error: error.message, stack: error.stack } : {};
    console.error(formatMessage("error", message, { ...sanitize(meta), ...errorMeta }));
  },

  /**
   * Log warning message
   */
  warn: (message, meta = {}) => {
    if (!enableLogs) return;
    console.warn(formatMessage("warn", message, sanitize(meta)));
  },

  /**
   * Log debug message (only in development)
   */
  debug: (message, meta = {}) => {
    if (isProduction) return;
    console.log(formatMessage("debug", message, sanitize(meta)));
  },

  /**
   * Log security events (always logged)
   */
  security: (message, meta = {}) => {
    console.warn(formatMessage("SECURITY", message, sanitize(meta)));
  },
};
