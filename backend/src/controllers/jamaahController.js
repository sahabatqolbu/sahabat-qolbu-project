// backend/src/controllers/jamaahController.js
import { db } from "../db/index.js";
import { jamaahData, users, packages, jamaahPayments } from "../db/schema.js";
import { eq, like, or, and, desc, sql } from "drizzle-orm";

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

// =====================================================
// SYNC USER JAMAAH → JAMAAH_DATA
// =====================================================
export const syncJamaahFromUsers = async (req, res, next) => {
  try {
    console.log("🔄 SYNC JAMAAH FROM USERS...");

    // Get semua user dengan role JAMAAH
    const jamaahUsers = await db.query.users.findMany({
      where: eq(users.role, "JAMAAH"),
    });

    console.log(`📊 Found ${jamaahUsers.length} users with role JAMAAH`);

    // Get semua jamaah_data
    const existingJamaahData = await db.query.jamaahData.findMany();
    const existingUserIds = existingJamaahData.map((j) => j.userId);

    console.log(`📊 Existing jamaah_data count: ${existingJamaahData.length}`);
    console.log(`📊 Existing user IDs:`, existingUserIds);

    // Filter user yang BELUM punya jamaah_data
    const usersWithoutJamaahData = jamaahUsers.filter(
      (u) => !existingUserIds.includes(u.id)
    );

    console.log(
      `📊 Users without jamaah_data: ${usersWithoutJamaahData.length}`
    );

    if (usersWithoutJamaahData.length === 0) {
      return res.json({
        success: true,
        message: "Semua user JAMAAH sudah punya data jamaah",
        synced: 0,
        total: jamaahUsers.length,
      });
    }

    // Create jamaah_data untuk setiap user yang belum punya
    const results = [];
    for (const user of usersWithoutJamaahData) {
      try {
        const bookingNumber = await generateBookingNumber();

        await db.insert(jamaahData).values({
          userId: user.id,
          bookingNumber,
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
        });

        results.push({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          bookingNumber,
          status: "created",
        });

        console.log(
          `✅ Created jamaah_data for: ${user.fullName} → ${bookingNumber}`
        );
      } catch (err) {
        console.error(`❌ Failed to create for user ${user.id}:`, err.message);
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

    return res.json({
      success: true,
      message: `Berhasil sync ${successCount} dari ${usersWithoutJamaahData.length} user`,
      synced: successCount,
      total: jamaahUsers.length,
      details: results,
    });
  } catch (error) {
    console.error("❌ SYNC ERROR:", error);
    next(error);
  }
};

// =====================================================
// GET ALL JAMAAH (dengan data user)
// =====================================================
export const getAllJamaah = async (req, res, next) => {
  try {
    const { search, statusPayment, registrationStatus, packageId } = req.query;

    console.log("📥 GET ALL JAMAAH - Filters:", {
      search,
      statusPayment,
      registrationStatus,
      packageId,
    });

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

    // Query dengan relasi LENGKAP
    const jamaahList = await db.query.jamaahData.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true, // Ambil SEMUA field dari users
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
    });

    console.log(`📊 Raw jamaah count: ${jamaahList.length}`);

    // Debug log
    jamaahList.forEach((j, idx) => {
      console.log(
        `  [${idx}] Booking: ${j.bookingNumber}, UserId: ${j.userId}, User: ${
          j.user ? j.user.fullName : "NULL"
        }`
      );
    });

    // Filter search
    let filteredList = jamaahList;
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filteredList = jamaahList.filter((j) => {
        const namaUser = (j.user?.fullName || "").toLowerCase();
        const namaPaspor = (j.namaPaspor || "").toLowerCase();
        const booking = (j.bookingNumber || "").toLowerCase();
        const email = (j.user?.email || "").toLowerCase();
        const phone = (j.user?.phone || "").toLowerCase();
        const nik = (j.nik || "").toLowerCase();

        return (
          namaUser.includes(searchLower) ||
          namaPaspor.includes(searchLower) ||
          booking.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          nik.includes(searchLower)
        );
      });
    }

    // Transform response
    const result = filteredList.map((j) => ({
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

    console.log(`✅ Returning ${result.length} jamaah`);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ GET ALL JAMAAH ERROR:", error);
    next(error);
  }
};

// =====================================================
// GET JAMAAH BY BOOKING NUMBER
// =====================================================
export const getJamaahByBookingNumber = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    console.log("📥 GET JAMAAH BY BOOKING:", bookingNumber);

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
      with: {
        user: true,
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
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
    }

    console.log("✅ Found jamaah:", jamaah.bookingNumber);

    return res.json({
      success: true,
      data: jamaah,
    });
  } catch (error) {
    console.error("❌ GET JAMAAH BY BOOKING ERROR:", error);
    next(error);
  }
};

// =====================================================
// CREATE JAMAAH (Manual)
// =====================================================
export const createJamaah = async (req, res, next) => {
  try {
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
    } = req.body;

    console.log("📥 CREATE JAMAAH:", req.body);

    // Validasi user exists (jika ada userId)
    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(userId)),
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Cek apakah user sudah punya jamaah_data
      const existingJamaah = await db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, parseInt(userId)),
      });
      if (existingJamaah) {
        return res.status(400).json({
          success: false,
          message: "User sudah memiliki data jamaah",
          bookingNumber: existingJamaah.bookingNumber,
        });
      }
    }

    // Generate booking number
    const bookingNumber = await generateBookingNumber();

    // Calculate pricing
    const harga = parseFloat(hargaPaket) || 0;
    const feeAgen = parseFloat(potonganFeeAgen) || 0;
    const poinAgen = parseFloat(potonganPoinAgen) || 0;
    const cashback = parseFloat(potonganCashbackKK) || 0;
    const hargaFinal = harga - feeAgen - poinAgen - cashback;

    const [newJamaah] = await db
      .insert(jamaahData)
      .values({
        userId: userId ? parseInt(userId) : null,
        packageId: packageId ? parseInt(packageId) : null,
        agenId: req.user?.role === "AGEN" ? req.user.id : null,
        bookingNumber,
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
      .$returningId();

    console.log("✅ Created jamaah with booking:", bookingNumber);

    return res.status(201).json({
      success: true,
      message: "Jamaah berhasil ditambahkan",
      data: { id: newJamaah.id, bookingNumber },
    });
  } catch (error) {
    console.error("❌ CREATE JAMAAH ERROR:", error);
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
    const updateData = req.body;

    console.log("📥 UPDATE JAMAAH:", bookingNumber, updateData);

    // Cek exists
    const existing = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
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

    console.log("📝 Filtered data to update:", filteredData); // ✅ Debug log

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

    console.log("✅ Updated jamaah:", bookingNumber);
    console.log("   - agenId:", filteredData.agenId); // ✅ Confirm agenId

    return res.json({
      success: true,
      message: "Data jamaah berhasil diupdate",
    });
  } catch (error) {
    console.error("❌ UPDATE JAMAAH ERROR:", error);
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
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
    }

    if (existing.payments && existing.payments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Tidak dapat menghapus jamaah yang sudah memiliki riwayat pembayaran",
      });
    }

    await db
      .delete(jamaahData)
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    console.log("✅ Deleted jamaah:", bookingNumber);

    return res.json({
      success: true,
      message: "Data jamaah berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ DELETE JAMAAH ERROR:", error);
    next(error);
  }
};

// =====================================================
// PAYMENTS
// =====================================================
export const addPayment = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;
    const { amount, bankId, paidBy, paymentDate, proofUrl, notes } = req.body;

    console.log("📥 ADD PAYMENT:", bookingNumber, { amount, bankId });

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
      with: { payments: true },
    });

    if (!jamaah) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
    }

    const paymentNumber = (jamaah.payments?.length || 0) + 1;

    const [newPayment] = await db
      .insert(jamaahPayments)
      .values({
        jamaahId: jamaah.id,
        paymentNumber,
        amount: amount.toString(),
        bankId: bankId ? parseInt(bankId) : null,
        paidBy,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        proofUrl,
        notes,
      })
      .$returningId();

    // Update totals
    const totalPaid =
      parseFloat(jamaah.totalPayment || "0") + parseFloat(amount);
    const hargaFinal = parseFloat(jamaah.hargaFinal || "0");
    const outstanding = hargaFinal - totalPaid;

    let statusPayment = "BELUM_BAYAR";
    if (totalPaid >= hargaFinal && hargaFinal > 0) {
      statusPayment = "LUNAS";
    } else if (totalPaid > 0) {
      statusPayment = "CICILAN";
    }

    await db
      .update(jamaahData)
      .set({
        totalPayment: totalPaid.toString(),
        outstanding: outstanding.toString(),
        statusPayment,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.id, jamaah.id));

    console.log("✅ Added payment:", newPayment.id);

    return res.status(201).json({
      success: true,
      message: "Pembayaran berhasil ditambahkan",
      data: {
        paymentId: newPayment.id,
        paymentNumber,
        totalPaid,
        outstanding,
        statusPayment,
      },
    });
  } catch (error) {
    console.error("❌ ADD PAYMENT ERROR:", error);
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
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

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("❌ GET PAYMENTS ERROR:", error);
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.id, parseInt(paymentId)),
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pembayaran tidak ditemukan",
      });
    }

    await db
      .update(jamaahPayments)
      .set({
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jamaahPayments.id, parseInt(paymentId)));

    console.log("✅ Verified payment:", paymentId);

    return res.json({
      success: true,
      message: "Pembayaran berhasil diverifikasi",
    });
  } catch (error) {
    console.error("❌ VERIFY PAYMENT ERROR:", error);
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

    console.log("📥 APPROVE JAMAAH:", bookingNumber);

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
    }

    if (jamaah.registrationStatus === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Jamaah sudah di-approve sebelumnya",
      });
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

    console.log("✅ Approved jamaah:", bookingNumber);

    return res.json({
      success: true,
      message: "Jamaah berhasil di-approve",
      data: {
        bookingNumber,
        registrationStatus: "APPROVED",
        approvedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ APPROVE ERROR:", error);
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

    console.log("📥 REJECT JAMAAH:", bookingNumber);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Alasan penolakan harus diisi",
      });
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
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

    console.log("✅ Rejected jamaah:", bookingNumber);

    return res.json({
      success: true,
      message: "Jamaah berhasil di-reject",
      data: {
        bookingNumber,
        registrationStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  } catch (error) {
    console.error("❌ REJECT ERROR:", error);
    next(error);
  }
};

// =====================================================
// REVERT TO VERIFIED
// =====================================================
export const revertToVerified = async (req, res, next) => {
  try {
    const { bookingNumber } = req.params;

    console.log("📥 REVERT TO VERIFIED:", bookingNumber);

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return res.status(404).json({
        success: false,
        message: "Data jamaah tidak ditemukan",
      });
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

    console.log("✅ Reverted to VERIFIED:", bookingNumber);

    return res.json({
      success: true,
      message: "Status dikembalikan ke VERIFIED",
    });
  } catch (error) {
    console.error("❌ REVERT ERROR:", error);
    next(error);
  }
};