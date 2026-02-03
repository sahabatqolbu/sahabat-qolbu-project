// backend/src/middlewares/authMiddleware.js
import { verifyToken } from "../utils/jwt.js";
import { unauthorizedResponse } from "../utils/response.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

// =====================================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================================
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorizedResponse(res, "Token tidak ditemukan");
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database using Drizzle
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    if (!user) {
      return unauthorizedResponse(res, "User tidak ditemukan");
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, "Akun Anda telah dinonaktifkan");
    }

    // Attach user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    next();
  } catch (error) {
    return unauthorizedResponse(res, error.message);
  }
};
