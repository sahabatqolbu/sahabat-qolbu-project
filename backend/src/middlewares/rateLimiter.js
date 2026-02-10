import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Rate limiting configurations
 */

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
  max:
    parseInt(process.env.RATE_LIMIT_MAX) || (isDevelopment ? 10000 : 300),
  skip: () => isDevelopment,
  message: {
    success: false,
    message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      userAgent: req.get("user-agent"),
    });
    res.status(429).json({
      success: false,
      message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.security("Auth rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.",
      retryAfter: 15 * 60, // 15 minutes in seconds
    });
  },
});

// OTP specific limiter (stricter)
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts
  message: {
    success: false,
    message: "Terlalu banyak percobaan OTP. Silakan minta OTP baru.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security("OTP rate limit exceeded", {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan OTP. Silakan minta OTP baru.",
      retryAfter: 5 * 60,
    });
  },
});

// Create account limiter
export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 accounts per hour
  message: {
    success: false,
    message: "Terlalu banyak pendaftaran. Silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security("Account creation rate limit exceeded", {
      ip: req.ip,
    });
    res.status(429).json({
      success: false,
      message: "Terlalu banyak pendaftaran. Silakan coba lagi dalam 1 jam.",
      retryAfter: 60 * 60,
    });
  },
});
