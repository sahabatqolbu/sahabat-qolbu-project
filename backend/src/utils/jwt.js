import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Validate JWT secret on startup
if (!JWT_SECRET) {
  logger.error("❌ JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  logger.error("❌ JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token sudah kedaluwarsa. Silakan login kembali.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Token tidak valid");
    }
    throw new Error("Token tidak valid atau sudah kedaluwarsa");
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token
 */
export const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};
