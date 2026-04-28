// backend/src/controllers/agenJamaahController.js
import { db } from "../db/index.js";
import {
  jamaahData,
  users,
  packages,
  jamaahPayments,
  agentData,
} from "../db/schema.js";
import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { sendCredentialsEmail } from "../utils/email.js"; // ✅ TAMBAH INI
import { hashPassword, generatePassword } from "../utils/password.js";
import {
  successResponse,
  errorResponse,
  createdResponse,
  notFoundResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

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

// Prefer shared secure password generator

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

const createJamaahDataWithRetry = async (buildValues, maxRetries = 5) => {
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

// ===== HELPER: Check Profile Completeness =====
const checkProfileComplete = (jamaah) => {
  const requiredFields = {
    namaPaspor: jamaah.namaPaspor,
    nik: jamaah.nik,
    birthPlace: jamaah.birthPlace,
    birthDate: jamaah.birthDate,
    gender: jamaah.gender,
    address: jamaah.address,
    province: jamaah.province,
    city: jamaah.city,
    passportNumber: jamaah.passportNumber,
    passportExpiry: jamaah.passportExpiry,
    emergencyName: jamaah.emergencyName,
    emergencyPhone: jamaah.emergencyPhone,
  };

  const requiredDocs = {
    fotoUrl: jamaah.fotoUrl,
    ktpUrl: jamaah.ktpUrl,
    pasporUrl: jamaah.pasporUrl,
  };

  let filledFields = 0;
  let filledDocs = 0;

  for (const value of Object.values(requiredFields)) {
    if (value && String(value).trim() !== "") filledFields++;
  }

  for (const value of Object.values(requiredDocs)) {
    if (value && String(value).trim() !== "") filledDocs++;
  }

  const totalRequired =
    Object.keys(requiredFields).length + Object.keys(requiredDocs).length;
  const totalFilled = filledFields + filledDocs;
  const percentage = Math.round((totalFilled / totalRequired) * 100);

  return {
    isComplete: totalFilled === totalRequired,
    percentage,
    totalRequired,
    totalFilled,
  };
};


// =====================================================
// GET MY JAMAAH
// =====================================================
export const getMyJamaah = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ users.id = 3
    const { search, status, page = 1, limit = 20 } = req.query;

    logger.debug("Agen get my jamaah", { userId });

    // ❌ HAPUS LOOKUP agent_data - tidak perlu lagi!
    // const agent = await db.query.agentData.findFirst({
    //   where: eq(agentData.userId, agenUserId),
    // });
    // if (!agent) { ... }
    // NOTE:
    // Sebagian data lama masih menyimpan agen_id = agent_data.id,
    // sedangkan data baru menyimpan agen_id = users.id.
    // Jadi untuk backward compatibility, query harus membaca keduanya.
    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
      columns: { id: true },
    });

    const conditions = [
      agent
        ? or(eq(jamaahData.agenId, userId), eq(jamaahData.agenId, agent.id))
        : eq(jamaahData.agenId, userId),
    ];

    if (status && status !== "all") {
      conditions.push(eq(jamaahData.registrationStatus, status));
    }

    const jamaahList = await db.query.jamaahData.findMany({
      where: and(...conditions),
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
          columns: {
            id: true,
            name: true,
            type: true,
            departureDate: true,
            returnDate: true,
            price: true,
            discountPrice: true,
          },
        },
      },
      orderBy: [desc(jamaahData.createdAt)],
    });

    logger.info("Agen jamaah list loaded", { userId, count: jamaahList.length });

    let filteredList = jamaahList;
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filteredList = jamaahList.filter((j) => {
        const namaUser = (j.user?.fullName || "").toLowerCase();
        const namaPaspor = (j.namaPaspor || "").toLowerCase();
        const email = (j.user?.email || "").toLowerCase();
        const phone = (j.user?.phone || "").toLowerCase();
        const booking = (j.bookingNumber || "").toLowerCase();

        return (
          namaUser.includes(searchLower) ||
          namaPaspor.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          booking.includes(searchLower)
        );
      });
    }

    const result = filteredList.map((j) => {
      const profileCheck = checkProfileComplete(j);

      return {
        id: j.id,
        bookingNumber: j.bookingNumber,
        status: j.registrationStatus,
        statusPayment: j.statusPayment,
        user: {
          id: j.user?.id,
          fullName: j.user?.fullName || j.namaPaspor || "-",
          email: j.user?.email || "-",
          phone: j.user?.phone || "-",
        },
        namaPaspor: j.namaPaspor,
        package: j.package
          ? {
              id: j.package.id,
              title: j.package.name,
              name: j.package.name,
              type: j.package.type,
              departureDate: j.package.departureDate,
              returnDate: j.package.returnDate,
              price: j.package.discountPrice || j.package.price,
            }
          : null,
        hargaFinal: j.hargaFinal,
        totalPayment: j.totalPayment,
        outstanding: j.outstanding,
        isProfileComplete: profileCheck.isComplete,
        profileCompleteness: {
          percentage: profileCheck.percentage,
          totalRequired: profileCheck.totalRequired,
          totalFilled: profileCheck.totalFilled,
        },
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      };
    });

    const total = result.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResult = result.slice(
      startIndex,
      startIndex + parseInt(limit),
    );

    const stats = {
      total: result.length,
      complete: result.filter((j) => j.isProfileComplete).length,
      incomplete: result.filter((j) => !j.isProfileComplete).length,
      lunas: result.filter((j) => j.statusPayment === "LUNAS").length,
      cicilan: result.filter((j) => j.statusPayment === "CICILAN").length,
      belumBayar: result.filter((j) => j.statusPayment === "BELUM_BAYAR")
        .length,
    };

    return successResponse(res, {
        jamaah: paginatedResult,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
    });
  } catch (error) {
    logger.error("Agen get my jamaah error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// GET JAMAAH BY ID
// =====================================================
export const getJamaahById = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ users.id
    const { id } = req.params;

    logger.debug("Agen get jamaah by id", { userId, id });

    // ❌ HAPUS lookup agent_data
    // const agent = await db.query.agentData.findFirst({...});

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
      columns: { id: true },
    });

    const ownershipCondition = agent
      ? or(eq(jamaahData.agenId, userId), eq(jamaahData.agenId, agent.id))
      : eq(jamaahData.agenId, userId);

    const jamaah = await db.query.jamaahData.findFirst({
      where: and(
        eq(jamaahData.id, parseInt(id)),
        ownershipCondition,
      ),
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
        mahram: {
          with: {
            user: {
              columns: { fullName: true },
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

    return successResponse(res, jamaah);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE JAMAAH (oleh Agen) - ✅ WITH EMAIL
// =====================================================
export const createJamaah = async (req, res, next) => {
  try {
    const agenUserId = req.user.userId;
    const { fullName, email, phone, packageId, roomType } = req.body;

    // logger.debug("Agen create jamaah", { packageId });

    // Validasi input
    if (!fullName || !email || !phone) {
      return errorResponse(res, "Nama, email, dan nomor HP wajib diisi", 400);
    }

    // Cari agent data
    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, agenUserId),
    });

    if (!agent) {
      return notFoundResponse(res, "Data agen tidak ditemukan");
    }

    if (agent.status !== "APPROVED") {
      return errorResponse(
        res,
        "Agen belum diapprove. Tidak dapat mendaftarkan jamaah.",
        403
      );
    }

    // Cek email existing
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    let jamaahUserId;
    let generatedPassword = null;
    let isNewUser = false;

    if (existingUser) {
      const existingJamaah = await db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, existingUser.id),
      });

        if (existingJamaah) {
        return errorResponse(
          res,
          "Email sudah terdaftar sebagai jamaah",
          400,
          { bookingNumber: existingJamaah.bookingNumber }
        );
      }
      jamaahUserId = existingUser.id;
    } else {
      // Generate password
      generatedPassword = generatePassword(12);
      const hashedPassword = await hashPassword(generatedPassword);

      const [newUser] = await db
        .insert(users)
        .values({
          fullName: fullName.toUpperCase(),
          email: email.toLowerCase(),
          phone,
          password: hashedPassword,
          role: "JAMAAH",
          createdBy: agenUserId,
          isActive: true,
        })
        .$returningId();

      jamaahUserId = newUser.id;
      isNewUser = true;
      // logger.security("Jamaah user created", { userId: jamaahUserId, createdBy: agenUserId });
    }

    // Get package price
    let hargaPaket = "0";
    if (packageId) {
      const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, parseInt(packageId)),
      });
      if (pkg) {
        hargaPaket = pkg.discountPrice || pkg.price || "0";
      }
    }

    const { bookingNumber, newJamaah } = await createJamaahDataWithRetry(
      (generatedBookingNumber) => ({
        userId: jamaahUserId,
        agenId: agenUserId,
        packageId: packageId ? parseInt(packageId) : null,
        bookingNumber: generatedBookingNumber,
        dateOfBooking: new Date(),
        registrationStatus: "DRAFT",
        statusPayment: "BELUM_BAYAR",
        isProfileComplete: false,
        notePaket: "FULLSERVICE",
        roomTypeMakkah: roomType || null,
        roomTypeMadinah: roomType || null,
        hargaPaket: hargaPaket.toString(),
        potonganFeeAgen: "0",
        potonganPoinAgen: "0",
        potonganCashbackKK: "0",
        hargaFinal: hargaPaket.toString(),
        totalPayment: "0",
        outstanding: hargaPaket.toString(),
      })
    );
    // Send credentials email for new accounts (best-effort)
    if (isNewUser && generatedPassword) {
      try {
        await sendCredentialsEmail(
          email.toLowerCase(),
          fullName.toUpperCase(),
          generatedPassword
        );
      } catch {
        // ignore email errors
      }
    }

    return createdResponse(
      res,
      {
        id: newJamaah.id,
        bookingNumber,
        userId: jamaahUserId,
        email: email.toLowerCase(),
        isNewUser,
        emailSent: isNewUser,
      },
      isNewUser
        ? "Jamaah berhasil didaftarkan. Kredensial login telah dikirim ke email."
        : "Jamaah berhasil didaftarkan dengan akun yang sudah ada."
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE JAMAAH
// =====================================================
export const updateJamaah = async (req, res, next) => {
  try {
    const agenUserId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    logger.debug("Agen update jamaah", { agenUserId, id });

    const parsedId = parsePositiveInt(id);
    if (!parsedId) {
      return errorResponse(res, "ID jamaah tidak valid", 400);
    }

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, agenUserId),
    });

    if (!agent) {
      return notFoundResponse(res, "Data agen tidak ditemukan");
    }

    const existing = await db.query.jamaahData.findFirst({
      where: and(
        eq(jamaahData.id, parsedId),
        or(eq(jamaahData.agenId, agenUserId), eq(jamaahData.agenId, agent.id)),
      ),
    });

    if (!existing) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan atau bukan milik Anda");
    }

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
      "roomTypeMakkah",
      "roomTypeMadinah",
      "mahramId",
      "mahramRelation",
      "notes",
    ];

    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        if (key === "packageId" || key === "mahramId") {
          filteredData[key] = updateData[key]
            ? parsePositiveInt(updateData[key])
            : null;
        } else {
          filteredData[key] = updateData[key];
        }
      }
    }

    if (updateData.packageId && updateData.packageId !== existing.packageId) {
      const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, parsePositiveInt(updateData.packageId)),
      });
      if (pkg) {
        const harga = parseFloat(pkg.discountPrice || pkg.price) || 0;
        filteredData.hargaPaket = harga.toString();
        filteredData.hargaFinal = harga.toString();
        filteredData.outstanding = (
          harga - parseFloat(existing.totalPayment || "0")
        ).toString();
      }
    }

    await db
      .update(jamaahData)
      .set({
        ...filteredData,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, parsedId));

    logger.info("Agen jamaah updated", { agenUserId, jamaahId: parsedId });

    return successResponse(res, null, "Data jamaah berhasil diupdate");
  } catch (error) {
    logger.error("Agen update jamaah error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// GET DASHBOARD STATS
// =====================================================
export const getJamaahCompleteness = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const jamaahId = parsePositiveInt(req.params.id);

    if (!jamaahId) {
      return errorResponse(res, "ID jamaah tidak valid", 400);
    }

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
      columns: { id: true },
    });

    const ownershipCondition = agent
      ? or(eq(jamaahData.agenId, userId), eq(jamaahData.agenId, agent.id))
      : eq(jamaahData.agenId, userId);

    const jamaah = await db.query.jamaahData.findFirst({
      where: and(eq(jamaahData.id, jamaahId), ownershipCondition),
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
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!jamaah) {
      return notFoundResponse(res, "Data jamaah tidak ditemukan");
    }

    const profileCheck = checkProfileComplete(jamaah);
    const requiredFields = [
      { key: "namaPaspor", label: "Nama Paspor", category: "biodata" },
      { key: "nik", label: "NIK", category: "biodata" },
      { key: "birthDate", label: "Tanggal Lahir", category: "biodata" },
      { key: "birthPlace", label: "Tempat Lahir", category: "biodata" },
      { key: "gender", label: "Jenis Kelamin", category: "biodata" },
      { key: "maritalStatus", label: "Status Pernikahan", category: "biodata" },
      { key: "address", label: "Alamat", category: "alamat" },
      { key: "province", label: "Provinsi", category: "alamat" },
      { key: "city", label: "Kota", category: "alamat" },
      { key: "passportNumber", label: "Nomor Paspor", category: "paspor" },
      { key: "passportExpiry", label: "Masa Berlaku Paspor", category: "paspor" },
      { key: "passportIssuePlace", label: "Tempat Terbit Paspor", category: "paspor" },
      { key: "emergencyName", label: "Nama Kontak Darurat", category: "emergency" },
      { key: "emergencyPhone", label: "No. HP Darurat", category: "emergency" },
      { key: "packageId", label: "Paket Umrah", category: "paket" },
      { key: "roomTypeMakkah", label: "Kamar Makkah", category: "paket" },
      { key: "roomTypeMadinah", label: "Kamar Madinah", category: "paket" },
    ];

    const requiredDocs = [
      { key: "fotoUrl", label: "Pas Foto", category: "dokumen" },
      { key: "ktpUrl", label: "KTP", category: "dokumen" },
      { key: "kkUrl", label: "Kartu Keluarga", category: "dokumen" },
      { key: "pasporUrl", label: "Scan Paspor", category: "dokumen" },
    ];

    const allFields = [...requiredFields, ...requiredDocs];
    const missing = [];
    const categories = {};
    let filled = 0;

    for (const field of allFields) {
      const value = jamaah[field.key];
      const isFilled = value !== null && value !== undefined && value !== "";

      if (!categories[field.category]) {
        categories[field.category] = { total: 0, passed: 0, complete: false };
      }

      categories[field.category].total += 1;

      if (isFilled) {
        filled += 1;
        categories[field.category].passed += 1;
      } else {
        missing.push({ label: field.label, category: field.category, key: field.key });
      }
    }

    for (const category of Object.keys(categories)) {
      categories[category].complete =
        categories[category].passed === categories[category].total;
    }

    const total = allFields.length;
    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

    return successResponse(res, {
      jamaah: {
        id: jamaah.id,
        bookingNumber: jamaah.bookingNumber,
        namaPaspor: jamaah.namaPaspor,
        user: jamaah.user,
        package: jamaah.package,
        registrationStatus: jamaah.registrationStatus,
        statusPayment: jamaah.statusPayment,
      },
      isComplete: percentage >= 80,
      percentage,
      filled,
      total,
      missing,
      categories,
      summary: {
        isProfileComplete: profileCheck.isComplete,
        percentage: profileCheck.percentage,
        totalRequired: profileCheck.totalRequired,
        totalFilled: profileCheck.totalFilled,
      },
    });
  } catch (error) {
    logger.error("Agen get jamaah completeness error", error, {
      userId: req.user?.userId,
      jamaahId: req.params?.id,
    });
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ users.id

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
    });

    if (!agent) {
      return notFoundResponse(res, "Data agen tidak ditemukan");
    }

    const jamaahList = await db.query.jamaahData.findMany({
      where: or(eq(jamaahData.agenId, userId), eq(jamaahData.agenId, agent.id)),
      columns: {
        id: true,
        statusPayment: true,
        registrationStatus: true,
        hargaFinal: true,
        totalPayment: true,
      },
    });

    const totalJamaah = jamaahList.length;
    const totalLunas = jamaahList.filter(
      (j) => j.statusPayment === "LUNAS",
    ).length;
    const totalCicilan = jamaahList.filter(
      (j) => j.statusPayment === "CICILAN",
    ).length;
    const totalBelumBayar = jamaahList.filter(
      (j) => j.statusPayment === "BELUM_BAYAR",
    ).length;

    const totalRevenue = jamaahList
      .filter((j) => j.statusPayment === "LUNAS")
      .reduce((sum, j) => sum + parseFloat(j.hargaFinal || "0"), 0);

    return successResponse(res, {
        totalJamaah,
        totalLunas,
        totalCicilan,
        totalBelumBayar,
        totalRevenue,
        totalClosing: totalLunas,
    });
  } catch (error) {
    logger.error("Agen dashboard stats error", error, { userId: req.user?.userId });
    next(error);
  }
};
