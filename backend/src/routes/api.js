// backend/src/routes/api.js
import express from "express";
import { and, eq } from "drizzle-orm";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  validate,
  authSchemas,
  adminUserSchemas,
  transactionSchemas,
} from "../validators/index.js";
import { authLimiter, otpLimiter, apiLimiter } from "../middlewares/rateLimiter.js";
import { db } from "../db/index.js";
import { agentData, jamaahData } from "../db/schema.js";

// ✅ IMPORT UPLOAD CUMA SEKALI (PALING ATAS)
import {
  upload,
  uploadPDF,
  savePDFPath,
  optimizeImage,
  optimizeMultipleImages,
  saveDocument,
} from "../utils/upload.js";

// Controllers
import {
  login,
  verifyOTPLogin,
  requestOTP,
  getCurrentUser,
  requestPasswordChangeOTP, // ✅ TAMBAH INI
  changePasswordWithOTP, // ✅ TAMBAH INI
  requestEmailChangeOTP, // ✅ TAMBAH INI
  changeEmailWithOTP, // ✅ TAMBAH INI
  logout,
} from "../controllers/authController.js";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  resetStaffPassword,
  getStaffStats,
} from "../controllers/staffController.js";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  importUsers,
  bulkDeleteUsers,
  bulkUpdateUserStatus,
} from "../controllers/adminController.js";
import {
  getAllTransactions,
  getTransactionById,
  verifyTransaction,
} from "../controllers/transactionController.js";
import {
  getSalesReport,
  getGrowthStats,
} from "../controllers/reportController.js";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  exportPackages,
  importPackages,
  uploadPackageImage,
  deletePackageImage,
  uploadItineraryPdf, // ✅ TAMBAH
  deleteItineraryPdf, // ✅ TAMBAH
} from "../controllers/packageController.js";
import {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  importHotels,
} from "../controllers/masterController.js";
import {
  getAllAirlines,
  getAirlineById,
  createAirline,
  updateAirline,
  deleteAirline,
} from "../controllers/airlineController.js";
import {
  getAllAirports,
  getAirportById,
  createAirport,
  updateAirport,
  deleteAirport,
} from "../controllers/airportController.js";
import {
  getAllBanks,
  getActiveBanks,
  createBank,
  updateBank,
  toggleBankStatus,
  deleteBank,
} from "../controllers/bankController.js";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "../controllers/faqController.js";
import {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
} from "../controllers/companyController.js";
import { getAdminDashboardStats } from "../controllers/dashboardController.js";

// Di bagian import, TAMBAH:
import {
  getEventsByRange,
  getEventsByPackage,
  createEvent,
  updateEvent,
  deleteEvent,
  bulkCreateItinerary,
  getUpcomingEvents,
  syncAllPackages, // TAMBAH INI
} from "../controllers/calendarController.js";

import {
  getAllJamaah,
  getJamaahByBookingNumber,
  createJamaah,
  updateJamaah,
  deleteJamaah,
  addPayment,
  getPayments,
  verifyPayment,
  syncJamaahFromUsers, // ✅ TAMBAH INI
  approveJamaah,
  rejectJamaah,
  revertToVerified,
} from "../controllers/jamaahController.js";

import * as agentLevelController from "../controllers/agentLevelController.js";
import * as agentRequirementController from "../controllers/agentRequirementController.js";
import * as agentPurposeController from "../controllers/agentPurposeController.js";
import * as periodController from "../controllers/periodController.js";
import * as agenController from "../controllers/agenController.js";
import {
  assignJamaahToPackage,
  sendJamaahNotification,
} from "../controllers/financePosController.js";
import * as packageController from "../controllers/packageController.js";
import * as agenJamaahController from "../controllers/agenJamaahController.js";

// ✅ Di bagian import, UPDATE menjadi:
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPendingAgentApprovalsCount,
  getJamaahNeedingReminder, // ✅ TAMBAH
  getAgenNeedingReminder, // ✅ TAMBAH
  sendReminder, // ✅ TAMBAH
  sendBulkReminder, // ✅ TAMBAH
  getAgenJamaahReminders, // ✅ TAMBAH
  agenSendReminderToJamaah, // ✅ TAMBAH
} from "../controllers/notificationController.js";


// Jamaah Self Controller
import {
  getMyProfile,
  updateMyBiodata,
  uploadMyDocument,
  submitForApproval,
  searchMahram,
  getMyPayments,
  getMyPackage,
  requestPackageConsultation,
} from "../controllers/jamaahSelfController.js";

// Multer setup
import multer from "multer";
import path from "path";
import fs from "fs";

// =====================================================
// MULTER CONFIG UNTUK JAMAAH DOCUMENTS
// =====================================================
const jamaahDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads/jamaah";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

const jamaahDocUpload = multer({
  storage: jamaahDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file JPG, PNG, atau PDF yang diizinkan"));
    }
  },
});



const router = express.Router();

// =====================================================
// PUBLIC ROUTES (No Auth Required)
// =====================================================
router.get("/health-check", (req, res) => res.json({ status: "API router is alive" }));

// Auth routes with rate limiting and validation
router.post("/auth/login", authLimiter, validate(authSchemas.login), login);
router.post("/auth/verify-otp", otpLimiter, validate(authSchemas.verifyOTP), verifyOTPLogin);
router.post("/auth/request-otp", authLimiter, validate(authSchemas.requestOTP), requestOTP);
router.get("/auth/test-public", (req, res) => res.json({ message: "Public route works" }));

// =====================================================
// PROTECTED ROUTES (Auth Required)
// =====================================================
router.get("/auth/me", authenticate, getCurrentUser);

// ✅ TAMBAHKAN 2 BARIS INI TEPAT DI BAWAH /auth/me
router.post("/auth/password/request-otp", authenticate, authLimiter, requestPasswordChangeOTP);
router.post("/auth/password/change", authenticate, otpLimiter, validate(authSchemas.changePassword), changePasswordWithOTP);

// ✅ GANTI EMAIL ROUTES
router.post("/auth/email/request-otp", authenticate, authLimiter, requestEmailChangeOTP);
router.post("/auth/email/change", authenticate, otpLimiter, validate(authSchemas.changeEmail), changeEmailWithOTP);
router.post("/auth/logout", authenticate, logout);




// =====================================================
// JAMAAH SELF-SERVICE ROUTES
// ⚠️ TARUH SEBELUM /admin/jamaah routes!
// =====================================================
router.get(
  "/jamaah/profile",
  authenticate,
  authorize(["JAMAAH"]),
  getMyProfile
);

router.put(
  "/jamaah/biodata",
  authenticate,
  authorize(["JAMAAH"]),
  updateMyBiodata
);

router.post(
  "/jamaah/documents",
  authenticate,
  authorize(["JAMAAH"]),
  jamaahDocUpload.single("file"),
  uploadMyDocument
);

router.post(
  "/jamaah/submit",
  authenticate,
  authorize(["JAMAAH"]),
  submitForApproval
);

router.get(
  "/jamaah/mahram/search",
  authenticate,
  authorize(["JAMAAH"]),
  searchMahram
);

router.get(
  "/jamaah/payments",
  authenticate,
  authorize(["JAMAAH"]),
  getMyPayments
);

router.get(
  "/jamaah/package",
  authenticate,
  authorize(["JAMAAH"]),
  getMyPackage
);

router.post(
  "/jamaah/package/request",
  authenticate,
  authorize(["JAMAAH"]),
  requestPackageConsultation
);




// =====================================================
// ADMIN - USER MANAGEMENT
// =====================================================
router.get("/admin/users", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getAllUsers);
router.post(
  "/admin/users",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  validate(adminUserSchemas.create),
  createUser
);
router.get("/admin/users/:id", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getUserById);
router.put(
  "/admin/users/:id",
  authenticate,
  authorize(["ADMIN"]),
  validate(adminUserSchemas.update),
  updateUser
);
router.patch(
  "/admin/users/:id/toggle",
  authenticate,
  authorize(["ADMIN"]),
  toggleUserStatus
);
router.delete(
  "/admin/users/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteUser
);

router.post(
  "/admin/users/import",
  authenticate,
  authorize(["ADMIN"]),
  importUsers
);

router.post(
  "/admin/users/bulk-delete",
  authenticate,
  authorize(["ADMIN"]),
  bulkDeleteUsers
);

router.patch(
  "/admin/users/bulk-status",
  authenticate,
  authorize(["ADMIN"]),
  bulkUpdateUserStatus
);

// =====================================================
// ADMIN - STAFF MANAGEMENT
// =====================================================
router.get("/admin/staff", authenticate, authorize(["ADMIN"]), getAllStaff);
router.get("/admin/staff/stats", authenticate, authorize(["ADMIN"]), getStaffStats);
router.get("/admin/staff/:id", authenticate, authorize(["ADMIN"]), getStaffById);
router.post("/admin/staff", authenticate, authorize(["ADMIN"]), createStaff);
router.put("/admin/staff/:id", authenticate, authorize(["ADMIN"]), updateStaff);
router.patch(
  "/admin/staff/:id/toggle",
  authenticate,
  authorize(["ADMIN"]),
  toggleStaffStatus
);
router.delete("/admin/staff/:id", authenticate, authorize(["ADMIN"]), deleteStaff);
router.post(
  "/admin/staff/:id/reset-password",
  authenticate,
  authorize(["ADMIN"]),
  resetStaffPassword
);

// =====================================================
// ADMIN - DASHBOARD STATS
// =====================================================
router.get(
  "/admin/dashboard/stats",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  getAdminDashboardStats
);

// ✅ ADMIN - TRANSACTIONS
router.get(
  "/admin/transactions",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  getAllTransactions
);
router.get(
  "/admin/transactions/:id",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  getTransactionById
);
router.patch(
  "/admin/transactions/:id/verify",
  authenticate,
  authorize(["ADMIN"]),
  validate(transactionSchemas.verifyStatus),
  verifyTransaction
);

// ✅ ADMIN - REPORTS
router.get(
  "/admin/reports/sales",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  getSalesReport
);
router.get(
  "/admin/reports/growth",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  getGrowthStats
);

// =====================================================
// ADMIN - PACKAGE MANAGEMENT
// =====================================================

// 1. STATIC ROUTES
router.get(
  "/admin/packages/export",
  authenticate,
  authorize(["ADMIN"]),
  exportPackages
);

router.post(
  "/admin/packages/import",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("file"),
  importPackages
);

// 2. PDF ITINERARY ROUTES (SPECIFIC :id PATTERN)
router.post(
  "/admin/packages/:id/itinerary-pdf",
  authenticate,
  authorize(["ADMIN"]),
  uploadPDF.single("itinerary_pdf"),
  savePDFPath,
  uploadItineraryPdf
);

router.delete(
  "/admin/packages/:id/itinerary-pdf",
  authenticate,
  authorize(["ADMIN"]),
  deleteItineraryPdf
);

// 3. IMAGE ROUTES
router.post(
  "/admin/packages/:id/images",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("image"),
  optimizeImage("packages"),
  uploadPackageImage
);

router.post(
  "/admin/packages/:id/images/bulk",
  authenticate,
  authorize(["ADMIN"]),
  upload.array("images", 10),
  optimizeMultipleImages("packages"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Tidak ada gambar yang diupload" });
      }

      const { packageImages } = await import("../db/schema.js");
      const { db } = await import("../db/index.js");
      const { eq } = await import("drizzle-orm");

      const existingImages = await db.query.packageImages.findMany({
        where: eq(packageImages.packageId, parseInt(id)),
      });
      const maxSortOrder =
        existingImages.length > 0
          ? Math.max(...existingImages.map((img) => img.sortOrder))
          : -1;

      const imageValues = req.uploadedFiles.map((file, index) => ({
        packageId: parseInt(id),
        imageUrl: file.path,
        caption: null,
        sortOrder: maxSortOrder + index + 1,
        isPrimary: existingImages.length === 0 && index === 0,
      }));

      await db.insert(packageImages).values(imageValues);

      res.status(201).json({
        success: true,
        message: `${req.uploadedFiles.length} gambar berhasil diupload`,
        data: req.uploadedFiles.map((f) => ({
          url: f.path,
          filename: f.filename,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/admin/packages/images/:imageId",
  authenticate,
  authorize(["ADMIN"]),
  deletePackageImage
);

// 4. GENERIC CRUD (PALING BAWAH)
router.get(
  "/admin/packages",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  getAllPackages
);

router.post(
  "/admin/packages",
  authenticate,
  authorize(["ADMIN"]),
  uploadPDF.single("itinerary_pdf"),
  savePDFPath,
  createPackage
);

router.get(
  "/admin/packages/:id",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  getPackageById
);

router.put(
  "/admin/packages/:id",
  authenticate,
  authorize(["ADMIN"]),
  uploadPDF.single("itinerary_pdf"),
  savePDFPath,
  updatePackage
);

router.delete(
  "/admin/packages/:id",
  authenticate,
  authorize(["ADMIN"]),
  deletePackage
);

// ✅ 5. PUBLIC PACKAGES ROUTES (TARUH SETELAH ADMIN ROUTES!)
// Kenapa? Karena Express cek route dari atas ke bawah
// /admin/packages/:id harus dicek duluan sebelum /packages/:id
router.get("/packages", getAllPackages);
router.get("/packages/:id", getPackageById);

// =====================================================
// MASTER DATA - HOTELS
// =====================================================
router.get("/master/hotels", getAllHotels);
router.post(
  "/master/hotels",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("image"),
  optimizeImage("hotels"),
  createHotel
);
router.get("/master/hotels/:id", getHotelById);

// ✅ PASTIKAN ROUTE INI ADA MIDDLEWARE UPLOAD
router.put(
  "/master/hotels/:id", // ← INI YANG HILANG!
  authenticate,
  authorize(["ADMIN"]),
  upload.single("image"), // ✅ WAJIB!
  optimizeImage("hotels"), // ✅ WAJIB!
  updateHotel
);
router.delete(
  "/master/hotels/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteHotel
);
router.post(
  "/master/import/hotels",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("file"),
  importHotels
);

// =====================================================
// MASTER DATA - AIRLINES
// =====================================================
router.get("/master/airlines", getAllAirlines);
router.post(
  "/master/airlines",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("logo"),
  optimizeImage("airlines"),
  createAirline
);
router.get("/master/airlines/:id", getAirlineById);
router.put(
  "/master/airlines/:id",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("logo"),
  optimizeImage("airlines"),
  updateAirline
);
router.delete(
  "/master/airlines/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteAirline
);

// =====================================================
// MASTER DATA - AIRPORTS
// =====================================================
router.get("/master/airports", getAllAirports);
router.post(
  "/master/airports",
  authenticate,
  authorize(["ADMIN"]),
  createAirport
);
router.get("/master/airports/:id", getAirportById);
router.put(
  "/master/airports/:id",
  authenticate,
  authorize(["ADMIN"]),
  updateAirport
);
router.delete(
  "/master/airports/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteAirport
);

// =====================================================
// MASTER DATA - BANKS
// =====================================================
router.get(
  "/master/banks",
  authenticate,
  authorize(["ADMIN", "FINANCE", "STAFF"]),
  getAllBanks
);
router.get("/master/banks/active", getActiveBanks);
router.post("/master/banks", authenticate, authorize(["ADMIN"]), createBank);
router.put("/master/banks/:id", authenticate, authorize(["ADMIN"]), updateBank);
router.patch(
  "/master/banks/:id/toggle",
  authenticate,
  authorize(["ADMIN"]),
  toggleBankStatus
);
router.delete(
  "/master/banks/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteBank
);

// =====================================================
// TESTIMONIALS
// =====================================================
router.get("/testimonials", getAllTestimonials);
router.post(
  "/testimonials",
  authenticate,
  authorize(["ADMIN"]),
  createTestimonial
);
router.put(
  "/testimonials/:id",
  authenticate,
  authorize(["ADMIN"]),
  updateTestimonial
);
router.delete(
  "/testimonials/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteTestimonial
);

// =====================================================
// FAQ
// =====================================================
router.get("/faqs", getAllFAQs);
router.post("/faqs", authenticate, authorize(["ADMIN"]), createFAQ);
router.put("/faqs/:id", authenticate, authorize(["ADMIN"]), updateFAQ);
router.delete("/faqs/:id", authenticate, authorize(["ADMIN"]), deleteFAQ);

// =====================================================
// COMPANY PROFILE ROUTES
// =====================================================
router.get("/company", getCompanyProfile);

router.put(
  "/company",
  authenticate,
  authorize(["ADMIN"]),
  updateCompanyProfile
);

// ✅ FIX: Route upload logo dengan middleware yang benar
router.post(
  "/company/logo",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("logo"), // 1. Multer ambil file
  saveDocument("company"), // 2. Process & save ke folder company
  uploadCompanyLogo // 3. Update database
);

// =====================================================
// JAMAAH MANAGEMENT
// =====================================================

// ✅ SYNC ROUTE (taruh paling atas sebelum :bookingNumber)
router.post(
  "/admin/jamaah/sync",
  authenticate,
  authorize(["ADMIN"]),
  syncJamaahFromUsers
);

router.get(
  "/admin/jamaah",
  authenticate,
  authorize(["ADMIN", "FINANCE", "STAFF"]),
  getAllJamaah
);

router.post(
  "/admin/jamaah",
  authenticate,
  authorize(["ADMIN", "AGEN"]),
  createJamaah
);

router.get(
  "/admin/jamaah/:bookingNumber",
  authenticate,
  authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]),
  getJamaahByBookingNumber
);

router.put(
  "/admin/jamaah/:bookingNumber",
  authenticate,
  authorize(["ADMIN"]),
  updateJamaah
);

router.delete(
  "/admin/jamaah/:bookingNumber",
  authenticate,
  authorize(["ADMIN"]),
  deleteJamaah
);

// Payments
router.post(
  "/admin/jamaah/:bookingNumber/payments",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  addPayment
);

router.get(
  "/admin/jamaah/:bookingNumber/payments",
  authenticate,
  authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]),
  getPayments
);

router.patch(
  "/admin/jamaah/payments/:paymentId/verify",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  verifyPayment,
);


// =====================================================
// JAMAAH APPROVAL ROUTES (Admin only)
// =====================================================
router.post("/jamaah/:bookingNumber/approve", authenticate, authorize("ADMIN"), approveJamaah);
router.post("/jamaah/:bookingNumber/reject", authenticate, authorize("ADMIN"), rejectJamaah);
router.post("/jamaah/:bookingNumber/revert", authenticate, authorize("ADMIN"), revertToVerified);



// =====================================================
// ✅ MASTER DATA AGEN - READ-ONLY UNTUK AGEN
// =====================================================

// ===== AGENT LEVELS =====
router.get(
  "/admin/master/agent-levels",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca
  agentLevelController.getAll
);
router.post(
  "/admin/master/agent-levels",
  authenticate,
  authorize(["ADMIN"]),
  agentLevelController.create
);
router.get(
  "/admin/master/agent-levels/:id",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca detail
  agentLevelController.getById
);
router.put(
  "/admin/master/agent-levels/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentLevelController.update
);
router.delete(
  "/admin/master/agent-levels/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentLevelController.deleteLevel
);

// ===== AGENT REQUIREMENTS =====
router.get(
  "/admin/master/agent-requirements",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca
  agentRequirementController.getAll
);
router.post(
  "/admin/master/agent-requirements",
  authenticate,
  authorize(["ADMIN"]),
  agentRequirementController.create
);
router.put(
  "/admin/master/agent-requirements/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentRequirementController.update
);
router.delete(
  "/admin/master/agent-requirements/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentRequirementController.deleteRequirement
);

// ===== AGENT PURPOSES =====
router.get(
  "/admin/master/agent-purposes",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca
  agentPurposeController.getAll
);
router.post(
  "/admin/master/agent-purposes",
  authenticate,
  authorize(["ADMIN"]),
  agentPurposeController.create
);
router.put(
  "/admin/master/agent-purposes/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentPurposeController.update
);
router.delete(
  "/admin/master/agent-purposes/:id",
  authenticate,
  authorize(["ADMIN"]),
  agentPurposeController.deletePurpose
);

// ===== PERIODS =====
router.get(
  "/admin/master/periods",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca
  periodController.getAll
);
router.post(
  "/admin/master/periods",
  authenticate,
  authorize(["ADMIN"]),
  periodController.create
);
router.get(
  "/admin/master/periods/:id",
  authenticate,
  authorize(["ADMIN", "AGEN", "STAFF", "FINANCE"]), // ✅ FINANCE bisa baca detail
  periodController.getById
);
router.put(
  "/admin/master/periods/:id",
  authenticate,
  authorize(["ADMIN"]),
  periodController.update
);
router.delete(
  "/admin/master/periods/:id",
  authenticate,
  authorize(["ADMIN"]),
  periodController.deletePeriod
);

// =====================================================
// ADMIN: Kelola Agen
// =====================================================
router.get(
  "/admin/agen",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  agenController.getAll
);
router.get(
  "/admin/agen/:id",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  agenController.getById
);
router.put(
  "/admin/agen/:id",
  authenticate,
  authorize(["ADMIN"]),
  agenController.update
);
router.post(
  "/admin/agen/:id/approve",
  authenticate,
  authorize(["ADMIN"]),
  agenController.approve
);
router.post(
  "/admin/agen/:id/reject",
  authenticate,
  authorize(["ADMIN"]),
  agenController.reject
);
router.delete(
  "/admin/agen/:id",
  authenticate,
  authorize(["ADMIN"]),
  agenController.deleteAgent
);

// =====================================================
// AGEN: Profile & Upload
// =====================================================
router.get(
  "/agen/profile",
  authenticate,
  authorize(["AGEN"]),
  agenController.getMyProfile
);

router.put(
  "/agen/profile",
  authenticate,
  authorize(["AGEN"]),
  agenController.updateMyProfile
);

router.post(
  "/agen/profile/submit",
  authenticate,
  authorize(["AGEN"]),
  agenController.submitForApproval
);

router.post(
  "/agen/profile/upload-ktp",
  authenticate,
  authorize(["AGEN"]),
  ...agenController.uploadKtp
);

router.post(
  "/agen/profile/upload-payment-proof",
  authenticate,
  authorize(["AGEN"]),
  ...agenController.uploadPaymentProof
);

// =====================================================
// AGEN: Packages (Read-Only)
// =====================================================

// ✅ Gunakan nama function yang benar
router.get(
  "/agen/packages",
  authenticate,
  authorize(["AGEN"]),
  packageController.getAllPackages  // ✅ BUKAN getAll
);

router.get(
  "/agen/packages/:id",
  authenticate,
  authorize(["AGEN"]),
  packageController.getPackageById  // ✅ BUKAN getById
);



// =====================================================
// AGEN: Jamaah Management
// =====================================================
router.get(
  "/agen/jamaah",
  authenticate,
  authorize(["AGEN"]),
  agenJamaahController.getMyJamaah,
);

router.get(
  "/agen/jamaah/:id",
  authenticate,
  authorize(["AGEN"]),
  agenJamaahController.getJamaahById
);

router.post(
  "/agen/jamaah",
  authenticate,
  authorize(["AGEN"]),
  agenJamaahController.createJamaah
);

router.put(
  "/agen/jamaah/:id",
  authenticate,
  authorize(["AGEN"]),
  agenJamaahController.updateJamaah
);

// =====================================================
// AGEN: Dashboard Stats
// =====================================================
router.get(
  "/agen/dashboard",
  authenticate,
  authorize(["AGEN"]),
  agenJamaahController.getDashboardStats
);




// Upload document jamaah
router.post(
  "/agen/jamaah/:id/upload/:type",
  authenticate,
  authorize(["AGEN"]),
  upload.single("document"),
  optimizeImage("jamaah"),
  async (req, res, next) => {
    try {
      const { id, type } = req.params;
      const agenUserId = req.user.userId;

      // Validate type
      const allowedTypes = [
        "fotoUrl", "ktpUrl", "kkUrl", "pasporUrl",
        "bukuNikahUrl", "aktaLahirUrl", "ijazahUrl",
        "vaksinUrl", "meningitisUrl"
      ];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipe dokumen tidak valid",
        });
      }

      // Check agent ownership
      const agent = await db.query.agentData.findFirst({
        where: eq(agentData.userId, agenUserId),
      });

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Data agen tidak ditemukan",
        });
      }

      const jamaah = await db.query.jamaahData.findFirst({
        where: and(
          eq(jamaahData.id, parseInt(id)),
          eq(jamaahData.agenId, agent.id)
        ),
      });

      if (!jamaah) {
        return res.status(404).json({
          success: false,
          message: "Data jamaah tidak ditemukan atau bukan milik Anda",
        });
      }

      // Update with file path
      await db
        .update(jamaahData)
        .set({
          [type]: req.optimizedPath || req.file?.path,
          updatedAt: new Date(),
        })
        .where(eq(jamaahData.id, parseInt(id)));

      res.json({
        success: true,
        message: "Dokumen berhasil diupload",
        data: {
          type,
          url: req.optimizedPath || req.file?.path,
        },
      });
    } catch (error) {
      console.error("Upload document error:", error);
      next(error);
    }
  }
);

// =====================================================
// NOTIFICATIONS ROUTES (existing)
// =====================================================
router.get("/notifications", authenticate, getMyNotifications);
router.get("/notifications/unread-count", authenticate, getUnreadCount);
router.get(
  "/notifications/admin/pending-agent-approvals",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  getPendingAgentApprovalsCount
);
router.patch("/notifications/:id/read", authenticate, markAsRead);
router.patch("/notifications/read-all", authenticate, markAllAsRead);
router.delete("/notifications/:id", authenticate, deleteNotification);
router.delete("/notifications/clear-read", authenticate, deleteAllRead);

// =====================================================
// ✅ ADMIN REMINDER ROUTES (TAMBAH INI)
// =====================================================
router.get(
  "/admin/reminders/jamaah",
  authenticate,
  authorize(["ADMIN", "FINANCE", "STAFF"]),
  getJamaahNeedingReminder
);

router.get(
  "/admin/reminders/agen",
  authenticate,
  authorize(["ADMIN", "STAFF", "FINANCE"]),
  getAgenNeedingReminder
);

router.post(
  "/admin/finance/pos/assign-package",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  assignJamaahToPackage
);

router.post(
  "/admin/finance/pos/send-reminder",
  authenticate,
  authorize(["ADMIN", "FINANCE"]),
  sendJamaahNotification
);

router.post(
  "/admin/reminders/send",
  authenticate,
  authorize(["ADMIN"]),
  sendReminder
);

router.post(
  "/admin/reminders/send-bulk",
  authenticate,
  authorize(["ADMIN"]),
  sendBulkReminder
);



// =====================================================
// ✅ AGEN NOTIFICATION & REMINDER ROUTES
// =====================================================
router.get(
  "/agen/notifications",
  authenticate,
  authorize(["AGEN"]),
  getMyNotifications
);

router.get(
  "/agen/notifications/unread-count",
  authenticate,
  authorize(["AGEN"]),
  getUnreadCount
);

router.patch(
  "/agen/notifications/:id/read",
  authenticate,
  authorize(["AGEN"]),
  markAsRead
);

router.patch(
  "/agen/notifications/read-all",
  authenticate,
  authorize(["AGEN"]),
  markAllAsRead
);

router.get(
  "/agen/reminders/jamaah",
  authenticate,
  authorize(["AGEN"]),
  getAgenJamaahReminders
);

router.post(
  "/agen/reminders/send",
  authenticate,
  authorize(["AGEN"]),
  agenSendReminderToJamaah
);



// =====================================================
// CALENDAR ROUTES
// =====================================================

// Get events by date range (all roles)
router.get(
  "/calendar/events",
  authenticate,
  getEventsByRange
);

// Get upcoming events (for dashboard widget)
router.get(
  "/calendar/upcoming",
  authenticate,
  getUpcomingEvents
);

// Get events/itinerary by package
router.get(
  "/calendar/package/:packageId",
  authenticate,
  getEventsByPackage
);

// Admin: Create event
router.post(
  "/calendar/events",
  authenticate,
  authorize(["ADMIN"]),
  createEvent
);

// Admin: Update event
router.put(
  "/calendar/events/:id",
  authenticate,
  authorize(["ADMIN"]),
  updateEvent
);

// Admin: Delete event
router.delete(
  "/calendar/events/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteEvent
);

// Admin: Bulk create itinerary for package
router.post(
  "/calendar/itinerary/bulk",
  authenticate,
  authorize(["ADMIN"]),
  bulkCreateItinerary
);


// Tambahkan route baru:
// Admin: Sync all packages to calendar
router.post(
  "/calendar/sync-packages",
  authenticate,
  authorize(["ADMIN"]),
  syncAllPackages
);




export default router;
