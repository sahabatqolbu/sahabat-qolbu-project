import crypto from "crypto";

// =====================================================
// GENERATE OTP
// =====================================================
export const generateOTP = () => {
  const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
  const otp = crypto
    .randomInt(0, Math.pow(10, otpLength))
    .toString()
    .padStart(otpLength, "0");
  return otp;
};

// =====================================================
// CALCULATE OTP EXPIRY
// =====================================================
export const getOTPExpiry = () => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

// =====================================================
// VERIFY OTP
// =====================================================
export const verifyOTP = (storedOTP, inputOTP, expiryTime) => {
  if (!storedOTP || !expiryTime) {
    return { valid: false, message: "OTP tidak ditemukan" };
  }

  if (new Date() > new Date(expiryTime)) {
    return { valid: false, message: "OTP telah kedaluwarsa" };
  }

  if (storedOTP !== inputOTP) {
    return { valid: false, message: "OTP tidak valid" };
  }

  return { valid: true, message: "OTP valid" };
};
