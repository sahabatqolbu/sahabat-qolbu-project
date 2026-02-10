// backend/src/config/security.js
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { logger } from "../utils/logger.js";

/**
 * Security Configuration
 * Centralized security settings for the application
 */

// Allowed origins for CORS
export const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,
].filter(Boolean); // Remove undefined/null

// Add production domains if in production
if (process.env.NODE_ENV === "production") {
  allowedOrigins.push("https://sahabatqolbu.com");
  allowedOrigins.push("https://dashboard.sahabatqolbu.com");
}

/**
 * CORS Configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.security("CORS blocked request", { origin });
    callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
  ],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400, // 24 hours
};

export const isTrustedOrigin = (originOrReferer) => {
  if (!originOrReferer) return false;

  try {
    const parsed = new URL(originOrReferer);
    const normalizedOrigin = parsed.origin;
    return allowedOrigins.includes(normalizedOrigin);
  } catch {
    return false;
  }
};

/**
 * Helmet Configuration
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
  dnsPrefetchControl: {
    allow: false,
  },
  frameguard: {
    action: "deny",
  },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
  xssFilter: true,
};

/**
 * Rate Limiting Configurations
 */
export const rateLimitConfigs = {
  // General API limit
  general: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
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
      });
      res.status(429).json({
        success: false,
        message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      });
    },
  },

  // Auth endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      logger.security("Auth rate limit exceeded", {
        ip: req.ip,
        email: req.body?.email,
      });
      res.status(429).json({
        success: false,
        message: "Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.",
      });
    },
  },

  // OTP endpoints (strictest)
  otp: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    handler: (req, res) => {
      logger.security("OTP rate limit exceeded", {
        ip: req.ip,
        email: req.body?.email,
      });
      res.status(429).json({
        success: false,
        message: "Terlalu banyak percobaan OTP. Silakan minta OTP baru.",
      });
    },
  },
};

/**
 * Create rate limiters
 */
export const createRateLimiter = (config) => rateLimit(config);

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export const requestId = (req, res, next) => {
  req.id =
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader("X-Request-ID", req.id);
  next();
};

/**
 * Security headers middleware
 * Additional security headers
 */
export const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By
  res.removeHeader("X-Powered-By");

  // Add additional headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  next();
};

/**
 * IP whitelist check (for admin endpoints)
 */
export const ipWhitelist = (allowedIps = []) => {
  return (req, res, next) => {
    if (allowedIps.length === 0) return next();

    const clientIp = req.ip || req.connection.remoteAddress;

    if (!allowedIps.includes(clientIp)) {
      logger.security("IP whitelist blocked", {
        ip: clientIp,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        message: "Akses ditolak dari IP ini",
      });
    }

    next();
  };
};
