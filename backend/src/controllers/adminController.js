// backend/src/controllers/adminController.js

import { db } from "../db/index.js";
import { users, jamaahData } from "../db/schema.js";
import { eq, like, or, and, sql } from "drizzle-orm";
import { sendCredentialsEmail } from "../utils/email.js";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ✅ HELPER: Generate Random Password
const generatePassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

// ✅ HELPER: Generate Booking Number
const generateBookingNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Format: SQ-YYYYMMDD-XXXX (contoh: SQ-20250117-0001)
  const prefix = `SQ-${datePrefix}`;

  // Cari booking number terakhir hari ini
  const lastBooking = await db.query.jamaahData.findFirst({
    where: like(jamaahData.bookingNumber, `${prefix}%`),
    orderBy: (jamaahData, { desc }) => [desc(jamaahData.bookingNumber)],
  });

  let sequence = 1;

  if (lastBooking && lastBooking.bookingNumber) {
    // Extract sequence number dari booking terakhir
    const lastSequence = lastBooking.bookingNumber.split("-")[2];
    sequence = parseInt(lastSequence, 10) + 1;
  }

  const bookingNumber = `${prefix}-${String(sequence).padStart(4, "0")}`;

  console.log("📋 Generated Booking Number:", bookingNumber);

  return bookingNumber;
};

// ✅ UPDATED: Create User
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, role, packageId } = req.body;

    console.log("📥 CREATE USER REQUEST:", {
      fullName,
      email,
      phone,
      role,
      packageId,
    });

    // ✅ VALIDASI
    if (!fullName || !email || !phone || !role) {
      return errorResponse(
        res,
        "Data tidak lengkap (fullName, email, phone, role wajib)",
        400
      );
    }

    // ✅ CEK EMAIL DUPLIKAT
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return errorResponse(res, "Email sudah terdaftar", 400);
    }

    // ✅ GENERATE PASSWORD OTOMATIS
    const tempPassword = generatePassword(12);
    console.log("🔐 Generated password:", tempPassword);

    if (!tempPassword || tempPassword.length === 0) {
      console.error("❌ Password generation failed!");
      return errorResponse(res, "Gagal generate password", 500);
    }

    // ✅ HASH PASSWORD
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    console.log("✅ Password hashed successfully");

    // ✅ INSERT USER
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        phone,
        role,
        isActive: true,
        isEmailVerified: false,
      })
      .$returningId();

    console.log("✅ User created with ID:", newUser.id);

    // ✅ JIKA ROLE JAMAAH → CREATE jamaahData
    let bookingNumber = null;

    if (role === "JAMAAH") {
      // ✅ GENERATE BOOKING NUMBER
      bookingNumber = await generateBookingNumber();

      const jamaahDataValues = {
        userId: newUser.id,
        bookingNumber: bookingNumber, // ✅ WAJIB!
        dateOfBooking: new Date(), // ✅ WAJIB!
        packageId: packageId ? parseInt(packageId) : null,
        registrationStatus: "DRAFT",
        isProfileComplete: false,
        // Optional fields - akan NULL
        agenId: req.user?.role === "AGEN" ? req.user.id : null,
      };

      console.log("📦 Creating jamaahData:", jamaahDataValues);

      await db.insert(jamaahData).values(jamaahDataValues);

      console.log("✅ JamaahData created with booking:", bookingNumber);
    }

    // ✅ KIRIM EMAIL (async, non-blocking)
    if (typeof sendCredentialsEmail === "function") {
      sendCredentialsEmail(email.toLowerCase(), fullName, tempPassword)
        .then((result) => {
          if (result && result.success) {
            console.log(`✅ Credentials email sent to: ${email}`);
          } else {
            console.error(`❌ Email failed for ${email}:`, result?.error);
          }
        })
        .catch((err) => {
          console.error(`❌ Email error for ${email}:`, err.message);
        });
    } else {
      console.log("📧 EMAIL TO:", email);
      console.log("   Password:", tempPassword);
    }

    // ✅ RETURN CREDENTIALS KE FRONTEND
    return createdResponse(
      res,
      {
        user: {
          id: newUser.id,
          fullName,
          email: email.toLowerCase(),
          role,
          bookingNumber: bookingNumber, // ✅ Include booking number
        },
        credentials: {
          email: email.toLowerCase(),
          password: tempPassword,
        },
      },
      "User berhasil dibuat"
    );
  } catch (error) {
    console.error("❌ CREATE USER ERROR:", error);
    console.error("❌ ERROR STACK:", error.stack);
    next(error);
  }
};

// ... sisanya sama (getAllUsers, getUserById, updateUser, dll)

// ===== GET ALL USERS (SUDAH BENER) =====
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === "true"));
    }

    const allUsers = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return successResponse(res, allUsers);
  } catch (error) {
    next(error);
  }
};

// ===== GET USER BY ID (SUDAH BENER) =====
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE USER (SUDAH BENER) =====
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, role, isActive } = req.body;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });

    if (!existingUser) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    await db
      .update(users)
      .set({
        fullName: fullName ?? existingUser.fullName,
        phone: phone ?? existingUser.phone,
        role: role ?? existingUser.role,
        isActive: isActive !== undefined ? isActive : existingUser.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    return successResponse(res, null, "User berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== TOGGLE USER STATUS (SUDAH BENER) =====
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    await db
      .update(users)
      .set({
        isActive: !user.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    return successResponse(
      res,
      { isActive: !user.isActive },
      "Status user berhasil diupdate"
    );
  } catch (error) {
    next(error);
  }
};

// ===== DELETE USER (SUDAH BENER) =====
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // ✅ TODO: Cek apakah user punya relasi (jamaahData, transactions, dll)
    // Kalau ada, return error atau cascade delete

    await db.delete(users).where(eq(users.id, parseInt(id)));

    return successResponse(res, null, "User berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
