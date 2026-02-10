// backend/src/controllers/agenController.js
import { db } from "../db/index.js";
import {
  users,
  jamaahData,
  packages,
  agentData,
  agentLevels,
  agentBenefits,
  agentRequirements,
  agentPurposes,
    agentPaymentTransactions,
  agentClosingHistory,
  periods,
} from "../db/schema.js";
import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";
import { hashPassword } from "../utils/password.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendWelcomeEmail } from "../utils/email.js";
import { notifyAdmins } from "./notificationController.js";

const getBookedSeats = async (packageId) => {
  const [result] = await db
    .select({ count: count() })
    .from(jamaahData)
    .where(
      and(
        eq(jamaahData.packageId, packageId),
        sql`${jamaahData.registrationStatus} IN ('DRAFT','PENDING_DOCUMENT','PENDING_PAYMENT','VERIFIED','APPROVED')`
      )
    );

  return Number(result?.count || 0);
};


// =====================================================
// CREATE JAMAAH ACCOUNT (Agen Provisioning)
// =====================================================
export const createJamaahAccount = async (req, res, next) => {
  try {
    const { fullName, email, phone, packageId, roomType } = req.body;
    const agenId = req.user.userId; // From JWT middleware
    const parsedPackageId = parseInt(packageId, 10);

    if (!Number.isInteger(parsedPackageId) || parsedPackageId <= 0) {
      return errorResponse(res, "Package ID tidak valid", 400);
    }

    // Check if package exists
    const packageData = await db.query.packages.findFirst({
      where: eq(packages.id, parsedPackageId),
    });

    if (!packageData) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    // Check if package is available
    if (!packageData.isActive || !packageData.isPublished) {
      return errorResponse(res, "Paket tidak tersedia", 400);
    }

    // Check seat availability
    const bookedSeats = await getBookedSeats(parsedPackageId);
    if (bookedSeats >= packageData.totalSeats) {
      return errorResponse(res, "Kursi paket sudah penuh", 400);
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return errorResponse(res, "Email sudah terdaftar", 409);
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    const hashedPassword = await hashPassword(randomPassword);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create User Account
      const [newUser] = await tx
        .insert(users)
        .values({
          email: email,
          password: hashedPassword,
          role: "JAMAAH",
          fullName: fullName,
          phone: phone,
          createdBy: agenId,
          isActive: true,
          isEmailVerified: false,
        })
        .$returningId();

      // 2. Create Jamaah Data
      const [newJamaah] = await tx
        .insert(jamaahData)
        .values({
          userId: newUser.id,
          fullName: fullName,
          phone: phone,
          email: email,
          packageId: parsedPackageId,
          roomTypeMakkah: roomType || "QUAD",
          roomTypeMadinah: roomType || "QUAD",
          agenId: agenId,
          registrationStatus: "DRAFT",
          isProfileComplete: false,
        })
        .$returningId();

      return { userId: newUser.id, jamaahId: newJamaah.id };
    });

    // Send welcome email with credentials
    const welcomeData = {
      fullName: fullName,
      email: email,
      role: "JAMAAH",
      isActive: true,
      temporaryPassword: randomPassword,
    };

    await sendWelcomeEmail(welcomeData);

    return successResponse(
      res,
      {
        userId: result.userId,
        jamaahId: result.jamaahId,
        email: email,
        temporaryPassword: randomPassword,
        message:
          "Akun jamaah berhasil dibuat. Credentials telah dikirim via email.",
      },
      "Provisioning jamaah berhasil",
      201
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET JAMAAH LIST (By Agen)
// =====================================================
export const getMyJamaahList = async (req, res, next) => {
  try {
    // ✅ jamaah_data.agen_id = users.id (bukan agent_data.id!)
    const userId = req.user.userId;

    console.log("📥 AGEN GET MY JAMAAH - UserId:", userId);
    // ❌ HAPUS LOG "Agent ID" - tidak perlu lookup agent_data lagi!

    // ✅ Query langsung dengan userId
    const jamaahList = await db.query.jamaahData.findMany({
      where: eq(jamaahData.agenId, userId),
      with: {
        user: {
          columns: {
            password: false,
            otp: false,
            otpExpiry: false,
          },
        },
        package: true,
      },
      orderBy: [desc(jamaahData.createdAt)],
    });

    console.log(`✅ Found ${jamaahList.length} jamaah for userId: ${userId}`);

    return successResponse(res, jamaahList);
  } catch (error) {
    console.error("❌ getMyJamaahList error:", error);
    next(error);
  }
};
// =====================================================
// ADMIN: GET ALL AGENTS (List)
// =====================================================
export const getAll = async (req, res, next) => {
  try {
    const { star, status, obtainedBy, search } = req.query;

    // Build where conditions
    let whereConditions = [eq(users.role, "AGEN")];

    const agents = await db.query.users.findMany({
      where: and(...whereConditions),
      with: {
        agentData: {
          with: {
            currentLevel: {
              with: {
                benefits: {
                  orderBy: [asc(agentBenefits.order)],
                },
              },
            },
          },
        },
      },
      orderBy: [desc(users.createdAt)],
    });

    // Filter by agent-specific criteria
    let filteredAgents = agents;

    if (star !== undefined && star !== "all") {
      filteredAgents = filteredAgents.filter(
        (a) => a.agentData?.currentStar === parseInt(star)
      );
    }

    if (status && status !== "all") {
      filteredAgents = filteredAgents.filter(
        (a) => a.agentData?.status === status
      );
    }

    if (obtainedBy && obtainedBy !== "all") {
      filteredAgents = filteredAgents.filter(
        (a) => a.agentData?.starObtainedBy === obtainedBy
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredAgents = filteredAgents.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(searchLower) ||
          a.email?.toLowerCase().includes(searchLower) ||
          a.agentData?.fullNameKtp?.toLowerCase().includes(searchLower)
      );
    }

    // Count jamaah per agent
    const agentsWithStats = await Promise.all(
      filteredAgents.map(async (agent) => {
        const [jamaahCount] = await db
          .select({ count: count() })
          .from(jamaahData)
          .where(eq(jamaahData.agenId, agent.id));

        return {
          ...agent,
          totalJamaah: jamaahCount.count || 0,
          agentData: {
            ...agent.agentData,
            // Remove sensitive data
            password: undefined,
            otp: undefined,
            otpExpiry: undefined,
          },
        };
      })
    );

    return successResponse(res, agentsWithStats);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN: GET AGENT BY ID (Detail)
// =====================================================
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const agent = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "AGEN")),
      with: {
        agentData: {
          with: {
            currentLevel: {
              with: {
                benefits: {
                  orderBy: [asc(agentBenefits.order)],
                },
              },
            },
            transactions: true,
            closingHistory: {
              with: {
                period: true,
              },
              orderBy: [desc(agentClosingHistory.closingDate)],
            },
          },
        },
      },
    });

    if (!agent) {
      return errorResponse(res, "Agen tidak ditemukan", 404);
    }

    // Count jamaah
    const [jamaahCount] = await db
      .select({ count: count() })
      .from(jamaahData)
      .where(eq(jamaahData.agenId, agent.id));

    // Remove sensitive data
    delete agent.password;
    delete agent.otp;
    delete agent.otpExpiry;

    return successResponse(res, {
      ...agent,
      totalJamaah: jamaahCount.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN: UPDATE AGENT DATA
// =====================================================
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      // User data
      fullName,
      phone,
      isActive,
      // Agent data
      fullNameKtp,
      nickname,
      birthPlace,
      birthDate,
      nik,
      address,
      province,
      city,
      postalCode,
      instagram,
      tiktok,
      currentStar,
      accountName,
      accountNumber,
      bankName,
      status,
      isComplete,
    } = req.body;

    // Check if agent exists
    const agent = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "AGEN")),
      with: {
        agentData: true,
      },
    });

    if (!agent) {
      return errorResponse(res, "Agen tidak ditemukan", 404);
    }

    await db.transaction(async (tx) => {
      // Update user table
      if (fullName || phone !== undefined || isActive !== undefined) {
        await tx
          .update(users)
          .set({
            fullName,
            phone,
            isActive,
          })
          .where(eq(users.id, parseInt(id)));
      }

      // Update agent data
      if (agent.agentData) {
        await tx
          .update(agentData)
          .set({
            fullNameKtp,
            nickname,
            birthPlace,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            nik,
            address,
            province,
            city,
            postalCode,
            instagram,
            tiktok,
            currentStar,
            accountName,
            accountNumber,
            bankName,
            status,
            isComplete,
          })
          .where(eq(agentData.userId, parseInt(id)));
      }
    });

    return successResponse(res, null, "Data agen berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN: APPROVE AGENT
// =====================================================
export const approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const agent = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "AGEN")),
      with: {
        agentData: true,
      },
    });

    if (!agent || !agent.agentData) {
      return errorResponse(res, "Agen tidak ditemukan", 404);
    }

    if (agent.agentData.status !== "PENDING") {
      return errorResponse(
        res,
        "Hanya agen dengan status PENDING yang bisa diapprove",
        400
      );
    }

    await db
      .update(agentData)
      .set({
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionNote: null,
      })
      .where(eq(agentData.userId, parseInt(id)));

    return successResponse(res, null, "Agen berhasil diapprove");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN: REJECT AGENT
// =====================================================
export const reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionNote } = req.body;

    if (!rejectionNote) {
      return errorResponse(res, "Alasan penolakan wajib diisi", 400);
    }

    const agent = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "AGEN")),
      with: {
        agentData: true,
      },
    });

    if (!agent || !agent.agentData) {
      return errorResponse(res, "Agen tidak ditemukan", 404);
    }

    if (agent.agentData.status !== "PENDING") {
      return errorResponse(
        res,
        "Hanya agen dengan status PENDING yang bisa direject",
        400
      );
    }

    await db
      .update(agentData)
      .set({
        status: "REJECTED",
        rejectionNote,
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(agentData.userId, parseInt(id)));

    return successResponse(res, null, "Agen berhasil direject");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ADMIN: DELETE AGENT
// =====================================================
export const deleteAgent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const agent = await db.query.users.findFirst({
      where: and(eq(users.id, parseInt(id)), eq(users.role, "AGEN")),
    });

    if (!agent) {
      return errorResponse(res, "Agen tidak ditemukan", 404);
    }

    // Check if agent has jamaah
    const [jamaahCount] = await db
      .select({ count: count() })
      .from(jamaahData)
      .where(eq(jamaahData.agenId, parseInt(id)));

    if (jamaahCount.count > 0) {
      return errorResponse(
        res,
        "Tidak dapat menghapus agen yang masih memiliki jamaah",
        400
      );
    }

    // Delete user (cascade will delete agentData)
    await db.delete(users).where(eq(users.id, parseInt(id)));

    return successResponse(res, null, "Agen berhasil dihapus");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// AGEN: GET MY PROFILE
// =====================================================
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // ✅ Query tanpa nested relations dulu (untuk test)
    const agent = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        agentData: true, // ✅ SIMPLE - tanpa nested with
      },
    });

    if (!agent) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Remove sensitive data
    delete agent.password;
    delete agent.otp;
    delete agent.otpExpiry;

    // Count jamaah
    const [jamaahCount] = await db
      .select({ count: count() })
      .from(jamaahData)
      .where(eq(jamaahData.agenId, userId));

    return successResponse(res, {
      ...agent,
      totalJamaah: jamaahCount.count || 0,
    });
  } catch (error) {
    console.error("❌ GET MY PROFILE ERROR:", error);
    next(error);
  }
};

// =====================================================
// AGEN: UPDATE MY PROFILE
// =====================================================
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      // ✅ TAMBAH 3 FIELD INI (untuk update users table)
      fullName,
      email,
      phone,

      // Yang lama (untuk agentData table)
      fullNameKtp,
      nickname,
      birthPlace,
      birthDate,
      nik,
      address,
      province,
      city,
      postalCode,
      instagram,
      facebook, // ✅ TAMBAH INI
      tiktok,
      accountName,
      accountNumber,
      bankName,
      currentLevelId,
      starObtainedBy,
      purposes,
      customPurpose,
      agreedRequirements,
    } = req.body;

    const agent = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        agentData: true,
      },
    });

    if (!agent) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // ✅ START TRANSACTION
    await db.transaction(async (tx) => {
      
      // ✅ 1. UPDATE USERS TABLE (jika ada perubahan)
      const usersUpdate = {};
      if (fullName !== undefined) usersUpdate.fullName = fullName;
      if (email !== undefined) usersUpdate.email = email;
      if (phone !== undefined) usersUpdate.phone = phone;

      if (Object.keys(usersUpdate).length > 0) {
        await tx
          .update(users)
          .set(usersUpdate)
          .where(eq(users.id, userId));
      }

      // ✅ 2. UPDATE/CREATE AGENT DATA
      const agentDataUpdate = {
        fullNameKtp,
        nickname,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        nik,
        address,
        province,
        city,
        postalCode,
        instagram,
        facebook, // ✅ TAMBAH INI
        tiktok,
        accountName,
        accountNumber,
        bankName,
        currentLevelId:
          currentLevelId !== undefined && currentLevelId !== null
            ? parseInt(currentLevelId)
            : undefined,
        starObtainedBy,
        purposes: purposes ? JSON.stringify(purposes) : undefined,
        customPurpose,
        agreedRequirements: agreedRequirements
          ? JSON.stringify(agreedRequirements)
          : undefined,
      };

      // Remove undefined values
      Object.keys(agentDataUpdate).forEach(
        (key) => agentDataUpdate[key] === undefined && delete agentDataUpdate[key]
      );

      if (!agent.agentData) {
        // Create new agentData
        await tx.insert(agentData).values({
          userId: userId,
          ...agentDataUpdate,
          status: "DRAFT",
          isComplete: false,
        });
      } else {
        // Update existing agentData
        await tx
          .update(agentData)
          .set(agentDataUpdate)
          .where(eq(agentData.userId, userId));
      }
    });

    return successResponse(res, null, "Profil berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// AGEN: SUBMIT FOR APPROVAL
// =====================================================
export const submitForApproval = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const agent = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        agentData: true,
      },
    });

    if (!agent || !agent.agentData) {
      return errorResponse(res, "Data agen belum lengkap", 400);
    }

    if (!["DRAFT", "REJECTED"].includes(agent.agentData.status)) {
      return errorResponse(res, "Agen sudah submit sebelumnya", 400);
    }

    // Validate required fields
    const requiredFields = [
      "fullNameKtp",
      "nik",
      "birthPlace",
      "birthDate",
      "address",
      "province",
      "city",
      "accountName",
      "accountNumber",
      "bankName",
    ];

    for (const field of requiredFields) {
      if (!agent.agentData[field]) {
        return errorResponse(res, `Field ${field} wajib diisi`, 400);
      }
    }

    await db
      .update(agentData)
      .set({
        status: "PENDING",
        isComplete: true,
        submittedAt: new Date(),
      })
      .where(eq(agentData.userId, userId));

    // ✅ KIRIM NOTIFIKASI KE ADMIN
    await notifyAdmins({
      type: "AGENT_SUBMITTED",
      title: "Agen Baru Menunggu Approval",
      message: `${agent.agentData.fullNameKtp || agent.fullName} telah mengajukan pendaftaran agen`,
      link: `/admin/agen/${userId}`,
      referenceId: userId,
      referenceType: "agent",
    });

    return successResponse(res, null, "Data berhasil disubmit untuk approval");
  } catch (error) {
    next(error);
  }
};


import multer from "multer";
import path from "path";
import fs from "fs";

// ===== MULTER CONFIG =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "public", "uploads", "agents");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ Naikkan jadi 5MB
  fileFilter: (req, file, cb) => {
    console.log("📸 UPLOAD FILE:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // ✅ PERBAIKI REGEX (case-insensitive)
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp", // ✅ Tambah webp (modern browser)
    ];

    const allowedExts = /\.(jpeg|jpg|png|webp)$/i;

    const mimeValid = allowedMimes.includes(file.mimetype);
    const extValid = allowedExts.test(file.originalname.toLowerCase());

    console.log("✅ Validation:", { mimeValid, extValid });

    if (mimeValid && extValid) {
      return cb(null, true);
    } else {
      console.error("❌ REJECTED:", file.mimetype, file.originalname);
      cb(
        new Error(
          `File tidak valid. Mimetype: ${file.mimetype}, Filename: ${file.originalname}`
        )
      );
    }
  },
});

// ===== UPLOAD KTP =====
export const uploadKtp = [
  upload.single("ktp"),
  async (req, res, next) => {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return errorResponse(res, "File KTP tidak ditemukan", 400);
      }

      // ✅ GANTI INI - return FULL URL
      const baseUrl = process.env.BACKEND_URL || `http://localhost:5000`;
      const fileUrl = `${baseUrl}/uploads/agents/${req.file.filename}`;

      console.log("✅ KTP UPLOADED:", fileUrl); // ✅ Debug

      // Update agent data
      await db
        .update(agentData)
        .set({ ktpPhoto: fileUrl })
        .where(eq(agentData.userId, userId));

      return successResponse(res, { url: fileUrl }, "KTP berhasil diupload");
    } catch (error) {
      next(error);
    }
  },
];

// ===== UPLOAD PAYMENT PROOF =====
export const uploadPaymentProof = [
  upload.single("proof"),
  async (req, res, next) => {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return errorResponse(res, "File bukti pembayaran tidak ditemukan", 400);
      }

      // ✅ SAMA - return FULL URL
      const baseUrl = process.env.BACKEND_URL || `http://localhost:5000`;
      const fileUrl = `${baseUrl}/uploads/agents/${req.file.filename}`;

      // Update agent data
      await db
        .update(agentData)
        .set({ paymentProof: fileUrl })
        .where(eq(agentData.userId, userId));

      return successResponse(
        res,
        { url: fileUrl },
        "Bukti pembayaran berhasil diupload"
      );
    } catch (error) {
      next(error);
    }
  },
];
