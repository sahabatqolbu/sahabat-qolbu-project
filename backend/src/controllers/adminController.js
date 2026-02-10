// backend/src/controllers/adminController.js

import { db } from "../db/index.js";
import { users, jamaahData, agenProfiles } from "../db/schema.js";
import { eq, like, or, and, sql, inArray } from "drizzle-orm";
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

const isBookingNumberDuplicateError = (error) => {
  const message = error?.sqlMessage || error?.message || "";
  return error?.code === "ER_DUP_ENTRY" && message.includes("booking_number");
};

const createJamaahDataWithRetry = async (buildValues, maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const bookingNumber = await generateBookingNumber();

    try {
      await db.insert(jamaahData).values(buildValues(bookingNumber));
      return bookingNumber;
    } catch (error) {
      if (isBookingNumberDuplicateError(error) && attempt < maxRetries) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Gagal membuat booking number unik");
};

// ✅ UPDATED: Create User
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, phone, role, packageId } = req.validatedBody || req.body;
    const requesterRole = req.user?.role;

    console.log("📥 CREATE USER REQUEST:", {
      fullName,
      email,
      phone,
      role,
      packageId,
      requesterRole,
    });

    if (!requesterRole || (requesterRole !== "ADMIN" && requesterRole !== "STAFF")) {
      return errorResponse(res, "Akses ditolak", 403);
    }

    if (requesterRole === "STAFF" && role !== "AGEN" && role !== "JAMAAH") {
      return errorResponse(
        res,
        "Staff hanya bisa membuat user dengan role AGEN atau JAMAAH",
        403
      );
    }

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
        createdBy: req.user?.userId || null,
        isActive: true,
        isEmailVerified: false,
      })
      .$returningId();

    console.log("✅ User created with ID:", newUser.id);

    // ✅ JIKA ROLE JAMAAH → CREATE jamaahData
    let bookingNumber = null;

    if (role === "JAMAAH") {
      bookingNumber = await createJamaahDataWithRetry((generatedBookingNumber) => ({
        userId: newUser.id,
        bookingNumber: generatedBookingNumber,
        dateOfBooking: new Date(),
        packageId: packageId ? parseInt(packageId) : null,
        registrationStatus: "DRAFT",
        isProfileComplete: false,
        agenId: req.user?.role === "AGEN" ? req.user.userId : null,
      }));

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
      console.log("📧 Email service unavailable, credentials email not sent");
    }

    // ✅ RETURN USER DATA ONLY (never expose plaintext credentials)
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
    const requesterRole = req.user?.role;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }
    if (requesterRole === "STAFF" || requesterRole === "FINANCE") {
      if (role && role !== "AGEN" && role !== "JAMAAH") {
        return successResponse(res, []);
      }

      if (role === "AGEN" || role === "JAMAAH") {
        conditions.push(eq(users.role, role));
      } else {
        conditions.push(or(eq(users.role, "AGEN"), eq(users.role, "JAMAAH")));
      }
    } else if (role) {
      conditions.push(eq(users.role, role));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === "true"));
    }

    const allUsers = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    const creatorIds = [...new Set(allUsers.map((u) => u.createdBy).filter(Boolean))];

    const creators = creatorIds.length
      ? await db.query.users.findMany({
          where: inArray(users.id, creatorIds),
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        })
      : [];

    const creatorById = new Map(creators.map((c) => [c.id, c]));

    const enrichedUsers = allUsers.map((u) => {
      const registeredBy = u.createdBy ? creatorById.get(u.createdBy) || null : null;

      return {
        ...u,
        registeredBy,
      };
    });

    return successResponse(res, enrichedUsers);
  } catch (error) {
    next(error);
  }
};

// ===== GET USER BY ID (SUDAH BENER) =====
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterRole = req.user?.role;

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    if (
      (requesterRole === "STAFF" || requesterRole === "FINANCE") &&
      user.role !== "AGEN" &&
      user.role !== "JAMAAH"
    ) {
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
    const { fullName, phone, role, isActive } = req.validatedBody || req.body;

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

// ===== IMPORT USERS (BULK) =====
export const importUsers = async (req, res, next) => {
  try {
    const { users: userList } = req.body;

    if (!userList || !Array.isArray(userList) || userList.length === 0) {
      return errorResponse(res, "Data users tidak valid atau kosong", 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Kita proses satu per satu biar bisa kirim email masing-masing
    // Untuk performa ribuan data, sebaiknya pake BullMQ/Queue, 
    // tapi untuk skala ratusan, loop async masih oke.
    for (const userData of userList) {
      try {
        const { fullName, email, phone, role, packageId, nik } = userData;

        // Validasi minimal
        if (!fullName || !email || !role) {
          results.failed++;
          results.errors.push({ email: email || "unknown", reason: "Data tidak lengkap" });
          continue;
        }

        // Cek duplikat
        const existing = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (existing) {
          results.failed++;
          results.errors.push({ email, reason: "Email sudah terdaftar" });
          continue;
        }

        // Generate & Hash Password
        const tempPassword = generatePassword(12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Insert User
        const [newUser] = await db
          .insert(users)
          .values({
            email: email.toLowerCase(),
            password: hashedPassword,
            fullName,
            phone: phone || null,
            role: role.toUpperCase(),
            createdBy: req.user?.userId || null,
            isActive: true,
            isEmailVerified: false,
          })
          .$returningId();

        // Jika JAMAAH -> Create jamaahData
        if (role.toUpperCase() === "JAMAAH") {
          await createJamaahDataWithRetry((generatedBookingNumber) => ({
            userId: newUser.id,
            bookingNumber: generatedBookingNumber,
            dateOfBooking: new Date(),
            packageId: packageId ? parseInt(packageId) : null,
            nik: nik || null,
            registrationStatus: "DRAFT",
            isProfileComplete: false,
          }));
        }

        // Jika AGEN -> Create agenProfiles
        if (role.toUpperCase() === "AGEN") {
          await db.insert(agenProfiles).values({
            userId: newUser.id,
            namaKtp: fullName,
            nik: nik || null,
          });
        }

        // Kirim Email (Non-blocking)
        sendCredentialsEmail(email.toLowerCase(), fullName, tempPassword).catch(err => {
          console.error(`📧 Failed to send import email to ${email}:`, err.message);
        });

        results.success++;
      } catch (err) {
        console.error(`❌ Error importing user ${userData.email}:`, err);
        results.failed++;
        results.errors.push({ email: userData.email, reason: err.message });
      }
    }

    return successResponse(res, results, `Berhasil memproses ${userList.length} data`);
  } catch (error) {
    next(error);
  }
};

// ===== BULK DELETE USERS =====
export const bulkDeleteUsers = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, "Daftar ID tidak valid", 400);
    }

    // Filter out users that might have constraints (optional logic)
    // For now, simple bulk delete (cascades should handle relations)
    await db.delete(users).where(inArray(users.id, ids));

    return successResponse(res, null, `${ids.length} user berhasil dihapus`);
  } catch (error) {
    next(error);
  }
};

// ===== BULK UPDATE STATUS =====
export const bulkUpdateUserStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, "Daftar ID tidak valid", 400);
    }

    await db
      .update(users)
      .set({ isActive: !!isActive })
      .where(inArray(users.id, ids));

    return successResponse(
      res,
      null,
      `${ids.length} user berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"}`
    );
  } catch (error) {
    next(error);
  }
};
