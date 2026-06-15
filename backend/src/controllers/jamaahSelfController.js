// backend/src/controllers/jamaahSelfController.js
import { db } from "../db/index.js";
import {
  jamaahData,
  users,
  packages,
  jamaahPayments,
  agentData,
} from "../db/schema.js";
import { eq, like, or, and, desc, sql, ne } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { createNotification, notifyAdmins } from "./notificationController.js";
import { logger } from "../utils/logger.js";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "../utils/response.js";

// =====================================================
// GET PROFILE (Jamaah akses data sendiri)
// =====================================================
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX: userId bukan id

    logger.debug("Jamaah get profile", { userId });

    // Get jamaah_data dengan relasi
    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        package: {
          with: {
            hotelMakkah: true,
            hotelMadinah: true,
            airline: true,
          },
        },
        agen: {
          columns: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        mahram: {
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan. Hubungi admin.");
    }

    // Calculate document completeness
    const requiredDocs = {
      foto: !!jamaah.fotoUrl,
      ktp: !!jamaah.ktpUrl,
      kk: !!jamaah.kkUrl,
    };

    const optionalDocs = {
      paspor: !!jamaah.pasporUrl,
      vaksin: !!jamaah.vaksinUrl,
      meningitis: !!jamaah.meningitisUrl,
      bukuNikah: !!jamaah.bukuNikahUrl,
    };

    const requiredComplete = Object.values(requiredDocs).every(Boolean);
    const biodataComplete = !!(
      jamaah.namaPaspor &&
      jamaah.nik &&
      jamaah.birthDate &&
      jamaah.birthPlace &&
      jamaah.gender &&
      jamaah.address &&
      jamaah.province &&
      jamaah.city &&
      jamaah.emergencyName &&
      jamaah.emergencyPhone
    );

    // Calculate H-30 deadline (jika ada package)
    let deadlineH30 = null;
    let daysUntilH30 = null;
    if (jamaah.package?.departureDate) {
      const departure = new Date(jamaah.package.departureDate);
      deadlineH30 = new Date(departure);
      deadlineH30.setDate(deadlineH30.getDate() - 30);

      const today = new Date();
      daysUntilH30 = Math.ceil((deadlineH30 - today) / (1000 * 60 * 60 * 24));
    }

    logger.debug("Jamaah profile loaded", { userId });

    return successResponse(res, {
        ...jamaah,
        completeness: {
          biodata: biodataComplete,
          requiredDocs,
          optionalDocs,
          requiredDocsComplete: requiredComplete,
          overallComplete: biodataComplete && requiredComplete,
        },
        deadlines: {
          h30: deadlineH30,
          daysUntilH30,
          h45: jamaah.package?.departureDate
            ? new Date(
                new Date(jamaah.package.departureDate).setDate(
                  new Date(jamaah.package.departureDate).getDate() - 45,
                ),
              )
            : null,
        },
    });
  } catch (error) {
    logger.error("Get jamaah profile error", error, { userId: req.user?.userId });
    next(error);
  }
};


// =====================================================
// HELPER FUNCTIONS - Tambahkan di atas
// =====================================================
const emptyToNull = (value) => {
  if (value === "" || value === undefined || value === "undefined") {
    return null;
  }
  return value;
};

// Parse date dan convert ke yyyy-MM-dd format
const parseDateOrNull = (value) => {
  if (!value || value === "" || value === "undefined") {
    return null;
  }

  try {
    // Handle ISO format (2026-01-08T00:00:00.000Z) atau yyyy-MM-dd
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    // Return format yyyy-MM-dd untuk MySQL DATE column
    return date.toISOString().split("T")[0];
  } catch (e) {
    logger.warn("Invalid date value received");
    return null;
  }
};

const parseIntOrNull = (value) => {
  if (
    value === null ||
    value === "" ||
    value === undefined ||
    value === "undefined"
  ) {
    return null;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

// =====================================================
// UPDATE BIODATA (Step by step)
// =====================================================
export const updateMyBiodata = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    logger.debug("Jamaah update biodata", { userId });

    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    if (existing.registrationStatus === "APPROVED") {
      return errorResponse(
        res,
        "Data sudah diapprove. Hubungi admin untuk perubahan.",
        403
      );
    }

    // Define field types for proper sanitization
    const fieldConfig = {
      // String fields
      namaPaspor: 'string',
      nik: 'string',
      birthPlace: 'string',
      address: 'string',
      province: 'string',
      city: 'string',
      district: 'string',
      postalCode: 'string',
      passportNumber: 'string',
      passportIssuePlace: 'string',
      emergencyName: 'string',
      emergencyPhone: 'string',
      emergencyRelation: 'string',
      mahramRelation: 'string',
      
      // Date fields - MUST be valid date or NULL
      birthDate: 'date',
      passportIssueDate: 'date',
      passportExpiry: 'date',
      
      // Enum fields - MUST be valid enum or NULL
      gender: 'enum',
      maritalStatus: 'enum',
      
      // Integer/FK fields - MUST be valid int or NULL
      mahramId: 'integer',
    };

    const filteredData = {};
    
    for (const [key, type] of Object.entries(fieldConfig)) {
      if (updateData[key] !== undefined) {
        switch (type) {
          case 'date':
            filteredData[key] = parseDateOrNull(updateData[key]);
            break;
          case 'integer':
            filteredData[key] = parseIntOrNull(updateData[key]);
            break;
          case 'enum':
            // Enum harus valid value atau null
            filteredData[key] = emptyToNull(updateData[key]);
            break;
          case 'string':
          default:
            // String bisa empty string atau null, tergantung kebutuhan
            // Untuk konsistensi, convert empty string ke null juga
            filteredData[key] = emptyToNull(updateData[key]);
            break;
        }
      }
    }

    logger.debug("Jamaah biodata sanitized", { userId, fields: Object.keys(filteredData) });

    // Only update if there's data to update
    if (Object.keys(filteredData).length === 0) {
      return successResponse(
        res,
        { isProfileComplete: existing.isProfileComplete },
        "Tidak ada data yang diupdate"
      );
    }

    await db
      .update(jamaahData)
      .set({
        ...filteredData,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, existing.id));

    const updated = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    const isProfileComplete = !!(
      updated.namaPaspor &&
      updated.nik &&
      updated.birthDate &&
      updated.gender &&
      updated.address &&
      updated.emergencyName &&
      updated.emergencyPhone &&
      updated.fotoUrl &&
      updated.ktpUrl &&
      updated.kkUrl
    );

    await db
      .update(jamaahData)
      .set({ isProfileComplete })
      .where(eq(jamaahData.id, existing.id));

    logger.info("Jamaah biodata updated", { userId });

    return successResponse(
      res,
      {
        isProfileComplete,
      },
      "Biodata berhasil diupdate"
    );
  } catch (error) {
    logger.error("Update jamaah biodata error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// UPLOAD DOCUMENT
// =====================================================
export const uploadMyDocument = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX
    const { documentType } = req.body;

    logger.debug("Jamaah upload document", { userId, documentType });

    if (!req.file) {
      return errorResponse(res, "File tidak ditemukan", 400);
    }

    const validTypes = [
      "foto",
      "ktp",
      "kk",
      "paspor",
      "bukuNikah",
      "aktaLahir",
      "ijazah",
      "vaksin",
      "meningitis",
    ];

    if (!validTypes.includes(documentType)) {
      return errorResponse(res, "Tipe dokumen tidak valid", 400);
    }

    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const columnMap = {
      foto: "fotoUrl",
      ktp: "ktpUrl",
      kk: "kkUrl",
      paspor: "pasporUrl",
      bukuNikah: "bukuNikahUrl",
      aktaLahir: "aktaLahirUrl",
      ijazah: "ijazahUrl",
      vaksin: "vaksinUrl",
      meningitis: "meningitisUrl",
    };

    const columnName = columnMap[documentType];
    const fileUrl = req.uploadedFile?.path;

    if (!fileUrl) {
      return errorResponse(res, "File upload gagal diproses", 500);
    }

    const oldUrl = existing[columnName];
    if (oldUrl) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        String(oldUrl).replace(/^\/+/, "")
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await db
      .update(jamaahData)
      .set({
        [columnName]: fileUrl,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, existing.id));

    logger.info("Jamaah document uploaded", { userId, documentType });

    return successResponse(
      res,
      {
        url: fileUrl,
      },
      `${documentType.toUpperCase()} berhasil diupload`
    );
  } catch (error) {
    logger.error("Upload jamaah document error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// SUBMIT FOR APPROVAL
// =====================================================
export const submitForApproval = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX

    logger.debug("Jamaah submit for approval", { userId });

    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const requiredFields = {
      namaPaspor: "Nama Paspor",
      nik: "NIK",
      birthDate: "Tanggal Lahir",
      birthPlace: "Tempat Lahir",
      gender: "Jenis Kelamin",
      address: "Alamat",
      province: "Provinsi",
      city: "Kota",
      emergencyName: "Nama Kontak Darurat",
      emergencyPhone: "HP Kontak Darurat",
    };

    const requiredDocs = {
      fotoUrl: "Foto",
      ktpUrl: "KTP",
      kkUrl: "Kartu Keluarga",
    };

    const missingFields = [];
    const missingDocs = [];

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!existing[field]) {
        missingFields.push(label);
      }
    }

    for (const [field, label] of Object.entries(requiredDocs)) {
      if (!existing[field]) {
        missingDocs.push(label);
      }
    }

    if (missingFields.length > 0 || missingDocs.length > 0) {
      return errorResponse(res, "Data belum lengkap", 400, {
        missingFields,
        missingDocs,
      });
    }

    await db
      .update(jamaahData)
      .set({
        registrationStatus: "VERIFIED",
        isProfileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, existing.id));

    logger.info("Jamaah submitted for approval", { userId });

    // ✅ KIRIM NOTIFIKASI KE ADMIN
    await notifyAdmins({
      type: "JAMAAH_SUBMITTED",
      title: "Data Jamaah Menunggu Approval",
      message: `${existing.namaPaspor || req.user.fullName || `Jamaah #${userId}`} telah mengirimkan data untuk approval`,
      link: `/admin/jamaah/${existing.bookingNumber}`,
      referenceId: existing.id,
      referenceType: "jamaah",
    });

    return successResponse(
      res,
      null,
      "Data berhasil disubmit. Menunggu approval admin."
    );
  } catch (error) {
    logger.error("Submit jamaah for approval error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// SEARCH MAHRAM (Cari jamaah lain)
// =====================================================
export const searchMahram = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX
    const { q } = req.query;

    logger.debug("Jamaah search mahram", { userId, queryLength: String(q || "").length });

    if (!q || q.length < 3) {
      return successResponse(res, []);
    }

    const myJamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    const results = await db.query.jamaahData.findMany({
      where: and(
        ne(jamaahData.userId, userId),
        myJamaah ? ne(jamaahData.id, myJamaah.id) : undefined,
      ),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      limit: 10,
    });

    const searchLower = q.toLowerCase();
    const filtered = results.filter((j) => {
      const namaUser = (j.user?.fullName || "").toLowerCase();
      const namaPaspor = (j.namaPaspor || "").toLowerCase();
      const booking = (j.bookingNumber || "").toLowerCase();
      const phone = (j.user?.phone || "").toLowerCase();

      return (
        namaUser.includes(searchLower) ||
        namaPaspor.includes(searchLower) ||
        booking.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });

    const data = filtered.map((j) => ({
      id: j.id,
      bookingNumber: j.bookingNumber,
      fullName: j.user?.fullName || j.namaPaspor || "-",
      phone: j.user?.phone || "-",
      gender: j.gender,
    }));

    return successResponse(res, data);
  } catch (error) {
    logger.error("Search mahram error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// GET MY PAYMENTS
// =====================================================
export const getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX

    logger.debug("Jamaah get payments", { userId });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const payments = await db.query.jamaahPayments.findMany({
      where: eq(jamaahPayments.jamaahId, jamaah.id),
      with: {
        bank: true,
      },
      orderBy: [desc(jamaahPayments.createdAt)],
    });

    return successResponse(res, {
      summary: {
        hargaFinal: jamaah.hargaFinal,
        totalPayment: jamaah.totalPayment,
        outstanding: jamaah.outstanding,
        statusPayment: jamaah.statusPayment,
      },
      payments,
    });
  } catch (error) {
    logger.error("Get jamaah payments error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// GET MY PACKAGE
// =====================================================
export const getMyPackage = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ FIX

    logger.debug("Jamaah get package", { userId });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.userId, userId),
      orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
      with: {
        package: {
          with: {
            hotelMakkah: true,
            hotelMadinah: true,
            airline: true,
            departureAirport: true,
            images: true,
          },
        },
      },
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    if (!jamaah.package) {
      return successResponse(res, null, "Belum ada paket yang dipilih");
    }

    return successResponse(res, {
      package: jamaah.package,
      booking: {
        bookingNumber: jamaah.bookingNumber,
        dateOfBooking: jamaah.dateOfBooking,
        roomTypeMakkah: jamaah.roomTypeMakkah,
        roomTypeMadinah: jamaah.roomTypeMadinah,
        notePaket: jamaah.notePaket,
      },
      pricing: {
        hargaPaket: jamaah.hargaPaket,
        potonganFeeAgen: jamaah.potonganFeeAgen,
        potonganPoinAgen: jamaah.potonganPoinAgen,
        potonganCashbackKK: jamaah.potonganCashbackKK,
        hargaFinal: jamaah.hargaFinal,
      },
    });
  } catch (error) {
    logger.error("Get jamaah package error", error, { userId: req.user?.userId });
    next(error);
  }
};

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// =====================================================
// REQUEST PACKAGE CONSULTATION (notify agent/admin)
// =====================================================
export const requestPackageConsultation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { packageId } = req.body;

    const pkgId = parsePositiveInt(packageId);
    if (!pkgId) {
      return errorResponse(res, "Paket tidak valid", 400);
    }

    const [jamaah, pkg] = await Promise.all([
      db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, userId),
        orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
      }),
      db.query.packages.findFirst({
        where: eq(packages.id, pkgId),
      }),
    ]);

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    if (!pkg) {
      return notFoundResponse(res, "Paket tidak ditemukan");
    }

    const requesterName = jamaah.namaPaspor || req.user.fullName || `Jamaah #${userId}`;
    const notificationPayload = {
      type: "SYSTEM",
      title: "Minat Paket dari Jamaah",
      message: `${requesterName} meminta bantuan pendaftaran paket ${pkg.name}`,
      link: `/admin/jamaah/${jamaah.bookingNumber}`,
      referenceId: jamaah.id,
      referenceType: "jamaah",
    };

    let target = "ADMIN";

    if (jamaah.agenId) {
      const agenByUser = await db.query.users.findFirst({
        where: and(
          eq(users.id, jamaah.agenId),
          eq(users.role, "AGEN"),
          eq(users.isActive, true),
        ),
      });

      let agenUserId = agenByUser?.id;

      if (!agenUserId) {
        const agentRecord = await db.query.agentData.findFirst({
          where: eq(agentData.id, jamaah.agenId),
          columns: { userId: true },
        });

        if (agentRecord?.userId) {
          const agenByAgentData = await db.query.users.findFirst({
            where: and(
              eq(users.id, agentRecord.userId),
              eq(users.role, "AGEN"),
              eq(users.isActive, true),
            ),
            columns: { id: true },
          });
          agenUserId = agenByAgentData?.id;
        }
      }

      if (agenUserId) {
        await createNotification({
          userId: agenUserId,
          ...notificationPayload,
          link: `/agen/jamaah/${jamaah.id}`,
        });
        target = "AGEN";
      } else {
        await notifyAdmins(notificationPayload);
      }
    } else {
      await notifyAdmins(notificationPayload);
    }

    return successResponse(
      res,
      { target },
      target === "AGEN"
        ? "Permintaan sudah dikirim ke agen Anda"
        : "Permintaan sudah dikirim ke admin"
    );
  } catch (error) {
    logger.error("Request package consultation error", error, {
      userId: req.user?.userId,
    });
    next(error);
  }
};
