// backend/src/controllers/staffController.js
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, sql, like, and, or, desc, count } from "drizzle-orm";
import { hashPassword, generatePassword } from "../utils/password.js";
import { sendCredentialsEmail } from "../utils/email.js";
import {
  successResponse,
  errorResponse,
  createdResponse,
  paginatedResponse,
  notFoundResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";

/**
 * Normalize email to lowercase
 */
const normalizeEmail = (email) => email?.toLowerCase().trim();

const ALLOWED_SORT_FIELDS = {
  createdAt: users.createdAt,
  fullName: users.fullName,
  email: users.email,
  lastLogin: users.lastLogin,
  isActive: users.isActive,
};

/**
 * Get all staff with pagination and filters
 */
export const getAllStaff = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = [eq(users.role, "STAFF")];

    if (search) {
      whereConditions.push(
        or(
          like(sql`LOWER(${users.fullName})`, `%${search.toLowerCase()}%`),
          like(sql`LOWER(${users.email})`, `%${search.toLowerCase()}%`),
          like(users.phone, `%${search}%`)
        )
      );
    }

    if (status !== "") {
      whereConditions.push(eq(users.isActive, status === "active"));
    }

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(users)
      .where(and(...whereConditions));

    // Get staff data
    const orderColumn = ALLOWED_SORT_FIELDS[sortBy] || users.createdAt;
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const staffList = await db.query.users.findMany({
      where: and(...whereConditions),
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: orderDirection === "asc" ? sql`${orderColumn} ASC` : sql`${orderColumn} DESC`,
      limit: parseInt(limit),
      offset,
    });

    return paginatedResponse(res, staffList, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    logger.error("Get all staff error", error);
    next(error);
  }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "STAFF")),
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      return notFoundResponse(res, "Staff tidak ditemukan");
    }

    return successResponse(res, staff);
  } catch (error) {
    logger.error("Get staff by ID error", error);
    next(error);
  }
};

/**
 * Create new staff
 */
export const createStaff = async (req, res, next) => {
  try {
    const { email, fullName, phone } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(sql`LOWER(${users.email})`, normalizedEmail),
    });

    if (existingUser) {
      return errorResponse(res, "Email sudah terdaftar", 409);
    }

    // Generate secure password
    const plainPassword = generatePassword(12);
    const hashedPassword = await hashPassword(plainPassword);

    // Create staff
    const [newStaff] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        role: "STAFF",
        isActive: true,
        isEmailVerified: false,
      })
      .$returningId();

    // Get created staff
    const staff = await db.query.users.findFirst({
      where: eq(users.id, newStaff.id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send credentials email
    try {
      await sendCredentialsEmail(normalizedEmail, fullName, plainPassword);
      logger.info("Staff credentials email sent", { staffId: staff.id });
    } catch (emailError) {
      logger.error("Failed to send staff credentials email", emailError);
      // Don't fail the request if email fails
    }

    logger.security("Staff created", {
      staffId: staff.id,
      createdBy: req.user.userId,
    });

    return createdResponse(res, staff, "Staff berhasil dibuat. Password telah dikirim ke email.");
  } catch (error) {
    logger.error("Create staff error", error);
    next(error);
  }
};

/**
 * Update staff
 */
export const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, isActive } = req.validatedBody || req.body;

    // Check if staff exists
    const existingStaff = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "STAFF")),
    });

    if (!existingStaff) {
      return notFoundResponse(res, "Staff tidak ditemukan");
    }

    // Update staff
    await db
      .update(users)
      .set({
        fullName: fullName || existingStaff.fullName,
        phone: phone !== undefined ? phone : existingStaff.phone,
        isActive: isActive !== undefined ? isActive : existingStaff.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    // Get updated staff
    const updatedStaff = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info("Staff updated", {
      staffId: id,
      updatedBy: req.user.userId,
    });

    return successResponse(res, updatedStaff, "Staff berhasil diperbarui");
  } catch (error) {
    logger.error("Update staff error", error);
    next(error);
  }
};

/**
 * Toggle staff active status
 */
export const toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "STAFF")),
      columns: {
        id: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!staff) {
      return notFoundResponse(res, "Staff tidak ditemukan");
    }

    const newStatus = !staff.isActive;

    await db
      .update(users)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    logger.security(`Staff ${newStatus ? "activated" : "deactivated"}`, {
      staffId: id,
      updatedBy: req.user.userId,
    });

    return successResponse(
      res,
      { id: parseInt(id), isActive: newStatus },
      `Staff berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`
    );
  } catch (error) {
    logger.error("Toggle staff status error", error);
    next(error);
  }
};

/**
 * Delete staff
 */
export const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const staff = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "STAFF")),
    });

    if (!staff) {
      return notFoundResponse(res, "Staff tidak ditemukan");
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.userId) {
      return errorResponse(res, "Anda tidak dapat menghapus akun sendiri", 403);
    }

    await db.delete(users).where(eq(users.id, parseInt(id)));

    logger.security("Staff deleted", {
      staffId: id,
      deletedBy: req.user.userId,
    });

    return successResponse(res, null, "Staff berhasil dihapus");
  } catch (error) {
    logger.error("Delete staff error", error);
    next(error);
  }
};

/**
 * Reset staff password
 */
export const resetStaffPassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "STAFF")),
    });

    if (!staff) {
      return notFoundResponse(res, "Staff tidak ditemukan");
    }

    // Generate new password
    const newPassword = generatePassword(12);
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    // Send email with new password
    try {
      await sendCredentialsEmail(staff.email, staff.fullName, newPassword);
    } catch (emailError) {
      logger.error("Failed to send password reset email", emailError);
    }

    logger.security("Staff password reset", {
      staffId: id,
      resetBy: req.user.userId,
    });

    return successResponse(res, null, "Password berhasil direset. Password baru telah dikirim ke email staff.");
  } catch (error) {
    logger.error("Reset staff password error", error);
    next(error);
  }
};

/**
 * Get staff statistics
 */
export const getStaffStats = async (req, res, next) => {
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "STAFF"));

    const [{ active }] = await db
      .select({ active: count() })
      .from(users)
      .where(and(eq(users.role, "STAFF"), eq(users.isActive, true)));

    const [{ inactive }] = await db
      .select({ inactive: count() })
      .from(users)
      .where(and(eq(users.role, "STAFF"), eq(users.isActive, false)));

    // Get recent logins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [{ recentLogins }] = await db
      .select({ recentLogins: count() })
      .from(users)
      .where(
        and(
          eq(users.role, "STAFF"),
          sql`${users.lastLogin} >= ${thirtyDaysAgo}`
        )
      );

    return successResponse(res, {
      total,
      active,
      inactive,
      recentLogins,
    });
  } catch (error) {
    logger.error("Get staff stats error", error);
    next(error);
  }
};
