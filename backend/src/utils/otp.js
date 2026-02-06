import crypto from "crypto";
import { logger } from "./logger.js";

// Configuration
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const MAX_OTP_ATTEMPTS = 3;

// In-memory store for OTP attempts (use Redis in production)
const otpAttempts = new Map();

/**
 * Generate cryptographically secure OTP
 * @returns {string} OTP code
 */
export const generateOTP = () => {
  // Generate random number with crypto
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const randomNum = crypto.randomInt(min, max + 1);
  
  return randomNum.toString().padStart(OTP_LENGTH, "0");
};

/**
 * Calculate OTP expiry time
 * @returns {Date} Expiry timestamp
 */
export const getOTPExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

/**
 * Track OTP attempts for rate limiting
 * @param {string} identifier - User identifier (email/userId)
 * @returns {boolean} Whether attempt is allowed
 */
const trackAttempt = (identifier) => {
  const now = Date.now();
  const key = `otp_attempt:${identifier}`;
  
  const attempts = otpAttempts.get(key) || [];
  
  // Clean old attempts (older than 15 minutes)
  const validAttempts = attempts.filter(
    (time) => now - time < 15 * 60 * 1000
  );
  
  if (validAttempts.length >= MAX_OTP_ATTEMPTS) {
    return false;
  }
  
  validAttempts.push(now);
  otpAttempts.set(key, validAttempts);
  
  return true;
};

/**
 * Clear OTP attempts
 * @param {string} identifier - User identifier
 */
const clearAttempts = (identifier) => {
  const key = `otp_attempt:${identifier}`;
  otpAttempts.delete(key);
};

/**
 * Verify OTP with comprehensive checks
 * @param {string} storedOTP - Stored OTP from database
 * @param {string} inputOTP - OTP entered by user
 * @param {Date} expiryTime - OTP expiry time
 * @param {string} identifier - User identifier for tracking
 * @returns {Object} { valid: boolean, message: string }
 */
export const verifyOTP = (storedOTP, inputOTP, expiryTime, identifier = null) => {
  // Check if OTP exists
  if (!storedOTP || !expiryTime) {
    return { valid: false, message: "OTP tidak ditemukan. Silakan minta OTP baru." };
  }

  // Check attempts if identifier provided
  if (identifier && !trackAttempt(identifier)) {
    logger.security("Too many OTP attempts", { identifier });
    return {
      valid: false,
      message: "Terlalu banyak percobaan. Silakan minta OTP baru.",
    };
  }

  // Check expiry
  if (new Date() > new Date(expiryTime)) {
    return { valid: false, message: "OTP telah kedaluwarsa. Silakan minta OTP baru." };
  }

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedOTP.padStart(OTP_LENGTH, "0")),
    Buffer.from(inputOTP.padStart(OTP_LENGTH, "0"))
  );

  if (!isValid) {
    return { valid: false, message: "OTP tidak valid" };
  }

  // Clear attempts on success
  if (identifier) {
    clearAttempts(identifier);
  }

  return { valid: true, message: "OTP valid" };
};

/**
 * Hash OTP for storage (optional extra security)
 * @param {string} otp - OTP to hash
 * @returns {string} Hashed OTP
 */
export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} Whether format is valid
 */
export const isValidOTPFormat = (otp) => {
  if (!otp || typeof otp !== "string") return false;
  if (otp.length !== OTP_LENGTH) return false;
  return /^\d+$/.test(otp);
};
