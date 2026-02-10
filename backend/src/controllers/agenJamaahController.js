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
import bcrypt from "bcrypt"; // atau bcryptjs
import { sendCredentialsEmail } from "../utils/email.js"; // ✅ TAMBAH INI

// ===== HELPER: Generate Random Password =====
const generateRandomPassword = (length = 8) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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

    console.log("📥 AGEN GET MY JAMAAH - UserId:", userId);

    // ❌ HAPUS LOOKUP agent_data - tidak perlu lagi!
    // const agent = await db.query.agentData.findFirst({
    //   where: eq(agentData.userId, agenUserId),
    // });
    // if (!agent) { ... }
    // console.log("📥 Agent ID:", agent.id);

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

    console.log(`✅ Found ${jamaahList.length} jamaah for userId: ${userId}`);

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

    return res.json({
      success: true,
      data: {
        jamaah: paginatedResult,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("❌ AGEN GET MY JAMAAH ERROR:", error);
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

    console.log("📥 AGEN GET JAMAAH BY ID:", id, "- UserId:", userId);

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
        user: true,
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
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan atau bukan milik Anda",
      });
    }

    return res.json({ success: true, data: jamaah });
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

    console.log("📥 AGEN CREATE JAMAAH:", {
      fullName,
      email,
      phone,
      packageId,
    });

    // Validasi input
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan nomor HP wajib diisi",
      });
    }

    // Cari agent data
    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, agenUserId),
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Data agen tidak ditemukan",
      });
    }

    if (agent.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Agen belum diapprove. Tidak dapat mendaftarkan jamaah.",
      });
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
        return res.status(400).json({
          success: false,
          message: "Email sudah terdaftar sebagai jamaah",
          bookingNumber: existingJamaah.bookingNumber,
        });
      }
      jamaahUserId = existingUser.id;
    } else {
      // Generate password
      generatedPassword = generateRandomPassword(8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

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
      console.log("✅ New user created:", jamaahUserId);
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


console.log("✅ Created jamaah:", bookingNumber, "by agent:", agent.id);

// ✅ KIRIM EMAIL KREDENSIAL
if (isNewUser && generatedPassword) {
  console.log("📧 Attempting to send credentials email to:", email);

  try {
    const emailResult = await sendCredentialsEmail(
      email.toLowerCase(),
      fullName.toUpperCase(),
      generatedPassword,
    );

    if (emailResult && emailResult.success) {
      console.log(
        "✅ Email sent successfully! MessageId:",
        emailResult.messageId,
      );
    } else {
      console.error("❌ Email failed:", emailResult?.error || "Unknown error");
    }
  } catch (emailError) {
    console.error("❌ Email exception:", emailError.message);
    console.error("❌ Full error:", emailError);
  }
} else {
  console.log(
    "⏭️ Skipping email - isNewUser:",
    isNewUser,
    "hasPassword:",
    !!generatedPassword,
  );
}

    return res.status(201).json({
      success: true,
      message: isNewUser
        ? "Jamaah berhasil didaftarkan. Kredensial login telah dikirim ke email."
        : "Jamaah berhasil didaftarkan dengan akun yang sudah ada.",
      data: {
        id: newJamaah.id,
        bookingNumber,
        userId: jamaahUserId,
        email: email.toLowerCase(),
        isNewUser,
        emailSent: isNewUser,
      },
    });
  } catch (error) {
    console.error("❌ AGEN CREATE JAMAAH ERROR:", error);
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

    console.log("📥 AGEN UPDATE JAMAAH:", id, updateData);

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, agenUserId),
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Data agen tidak ditemukan",
      });
    }

    const existing = await db.query.jamaahData.findFirst({
      where: and(
        eq(jamaahData.id, parseInt(id)),
        or(eq(jamaahData.agenId, agenUserId), eq(jamaahData.agenId, agent.id)),
      ),
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan atau bukan milik Anda",
      });
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
            ? parseInt(updateData[key])
            : null;
        } else {
          filteredData[key] = updateData[key];
        }
      }
    }

    if (updateData.packageId && updateData.packageId !== existing.packageId) {
      const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, parseInt(updateData.packageId)),
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
      .where(eq(jamaahData.id, parseInt(id)));

    console.log("✅ Updated jamaah:", id);

    return res.json({
      success: true,
      message: "Data jamaah berhasil diupdate",
    });
  } catch (error) {
    console.error("❌ AGEN UPDATE JAMAAH ERROR:", error);
    next(error);
  }
};

// =====================================================
// GET DASHBOARD STATS
// =====================================================
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.userId; // ✅ users.id

    const agent = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Data agen tidak ditemukan",
      });
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

    return res.json({
      success: true,
      data: {
        totalJamaah,
        totalLunas,
        totalCicilan,
        totalBelumBayar,
        totalRevenue,
        totalClosing: totalLunas,
      },
    });
  } catch (error) {
    console.error("❌ AGEN DASHBOARD STATS ERROR:", error);
    next(error);
  }
};
