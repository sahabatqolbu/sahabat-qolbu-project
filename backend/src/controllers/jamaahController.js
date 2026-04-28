// backend/src/controllers/jamaahController.js
import { db } from "../db/index.js";
import {
  jamaahData,
  users,
  packages,
  jamaahPayments,
  agentData,
  auditLogs,
} from "../db/schema.js";
import { eq, like, or, and, desc, sql, count, inArray, isNotNull } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import {
  paginatedResponse,
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} from "../utils/response.js";
import { deriveJamaahPaymentState } from "../utils/paymentState.js";
import { isPaymentProofPathValid } from "../utils/paymentProofPolicy.js";

const SAFE_USER_COLUMNS = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

const getAgenOwnershipCondition = async (agenUserId) => {
  const agent = await db.query.agentData.findFirst({
    where: eq(agentData.userId, agenUserId),
    columns: { id: true },
  });

  return agent
    ? or(eq(jamaahData.agenId, agenUserId), eq(jamaahData.agenId, agent.id))
    : eq(jamaahData.agenId, agenUserId);
};

const ADMIN_UPLOAD_DOCUMENT_MAP = {
  foto: "fotoUrl",
  fotoUrl: "fotoUrl",
  ktp: "ktpUrl",
  ktpUrl: "ktpUrl",
  kk: "kkUrl",
  kkUrl: "kkUrl",
  paspor: "pasporUrl",
  pasporUrl: "pasporUrl",
  bukuNikah: "bukuNikahUrl",
  bukuNikahUrl: "bukuNikahUrl",
  aktaLahir: "aktaLahirUrl",
  aktaLahirUrl: "aktaLahirUrl",
  ijazah: "ijazahUrl",
  ijazahUrl: "ijazahUrl",
  vaksin: "vaksinUrl",
  vaksinUrl: "vaksinUrl",
  meningitis: "meningitisUrl",
  meningitisUrl: "meningitisUrl",
};

// ===== HELPER: Generate Booking Number =====
const generateBookingNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;
  const prefix = `SQ-${datePrefix}`;

  const lastBooking = await db.query.jamaahData.findFirst({
    where: like(jamaahData.bookingNumber, `${prefix}%`),
    orderBy: [desc(jamaahData.bookingNumber)],
  });

  let sequence = 1;
  if (lastBooking && lastBooking.bookingNumber) {
    const lastSequence = lastBooking.bookingNumber.split("-")[2];
    sequence = parseInt(lastSequence, 10) + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

const isBookingNumberDuplicateError = (error) => {
  const message = error?.sqlMessage || error?.message || "";
  return error?.code === "ER_DUP_ENTRY" && message.includes("booking_number");
};

const createJamaahRecordWithRetry = async (buildValues, maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const bookingNumber = await generateBookingNumber();

    try {
      const [newJamaah] = await db
        .insert(jamaahData)
        .values(buildValues(bookingNumber))
        .$returningId();

      return { bookingNumber, newJamaah };
    } catch (error) {
      if (isBookingNumberDuplicateError(error) && attempt < maxRetries) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Gagal membuat booking number unik");
};

const isPaymentNumberDuplicateError = (error) => {
  const message = error?.sqlMessage || error?.message || "";
  return error?.code === "ER_DUP_ENTRY" && message.includes("payment_number");
};

const createPaymentWithRetry = async (jamaahId, buildValues, maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const latestPayment = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.jamaahId, jamaahId),
      columns: { paymentNumber: true },
      orderBy: [desc(jamaahPayments.paymentNumber)],
    });

    const paymentNumber = Number(latestPayment?.paymentNumber || 0) + 1;

    try {
      const [inserted] = await db
        .insert(jamaahPayments)
        .values(buildValues(paymentNumber))
        .$returningId();
      return { inserted, paymentNumber };
    } catch (error) {
      if (isPaymentNumberDuplicateError(error) && attempt < maxRetries) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gagal membuat nomor pembayaran unik");
};

const syncJamaahPaymentAggregate = async ({ jamaahId, hargaFinal }) => {
  const [{ totalVerifiedAmount }] = await db
    .select({
      totalVerifiedAmount: sql`COALESCE(SUM(${jamaahPayments.amount}), 0)`,
    })
    .from(jamaahPayments)
    .where(
      and(
        eq(jamaahPayments.jamaahId, jamaahId),
        isNotNull(jamaahPayments.verifiedAt)
      )
    );

  const paymentState = deriveJamaahPaymentState({
    hargaFinal,
    totalPayment: totalVerifiedAmount,
  });

  await db
    .update(jamaahData)
    .set({
      totalPayment: paymentState.totalPayment.toString(),
      outstanding: paymentState.outstanding.toString(),
      statusPayment: paymentState.statusPayment,
      updatedAt: new Date(),
    })
    .where(eq(jamaahData.id, jamaahId));

  return paymentState;
};

// =====================================================
// SYNC USER JAMAAH → JAMAAH_DATA
// =====================================================
export const syncJamaahFromUsers = async (req, res, next) => {
  try {
    logger.info("Sync jamaah from users started");

    // Get semua user dengan role JAMAAH
    const jamaahUsers = await db.query.users.findMany({
      where: eq(users.role, "JAMAAH"),
    });

    logger.debug("Found jamaah users", { count: jamaahUsers.length });

    // Get semua jamaah_data
    const existingJamaahData = await db.query.jamaahData.findMany();
    const existingUserIds = existingJamaahData.map((j) => j.userId);

    logger.debug("Existing jamaah rows", { count: existingJamaahData.length });

    // Filter user yang BELUM punya jamaah_data
    const usersWithoutJamaahData = jamaahUsers.filter(
      (u) => !existingUserIds.includes(u.id)
    );

    logger.debug("Users without jamaah", { count: usersWithoutJamaahData.length });

    if (usersWithoutJamaahData.length === 0) {
      return successResponse(
        res,
        {
          synced: 0,
          total: jamaahUsers.length,
        },
        "Semua user JAMAAH sudah punya data jamaah"
      );
    }

    // Create jamaah_data untuk setiap user yang belum punya
    const results = [];
    for (const user of usersWithoutJamaahData) {
      try {
        const { bookingNumber } = await createJamaahRecordWithRetry(
          (generatedBookingNumber) => ({
            userId: user.id,
            bookingNumber: generatedBookingNumber,
            dateOfBooking: new Date(),
            registrationStatus: "DRAFT",
            statusPayment: "BELUM_BAYAR",
            isProfileComplete: false,
            notePaket: "FULLSERVICE",
            hargaPaket: "0",
            potonganFeeAgen: "0",
            potonganPoinAgen: "0",
            potonganCashbackKK: "0",
            hargaFinal: "0",
            totalPayment: "0",
            outstanding: "0",
          })
        );

        results.push({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          bookingNumber,
          status: "created",
        });

        logger.info("Jamaah data synced", {
          userId: user.id,
          bookingNumber,
        });
      } catch (err) {
        logger.warn("Failed syncing jamaah for user", {
          userId: user.id,
          message: err.message,
        });
        results.push({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          status: "failed",
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "created").length;

    return successResponse(
      res,
      {
        synced: successCount,
        total: jamaahUsers.length,
        details: results,
      },
      `Berhasil sync ${successCount} dari ${usersWithoutJamaahData.length} user`
    );
  } catch (error) {
    logger.error("Sync jamaah from users error", error);
    next(error);
  }
};

// =====================================================
// GET ALL JAMAAH (dengan data user)
// =====================================================
export const getAllJamaah = async (req, res, next) => {
  try {
    const {
      search,
      statusPayment,
      registrationStatus,
      packageId,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    logger.debug("Get all jamaah", {
      search,
      statusPayment,
      registrationStatus,
      packageId,
      page: pageNumber,
      limit: limitNumber,
    });

    const normalizedSearch =
      typeof search === "string" && search.trim().length > 0
        ? search.trim()
        : null;

    // Build conditions
    const conditions = [];

    if (statusPayment && statusPayment !== "all") {
      conditions.push(eq(jamaahData.statusPayment, statusPayment));
    }

    if (registrationStatus && registrationStatus !== "all") {
      conditions.push(eq(jamaahData.registrationStatus, registrationStatus));
    }

    if (packageId && packageId !== "all") {
      conditions.push(eq(jamaahData.packageId, parseInt(packageId)));
    }

    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

    let matchedJamaahIds = null;
    if (normalizedSearch) {
      const searchCondition = or(
        like(users.fullName, `%${normalizedSearch}%`),
        like(users.email, `%${normalizedSearch}%`),
        like(users.phone, `%${normalizedSearch}%`),
        like(jamaahData.namaPaspor, `%${normalizedSearch}%`),
        like(jamaahData.bookingNumber, `%${normalizedSearch}%`),
        like(jamaahData.nik, `%${normalizedSearch}%`),
      );

      const userMatchedRows = await db
        .select({ id: jamaahData.id })
        .from(jamaahData)
        .leftJoin(users, eq(users.id, jamaahData.userId))
        .where(baseWhere ? and(baseWhere, searchCondition) : searchCondition);

      matchedJamaahIds = userMatchedRows
        .map((row) => Number(row.id))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (matchedJamaahIds.length === 0) {
        return paginatedResponse(res, [], {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          totalPages: 0,
        });
      }

    }

    const whereCondition = matchedJamaahIds
      ? baseWhere
        ? and(baseWhere, inArray(jamaahData.id, matchedJamaahIds))
        : inArray(jamaahData.id, matchedJamaahIds)
      : baseWhere;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(jamaahData)
      .where(whereCondition);

    // Query dengan relasi LENGKAP
    const jamaahList = await db.query.jamaahData.findMany({
      where: whereCondition,
      with: {
        user: {
          columns: SAFE_USER_COLUMNS,
        },
        package: {
          columns: {
            id: true,
            name: true,
            type: true,
            departureDate: true,
            returnDate: true,
            price: true,
          },
        },
        agen: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [desc(jamaahData.createdAt)],
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
    });

    // Transform response
    const result = jamaahList.map((j) => ({
      id: j.id,
      bookingNumber: j.bookingNumber,
      dateOfBooking: j.dateOfBooking,

      // ✅ USER INFO dari relasi
      userId: j.userId,
      fullName: j.user?.fullName || "-",
      email: j.user?.email || "-",
      phone: j.user?.phone || "-",

      // Biodata (diisi jamaah nanti)
      namaPaspor: j.namaPaspor || null,
      nik: j.nik || null,
      gender: j.gender || null,
      birthDate: j.birthDate || null,
      birthPlace: j.birthPlace || null,

      // Package info
      packageId: j.packageId,
      packageName: j.package?.name || "Belum Pilih Paket",
      packageType: j.package?.type || null,
      packagePrice: j.package?.price || null,
      departureDate: j.package?.departureDate || null,
      returnDate: j.package?.returnDate || null,

      // Mitra & Agen
      namaMitra: j.namaMitra || null,
      agenId: j.agenId,
      agenName: j.agen?.fullName || null,

      // Paket options
      notePaket: j.notePaket || "FULLSERVICE",
      roomTypeMakkah: j.roomTypeMakkah || null,
      roomTypeMadinah: j.roomTypeMadinah || null,

      // Pricing
      hargaPaket: j.hargaPaket || "0",
      potonganFeeAgen: j.potonganFeeAgen || "0",
      potonganPoinAgen: j.potonganPoinAgen || "0",
      potonganCashbackKK: j.potonganCashbackKK || "0",
      hargaFinal: j.hargaFinal || "0",
      totalPayment: j.totalPayment || "0",
      outstanding: j.outstanding || "0",

      // Status
      statusPayment: j.statusPayment || "BELUM_BAYAR",
      registrationStatus: j.registrationStatus || "DRAFT",
      isProfileComplete: j.isProfileComplete || false,

      // Documents status
      hasDocuments: {
        foto: !!j.fotoUrl,
        ktp: !!j.ktpUrl,
        kk: !!j.kkUrl,
        paspor: !!j.pasporUrl,
        bukuNikah: !!j.bukuNikahUrl,
        aktaLahir: !!j.aktaLahirUrl,
      },

      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }));

    logger.info("Jamaah list returned", { count: result.length });

    return paginatedResponse(res, result, {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    logger.error("Get all jamaah error", error);
    next(error);
  }
};

// =====================================================
// GET JAMAAH BY BOOKING NUMBER
// =====================================================
export const getJamaahByBookingNumber = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    logger.debug("Get jamaah by booking", {
      bookingNumber,
      role: req.user?.role,
      userId: req.user?.userId,
    });

    const whereCondition =
      req.user?.role === "AGEN"
        ? and(
            eq(jamaahData.bookingNumber, bookingNumber),
            await getAgenOwnershipCondition(req.user.userId)
          )
        : eq(jamaahData.bookingNumber, bookingNumber);

    const jamaah = await db.query.jamaahData.findFirst({
      where: whereCondition,
      with: {
        user: {
          columns: SAFE_USER_COLUMNS,
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
            email: true,
            phone: true,
          },
        },
        mahram: {
          with: {
            user: {
              columns: {
                fullName: true,
              },
            },
          },
        },
        payments: {
          orderBy: [desc(jamaahPayments.createdAt)],
        },
      },
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan atau bukan milik Anda");
    }

    logger.info("Jamaah found", { bookingNumber: jamaah.bookingNumber });

    return successResponse(res, jamaah);
  } catch (error) {
    logger.error("Get jamaah by booking error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

export const uploadAdminDocument = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return errorResponse(res, "File tidak ditemukan", 400);
    }

    const normalizedDocumentType = String(documentType || "").trim();
    const columnName = ADMIN_UPLOAD_DOCUMENT_MAP[normalizedDocumentType];

    if (!columnName) {
      return errorResponse(res, "Tipe dokumen tidak valid", 400);
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const fileUrl = req.uploadedFile?.path;

    if (!fileUrl) {
      return errorResponse(res, "File upload gagal diproses", 500);
    }

    await db
      .update(jamaahData)
      .set({
        [columnName]: fileUrl,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, jamaah.id));

    const updatedJamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.id, jamaah.id),
      with: {
        user: {
          columns: SAFE_USER_COLUMNS,
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
            email: true,
            phone: true,
          },
        },
        mahram: {
          with: {
            user: {
              columns: {
                fullName: true,
              },
            },
          },
        },
        payments: {
          orderBy: [desc(jamaahPayments.createdAt)],
        },
      },
    });

    logger.info("Admin jamaah document uploaded", {
      bookingNumber,
      documentType: normalizedDocumentType,
      uploadedBy: req.user?.userId,
    });

    return successResponse(
      res,
      {
        documentType: normalizedDocumentType,
        columnName,
        url: fileUrl,
        jamaah: updatedJamaah,
      },
      `${normalizedDocumentType.toUpperCase()} berhasil diupload`
    );
  } catch (error) {
    logger.error("Admin upload jamaah document error", error, {
      bookingNumber: req.params?.bookingNumber,
      uploadedBy: req.user?.userId,
    });
    next(error);
  }
};

// =====================================================
// CREATE JAMAAH (Manual)
// =====================================================
export const createJamaah = async (req, res, next) => {
  try {
    const payload = req.validatedBody || req.body;
    const {
      userId,
      packageId,
      namaMitra,
      notePaket,
      roomTypeMakkah,
      roomTypeMadinah,
      hargaPaket,
      potonganFeeAgen,
      potonganPoinAgen,
      potonganCashbackKK,
    } = payload;

    logger.debug("Create jamaah request", {
      requestedBy: req.user?.userId,
      role: req.user?.role,
      hasUserId: !!userId,
      hasPackageId: !!packageId,
    });

    // Validasi user exists (jika ada userId)
    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId)),
      });
      if (!user) {
        return notFoundResponse(res, "User tidak ditemukan");
      }

      // Cek apakah user sudah punya jamaah_data
      const existingJamaah = await db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, parseInt(userId)),
      });
      if (existingJamaah) {
        return errorResponse(
          res,
          "User sudah memiliki data jamaah",
          400,
          { bookingNumber: existingJamaah.bookingNumber }
        );
      }
    }

    // Calculate pricing
    const harga = parseFloat(hargaPaket) || 0;
    const feeAgen = parseFloat(potonganFeeAgen) || 0;
    const poinAgen = parseFloat(potonganPoinAgen) || 0;
    const cashback = parseFloat(potonganCashbackKK) || 0;
    const hargaFinal = harga - feeAgen - poinAgen - cashback;

    const { bookingNumber, newJamaah } = await createJamaahRecordWithRetry(
      (generatedBookingNumber) => ({
        userId: userId ? parseInt(userId) : null,
        packageId: packageId ? parseInt(packageId) : null,
        agenId: req.user?.role === "AGEN" ? req.user.userId : null,
        bookingNumber: generatedBookingNumber,
        dateOfBooking: new Date(),
        namaMitra,
        notePaket: notePaket || "FULLSERVICE",
        roomTypeMakkah,
        roomTypeMadinah,
        hargaPaket: harga.toString(),
        potonganFeeAgen: feeAgen.toString(),
        potonganPoinAgen: poinAgen.toString(),
        potonganCashbackKK: cashback.toString(),
        hargaFinal: hargaFinal.toString(),
        outstanding: hargaFinal.toString(),
        totalPayment: "0",
        statusPayment: "BELUM_BAYAR",
        registrationStatus: "DRAFT",
        isProfileComplete: false,
      })
    );

    logger.info("Jamaah created", { bookingNumber, requestedBy: req.user?.userId });

    return createdResponse(res, { id: newJamaah.id, bookingNumber }, "Jamaah berhasil ditambahkan");
  } catch (error) {
    logger.error("Create jamaah error", error);
    next(error);
  }
};

// backend/src/controllers/jamaahController.js

// =====================================================
// UPDATE JAMAAH
// =====================================================
export const updateJamaah = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const updateData = req.validatedBody || req.body;

    logger.debug("Update jamaah", {
      bookingNumber,
      requestedBy: req.user?.userId,
      fields: Object.keys(updateData || {}),
    });

    // Cek exists
    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    // ✅ FIX: Tambahkan agenId ke allowedFields
    const allowedFields = [
      "namaPaspor",
      "nik",
      "birthPlace",
      "birthDate",
      "gender",
      "maritalStatus",
      "address",
      "province",
      "city",
      "district",
      "postalCode",
      "passportNumber",
      "passportIssueDate",
      "passportExpiry",
      "passportIssuePlace",
      "emergencyName",
      "emergencyPhone",
      "emergencyRelation",
      "packageId",
      "agenId",        // ✅ TAMBAH INI
      "namaMitra",
      "notePaket",
      "roomTypeMakkah",
      "roomTypeMadinah",
      "hargaPaket",
      "potonganFeeAgen",
      "potonganPoinAgen",
      "potonganCashbackKK",
      "registrationStatus",
      "mahramId",
      "mahramRelation",
      "notes",
    ];

    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        // ✅ FIX: Handle null values untuk foreign keys
        if (key === "agenId" || key === "packageId" || key === "mahramId") {
          // Jika value adalah null, string kosong, atau "none", set ke null
          if (updateData[key] === null || updateData[key] === "" || updateData[key] === "none") {
            filteredData[key] = null;
          } else {
            // Parse ke integer
            filteredData[key] = parseInt(updateData[key]);
          }
        } else {
          filteredData[key] = updateData[key];
        }
      }
    }

    logger.debug("Filtered jamaah update fields", {
      bookingNumber,
      fields: Object.keys(filteredData),
    });

    // Recalculate pricing if needed
    if (
      updateData.hargaPaket ||
      updateData.potonganFeeAgen ||
      updateData.potonganPoinAgen ||
      updateData.potonganCashbackKK
    ) {
      const harga =
        parseFloat(updateData.hargaPaket || existing.hargaPaket) || 0;
      const feeAgen =
        parseFloat(updateData.potonganFeeAgen || existing.potonganFeeAgen) || 0;
      const poinAgen =
        parseFloat(updateData.potonganPoinAgen || existing.potonganPoinAgen) ||
        0;
      const cashback =
        parseFloat(
          updateData.potonganCashbackKK || existing.potonganCashbackKK
        ) || 0;
      const hargaFinal = harga - feeAgen - poinAgen - cashback;
      const totalPaid = parseFloat(existing.totalPayment) || 0;
      const outstanding = hargaFinal - totalPaid;

      filteredData.hargaFinal = hargaFinal.toString();
      filteredData.outstanding = outstanding.toString();

      if (totalPaid >= hargaFinal && hargaFinal > 0) {
        filteredData.statusPayment = "LUNAS";
      } else if (totalPaid > 0) {
        filteredData.statusPayment = "CICILAN";
      } else {
        filteredData.statusPayment = "BELUM_BAYAR";
      }
    }

    // Update
    await db
      .update(jamaahData)
      .set({
        ...filteredData,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    // Check profile completeness
    const updated = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    const isComplete = !!(
      updated.namaPaspor &&
      updated.nik &&
      updated.birthDate &&
      updated.gender &&
      updated.passportNumber &&
      updated.passportExpiry
    );

    if (isComplete !== updated.isProfileComplete) {
      await db
        .update(jamaahData)
        .set({ isProfileComplete: isComplete })
        .where(eq(jamaahData.bookingNumber, bookingNumber));
    }

    logger.info("Jamaah updated", { bookingNumber });

    return successResponse(res, null, "Data jamaah berhasil diupdate");
  } catch (error) {
    logger.error("Update jamaah error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

// =====================================================
// DELETE JAMAAH
// =====================================================
export const deleteJamaah = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
      with: { payments: true },
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    if (existing.payments && existing.payments.length > 0) {
      return errorResponse(
        res,
        "Tidak dapat menghapus jamaah yang sudah memiliki riwayat pembayaran",
        400
      );
    }

    await db
      .delete(jamaahData)
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    logger.info("Jamaah deleted", { bookingNumber, requestedBy: req.user?.userId });

    return successResponse(res, null, "Data jamaah berhasil dihapus");
  } catch (error) {
    logger.error("Delete jamaah error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

// =====================================================
// PAYMENTS
// =====================================================
export const addPayment = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const payload = req.validatedBody || req.body;
    const { amount, bankId, paidBy, paymentDate, proofUrl, notes } = payload;

    logger.debug("Add payment request", {
      bookingNumber,
      requestedBy: req.user?.userId,
      bankId,
    });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const { inserted: newPayment, paymentNumber } = await createPaymentWithRetry(
      jamaah.id,
      (nextPaymentNumber) => ({
        jamaahId: jamaah.id,
        paymentNumber: nextPaymentNumber,
        amount: amount.toString(),
        bankId: bankId ? parseInt(bankId, 10) : null,
        paidBy,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        proofStatus: "UPLOADED",
        proofUrl,
        notes,
      })
    );

    logger.info("Payment added", {
      paymentId: newPayment.id,
      bookingNumber,
      paymentNumber,
    });

    return createdResponse(
      res,
      {
        paymentId: newPayment.id,
        paymentNumber,
        verificationStatus: "UPLOADED",
      },
      "Pembayaran berhasil dicatat dan menunggu verifikasi"
    );
  } catch (error) {
    logger.error("Add payment error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    const whereCondition =
      req.user?.role === "AGEN"
        ? and(
            eq(jamaahData.bookingNumber, bookingNumber),
            await getAgenOwnershipCondition(req.user.userId)
          )
        : eq(jamaahData.bookingNumber, bookingNumber);

    const jamaah = await db.query.jamaahData.findFirst({
      where: whereCondition,
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan atau bukan milik Anda");
    }

    const payments = await db.query.jamaahPayments.findMany({
      where: eq(jamaahPayments.jamaahId, jamaah.id),
      with: {
        bank: true,
        verifier: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [desc(jamaahPayments.createdAt)],
    });

    return successResponse(res, payments);
  } catch (error) {
    logger.error("Get payments error", error, {
      bookingNumber: req.params?.bookingNumber,
      role: req.user?.role,
    });
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const parsedPaymentId = Number.parseInt(paymentId, 10);

    if (!Number.isInteger(parsedPaymentId) || parsedPaymentId <= 0) {
      return errorResponse(res, "paymentId tidak valid", 400);
    }

    const payment = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.id, parsedPaymentId),
      columns: {
        id: true,
        proofStatus: true,
        verifiedBy: true,
        verifiedAt: true,
        rejectedBy: true,
        rejectedAt: true,
        proofUrl: true,
      },
      with: {
        jamaah: {
          columns: {
            id: true,
            userId: true,
            bookingNumber: true,
            hargaFinal: true,
          },
        },
      },
    });

    if (!payment) {
      return notFoundResponse(res, "Pembayaran tidak ditemukan");
    }

    if (!payment.jamaah?.id) {
      return errorResponse(
        res,
        "Data jamaah untuk pembayaran ini tidak ditemukan",
        422,
        null,
        "PAYMENT_JAMAAH_NOT_FOUND"
      );
    }

    if (payment.jamaah?.userId && payment.jamaah.userId === req.user.userId) {
      return errorResponse(
        res,
        "Verifikasi pembayaran sendiri tidak diizinkan",
        403,
        null,
        "PAYMENT_SELF_VERIFICATION_BLOCKED"
      );
    }

    if (payment.verifiedBy || payment.verifiedAt) {
      return errorResponse(res, "Pembayaran sudah diverifikasi sebelumnya", 400);
    }

    if (payment.proofStatus === "REJECTED") {
      return errorResponse(
        res,
        "Bukti pembayaran sudah ditolak. Minta upload ulang sebelum verifikasi.",
        400,
        null,
        "PAYMENT_PROOF_REJECTED"
      );
    }

    if (!isPaymentProofPathValid(payment.proofUrl)) {
      return errorResponse(
        res,
        "Bukti pembayaran belum valid. Upload bukti transfer terlebih dahulu.",
        400,
      );
    }

    await db
      .update(jamaahPayments)
      .set({
        proofStatus: "VERIFIED",
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(jamaahPayments.id, parsedPaymentId));

    const paymentState = await syncJamaahPaymentAggregate({
      jamaahId: payment.jamaah.id,
      hargaFinal: payment.jamaah?.hargaFinal,
    });

    try {
      await db.insert(auditLogs).values({
        userId: req.user.userId,
        action: "VERIFY_PAYMENT",
        module: "JAMAAH_PAYMENT",
        description: `Verifikasi pembayaran #${parsedPaymentId} untuk booking ${payment.jamaah?.bookingNumber || "-"}`,
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
      });
    } catch (auditError) {
      logger.warn("Payment verification audit log failed", {
        paymentId: parsedPaymentId,
        verifierId: req.user?.userId,
        error: auditError?.message,
      });
    }

    logger.info("Payment verified", {
      paymentId: parsedPaymentId,
      bookingNumber: payment.jamaah?.bookingNumber,
      verifiedBy: req.user?.userId,
      totalPaid: paymentState.totalPayment,
      outstanding: paymentState.outstanding,
      statusPayment: paymentState.statusPayment,
    });

    return successResponse(res, null, "Pembayaran berhasil diverifikasi");
  } catch (error) {
    logger.error("Verify payment error", error, {
      paymentId: req.params?.paymentId,
    });
    next(error);
  }
};

export const rejectPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.validatedBody || req.body;
    const parsedPaymentId = Number.parseInt(paymentId, 10);

    if (!Number.isInteger(parsedPaymentId) || parsedPaymentId <= 0) {
      return errorResponse(res, "paymentId tidak valid", 400);
    }

    const payment = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.id, parsedPaymentId),
      columns: {
        id: true,
        proofStatus: true,
        verifiedBy: true,
        verifiedAt: true,
      },
      with: {
        jamaah: {
          columns: {
            id: true,
            bookingNumber: true,
            hargaFinal: true,
          },
        },
      },
    });

    if (!payment) {
      return notFoundResponse(res, "Pembayaran tidak ditemukan");
    }

    if (!payment.jamaah?.id) {
      return errorResponse(
        res,
        "Data jamaah untuk pembayaran ini tidak ditemukan",
        422,
        null,
        "PAYMENT_JAMAAH_NOT_FOUND"
      );
    }

    if (payment.verifiedBy || payment.verifiedAt) {
      return errorResponse(
        res,
        "Pembayaran yang sudah diverifikasi tidak bisa ditolak",
        409,
        null,
        "PAYMENT_ALREADY_VERIFIED"
      );
    }

    if (payment.proofStatus === "REJECTED") {
      return errorResponse(
        res,
        "Bukti pembayaran sudah ditolak sebelumnya",
        400,
        null,
        "PAYMENT_ALREADY_REJECTED"
      );
    }

    await db
      .update(jamaahPayments)
      .set({
        proofStatus: "REJECTED",
        rejectedBy: req.user.userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        verifiedBy: null,
        verifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jamaahPayments.id, parsedPaymentId));

    const paymentState = await syncJamaahPaymentAggregate({
      jamaahId: payment.jamaah.id,
      hargaFinal: payment.jamaah?.hargaFinal,
    });

    try {
      await db.insert(auditLogs).values({
        userId: req.user.userId,
        action: "REJECT_PAYMENT",
        module: "JAMAAH_PAYMENT",
        description: `Reject pembayaran #${parsedPaymentId} untuk booking ${payment.jamaah?.bookingNumber || "-"}: ${reason}`,
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
      });
    } catch (auditError) {
      logger.warn("Payment rejection audit log failed", {
        paymentId: parsedPaymentId,
        reviewerId: req.user?.userId,
        error: auditError?.message,
      });
    }

    logger.info("Payment rejected", {
      paymentId: parsedPaymentId,
      bookingNumber: payment.jamaah?.bookingNumber,
      rejectedBy: req.user?.userId,
      reason,
      totalPaid: paymentState.totalPayment,
      outstanding: paymentState.outstanding,
      statusPayment: paymentState.statusPayment,
    });

    return successResponse(res, null, "Bukti pembayaran berhasil ditolak");
  } catch (error) {
    logger.error("Reject payment error", error, {
      paymentId: req.params?.paymentId,
    });
    next(error);
  }
};


// =====================================================
// APPROVE JAMAAH
// =====================================================
export const approveJamaah = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const adminId = req.user.userId;

    logger.debug("Approve jamaah", { bookingNumber, adminId });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    if (jamaah.registrationStatus === "APPROVED") {
      return errorResponse(res, "Jamaah sudah di-approve sebelumnya", 400);
    }

    await db
      .update(jamaahData)
      .set({
        registrationStatus: "APPROVED",
        approvedAt: new Date(),
        approvedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    logger.info("Jamaah approved", { bookingNumber, adminId });

    return successResponse(
      res,
      {
        bookingNumber,
        registrationStatus: "APPROVED",
        approvedAt: new Date(),
      },
      "Jamaah berhasil di-approve"
    );
  } catch (error) {
    logger.error("Approve jamaah error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

// =====================================================
// REJECT JAMAAH
// =====================================================
export const rejectJamaah = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    logger.debug("Reject jamaah", { bookingNumber, adminId });

    if (!reason) {
      return errorResponse(res, "Alasan penolakan harus diisi", 400);
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    await db
      .update(jamaahData)
      .set({
        registrationStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    logger.info("Jamaah rejected", { bookingNumber, adminId });

    return successResponse(
      res,
      {
        bookingNumber,
        registrationStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      "Jamaah berhasil di-reject"
    );
  } catch (error) {
    logger.error("Reject jamaah error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};

// =====================================================
// REVERT TO VERIFIED
// =====================================================
export const revertToVerified = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    logger.debug("Revert jamaah to verified", {
      bookingNumber,
      requestedBy: req.user?.userId,
    });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    await db
      .update(jamaahData)
      .set({
        registrationStatus: "VERIFIED",
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    logger.info("Jamaah reverted to verified", { bookingNumber });

    return successResponse(res, null, "Status dikembalikan ke VERIFIED");
  } catch (error) {
    logger.error("Revert jamaah error", error, {
      bookingNumber: req.params?.bookingNumber,
    });
    next(error);
  }
};
