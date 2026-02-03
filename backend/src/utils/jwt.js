import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// =====================================================
// GENERATE TOKEN
// =====================================================
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// =====================================================
// VERIFY TOKEN
// =====================================================
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Token tidak valid atau sudah kedaluwarsa");
  }
};

// =====================================================
// DECODE TOKEN (without verification)
// =====================================================
export const decodeToken = (token) => {
  return jwt.decode(token);
};
