import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12; // Increased from 10 for better security

// =====================================================
// HASH PASSWORD
// =====================================================
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// =====================================================
// COMPARE PASSWORD
// =====================================================
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// =====================================================
// GENERATE SECURE PASSWORD
// Uses crypto for cryptographically secure random generation
// =====================================================
export const generatePassword = (length = 12) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const charset = uppercase + lowercase + numbers + special;

  // Ensure minimum requirements
  const password = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
  ];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password.push(charset[crypto.randomInt(0, charset.length)]);
  }

  // Fisher-Yates shuffle for randomness
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};

// =====================================================
// VALIDATE PASSWORD STRENGTH
// Returns { valid: boolean, message: string }
// =====================================================
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const maxLength = 128;

  if (!password || password.length < minLength) {
    return {
      valid: false,
      message: `Password minimal ${minLength} karakter`,
    };
  }

  if (password.length > maxLength) {
    return {
      valid: false,
      message: `Password maksimal ${maxLength} karakter`,
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const missing = [];
  if (!hasUppercase) missing.push("huruf besar");
  if (!hasLowercase) missing.push("huruf kecil");
  if (!hasNumbers) missing.push("angka");
  if (!hasSpecial) missing.push("karakter khusus (!@#$%^&*)");

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Password harus mengandung: ${missing.join(", ")}`,
    };
  }

  // Check for common passwords (basic list)
  const commonPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      valid: false,
      message: "Password terlalu umum. Gunakan kombinasi yang lebih kuat.",
    };
  }

  return { valid: true, message: "Password kuat" };
};
