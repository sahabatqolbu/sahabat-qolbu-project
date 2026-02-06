import { verifyToken, extractToken } from "../utils/jwt.js";
import { unauthorizedResponse } from "../utils/response.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { logger } from "../utils/logger.js";

/**
 * JWT Authentication Middleware
 * Validates JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractToken(req.headers.authorization);

    if (!token) {
      logger.security("Authentication failed - no token", {
        ip: req.ip,
        path: req.path,
      });
      return unauthorizedResponse(res, "Token tidak ditemukan. Silakan login kembali.");
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      logger.security("Authentication failed - invalid token", {
        ip: req.ip,
        path: req.path,
        error: error.message,
      });
      return unauthorizedResponse(res, error.message);
    }

    // Get user from database (select only needed fields)
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phone: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      logger.security("Authentication failed - user not found", {
        userId: decoded.userId,
        ip: req.ip,
      });
      return unauthorizedResponse(res, "User tidak ditemukan");
    }

    if (!user.isActive) {
      logger.security("Authentication failed - inactive account", {
        userId: user.id,
        ip: req.ip,
      });
      return unauthorizedResponse(res, "Akun Anda telah dinonaktifkan. Hubungi admin.");
    }

    // Attach user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  } catch (error) {
    logger.error("Authentication middleware error", error, {
      path: req.path,
      ip: req.ip,
    });
    return unauthorizedResponse(res, "Terjadi kesalahan saat autentikasi");
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};
