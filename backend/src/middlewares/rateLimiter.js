import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

const RATE_LIMIT_DISABLED = process.env.DISABLE_RATE_LIMIT === "true";

const normalizeEmail = (value) =>
  typeof value === "string" ? value.toLowerCase().trim() : "";

const getClientIp = (req) => req.ip || req.connection?.remoteAddress || "unknown";

const parseWindowMs = (envValue, fallbackMinutes) => {
  const parsedMinutes = Number.parseInt(envValue || "", 10);
  const minutes = Number.isInteger(parsedMinutes) && parsedMinutes > 0
    ? parsedMinutes
    : fallbackMinutes;

  return minutes * 60 * 1000;
};

const parseMaxRequests = (envValue, fallbackValue) => {
  const parsedValue = Number.parseInt(envValue || "", 10);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallbackValue;
};

const getRetryAfterSeconds = (req, fallbackWindowMs) => {
  const resetTime = req.rateLimit?.resetTime;
  const resetTimeMs =
    resetTime instanceof Date
      ? resetTime.getTime()
      : typeof resetTime === "number"
        ? resetTime
        : Number.NaN;

  if (Number.isFinite(resetTimeMs)) {
    return Math.max(1, Math.ceil((resetTimeMs - Date.now()) / 1000));
  }

  return Math.max(1, Math.ceil(fallbackWindowMs / 1000));
};

const createRateLimitHandler = ({
  code,
  message,
  logMessage,
  windowMs,
  logDetails,
}) => {
  return (req, res) => {
    const retryAfter = getRetryAfterSeconds(req, windowMs);

    logger.security(logMessage, {
      ip: getClientIp(req),
      path: req.originalUrl || req.path,
      userAgent: req.get("user-agent"),
      ...(typeof logDetails === "function" ? logDetails(req) : {}),
    });

    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      success: false,
      code,
      message,
      retryAfter,
    });
  };
};

const createLimiter = ({
  windowMs,
  max,
  keyGenerator,
  skipSuccessfulRequests = false,
  message,
  code = "RATE_LIMIT_EXCEEDED",
  logMessage = "Rate limit exceeded",
  logDetails,
}) =>
  rateLimit({
    windowMs,
    max,
    skip: () => RATE_LIMIT_DISABLED,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      code,
      message,
    },
    handler: createRateLimitHandler({
      code,
      message,
      logMessage,
      windowMs,
      logDetails,
    }),
  });

export const authenticatedApiLimiter = createLimiter({
  windowMs: parseWindowMs(process.env.RATE_LIMIT_WINDOW, 15),
  max: parseMaxRequests(process.env.RATE_LIMIT_MAX, 300),
  message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
  logMessage: "Authenticated API rate limit exceeded",
});

export const publicReadLimiter = createLimiter({
  windowMs: parseWindowMs(process.env.PUBLIC_RATE_LIMIT_WINDOW, 15),
  max: parseMaxRequests(process.env.PUBLIC_RATE_LIMIT_MAX, 600),
  message: "Terlalu banyak permintaan publik. Silakan coba lagi nanti.",
  logMessage: "Public API rate limit exceeded",
});

export const authLimiter = createLimiter({
  windowMs: parseWindowMs(process.env.AUTH_RATE_LIMIT_WINDOW, 15),
  max: parseMaxRequests(process.env.AUTH_RATE_LIMIT_MAX, 5),
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = normalizeEmail(req.body?.email);
    return email ? `${ip}:${email}` : ip;
  },
  skipSuccessfulRequests: true,
  message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  logMessage: "Auth rate limit exceeded",
  logDetails: (req) => ({
    email: normalizeEmail(req.body?.email),
  }),
});

export const otpLimiter = createLimiter({
  windowMs: parseWindowMs(process.env.OTP_RATE_LIMIT_WINDOW, 5),
  max: parseMaxRequests(process.env.OTP_RATE_LIMIT_MAX, 3),
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = normalizeEmail(req.body?.email);
    return email ? `${ip}:${email}` : ip;
  },
  message: "Terlalu banyak percobaan OTP. Silakan minta OTP baru.",
  logMessage: "OTP rate limit exceeded",
  logDetails: (req) => ({
    email: normalizeEmail(req.body?.email),
  }),
});

export const createAccountLimiter = createLimiter({
  windowMs: parseWindowMs(process.env.CREATE_ACCOUNT_RATE_LIMIT_WINDOW, 60),
  max: parseMaxRequests(process.env.CREATE_ACCOUNT_RATE_LIMIT_MAX, 5),
  message: "Terlalu banyak pendaftaran. Silakan coba lagi nanti.",
  logMessage: "Account creation rate limit exceeded",
});

export const apiLimiter = authenticatedApiLimiter;
