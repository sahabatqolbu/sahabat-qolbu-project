import { logger } from "./logger.js";

const isEnabled = process.env.ERROR_TRACKING_ENABLED === "true";
const provider = process.env.ERROR_TRACKING_PROVIDER || "log-only";

const sanitizeEvent = (event = {}) => {
  const clone = { ...event };

  if (clone.headers && typeof clone.headers === "object") {
    const headers = { ...clone.headers };
    if ("authorization" in headers) headers.authorization = "***REDACTED***";
    if ("cookie" in headers) headers.cookie = "***REDACTED***";
    clone.headers = headers;
  }

  if (clone.user && typeof clone.user === "object") {
    const user = { ...clone.user };
    if ("email" in user) user.email = "***REDACTED***";
    clone.user = user;
  }

  return clone;
};

export const captureErrorEvent = ({
  error,
  requestId,
  path,
  method,
  ip,
  userId,
  code,
  status,
}) => {
  const payload = sanitizeEvent({
    provider,
    requestId,
    path,
    method,
    ip,
    user: userId ? { id: userId } : undefined,
    code,
    status,
    error: error?.message || "Unknown error",
  });

  logger.error("Error tracker event", null, payload);

  if (!isEnabled) {
    return;
  }

  // Placeholder adapter for future Sentry/NewRelic integration.
  // Keep side effects minimal until provider credentials are provisioned.
  logger.info("Error tracker provider hook invoked", {
    provider,
    requestId,
    status,
    code,
  });
};
