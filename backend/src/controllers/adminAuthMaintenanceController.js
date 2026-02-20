import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import { hashPassword, generatePassword } from "../utils/password.js";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const isLikelyBcryptHash = (value) => {
  if (typeof value !== "string") return false;
  // Typical bcrypt hashes start with $2a$, $2b$, $2y$ and are ~60 chars
  if (!value.startsWith("$2")) return false;
  return value.length >= 50;
};

// =====================================================
// ADMIN: Audit users with invalid password hashes
// =====================================================
export const auditInvalidPasswords = async (req, res, next) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit || "200", 10) || 200, 1000);

    const rows = await db.execute(
      sql`SELECT id, email, role, full_name AS fullName, password, is_active AS isActive, updated_at AS updatedAt
          FROM users
          ORDER BY updated_at DESC
          LIMIT ${limit}`
    );

    const invalid = (rows || [])
      .filter((u) => !isLikelyBcryptHash(u.password))
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        isActive: u.isActive,
        updatedAt: u.updatedAt,
      }));

    return successResponse(res, {
      scanned: (rows || []).length,
      invalidCount: invalid.length,
      invalid,
    });
  } catch (error) {
    logger.error("Audit invalid passwords error", error);
    next(error);
  }
};

// =====================================================
// ADMIN: Reset a user's password
// =====================================================
export const resetUserPassword = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return errorResponse(res, "User ID tidak valid", 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return notFoundResponse(res, "User tidak ditemukan");
    }

    const newPassword = generatePassword(12);
    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    logger.security("Admin reset user password", {
      targetUserId: id,
      targetEmail: user.email,
      resetBy: req.user?.userId,
    });

    // NOTE: We intentionally do NOT email here because email service behavior varies
    // across environments. If you want, we can wire sendCredentialsEmail like staff reset.

    return successResponse(
      res,
      {
        userId: user.id,
        email: user.email,
        temporaryPassword: newPassword,
      },
      "Password berhasil direset"
    );
  } catch (error) {
    logger.error("Reset user password error", error);
    next(error);
  }
};
