// backend/src/routes/admin.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
    validate,
    adminUserSchemas,
    staffSchemas,
    transactionSchemas,
} from "../validators/index.js";
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
    auditInvalidPasswords,
    resetUserPassword,
} from "../controllers/adminAuthMaintenanceController.js";
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
import { getAdminDashboardStats } from "../controllers/dashboardController.js";
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
    uploadItineraryPdf,
    deleteItineraryPdf,
    bulkUploadPackageImages,
} from "../controllers/packageController.js";
import {
    assignJamaahToPackage,
    sendJamaahNotification,
} from "../controllers/financePosController.js";

const router = express.Router();

// =====================================================
// USER MANAGEMENT
// =====================================================
router.get("/users", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getAllUsers);
router.post("/users", authenticate, authorize(["ADMIN", "STAFF"]), validate(adminUserSchemas.create), createUser);
router.get("/users/:id", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getUserById);
router.put("/users/:id", authenticate, authorize(["ADMIN"]), validate(adminUserSchemas.update), updateUser);
router.patch("/users/:id/toggle", authenticate, authorize(["ADMIN"]), toggleUserStatus);
router.delete("/users/:id", authenticate, authorize(["ADMIN"]), deleteUser);
router.post("/users/import", authenticate, authorize(["ADMIN"]), importUsers);
router.post("/users/bulk-delete", authenticate, authorize(["ADMIN"]), bulkDeleteUsers);
router.patch("/users/bulk-status", authenticate, authorize(["ADMIN"]), bulkUpdateUserStatus);

// =====================================================
// AUTH MAINTENANCE
// =====================================================
router.get("/auth/audit-invalid-passwords", authenticate, authorize(["ADMIN"]), auditInvalidPasswords);
router.post("/users/:id/reset-password", authenticate, authorize(["ADMIN"]), resetUserPassword);

// =====================================================
// STAFF MANAGEMENT
// =====================================================
router.get("/staff", authenticate, authorize(["ADMIN"]), getAllStaff);
router.get("/staff/stats", authenticate, authorize(["ADMIN"]), getStaffStats);
router.get("/staff/:id", authenticate, authorize(["ADMIN"]), getStaffById);
router.post("/staff", authenticate, authorize(["ADMIN"]), validate(staffSchemas.create), createStaff);
router.put("/staff/:id", authenticate, authorize(["ADMIN"]), validate(staffSchemas.update), updateStaff);
router.patch("/staff/:id/toggle", authenticate, authorize(["ADMIN"]), toggleStaffStatus);
router.delete("/staff/:id", authenticate, authorize(["ADMIN"]), deleteStaff);
router.post("/staff/:id/reset-password", authenticate, authorize(["ADMIN"]), resetStaffPassword);

// =====================================================
// DASHBOARD STATS
// =====================================================
router.get("/dashboard/stats", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getAdminDashboardStats);

// =====================================================
// TRANSACTIONS
// =====================================================
router.get("/transactions", authenticate, authorize(["ADMIN", "FINANCE"]), getAllTransactions);
router.get("/transactions/:id", authenticate, authorize(["ADMIN", "FINANCE"]), getTransactionById);
router.patch("/transactions/:id/verify", authenticate, authorize(["ADMIN", "FINANCE"]), validate(transactionSchemas.verifyStatus), verifyTransaction);

// =====================================================
// REPORTS
// =====================================================
router.get("/reports/sales", authenticate, authorize(["ADMIN", "FINANCE"]), getSalesReport);
router.get("/reports/growth", authenticate, authorize(["ADMIN", "FINANCE"]), getGrowthStats);

// =====================================================
// PACKAGE MANAGEMENT
// =====================================================

// Static routes first
router.get("/packages/export", authenticate, authorize(["ADMIN"]), exportPackages);
router.post("/packages/import", authenticate, authorize(["ADMIN"]), upload.single("file"), importPackages);

// PDF itinerary routes
router.post("/packages/:id/itinerary-pdf", authenticate, authorize(["ADMIN"]), uploadPDF.single("itinerary_pdf"), savePDFPath, uploadItineraryPdf);
router.delete("/packages/:id/itinerary-pdf", authenticate, authorize(["ADMIN"]), deleteItineraryPdf);

// Image routes
router.post("/packages/:id/images", authenticate, authorize(["ADMIN"]), upload.single("image"), optimizeImage("packages", { outputFormat: "webp" }), uploadPackageImage);
router.post("/packages/:id/images/bulk", authenticate, authorize(["ADMIN"]), upload.array("images", 10), optimizeMultipleImages("packages", { outputFormat: "webp" }), bulkUploadPackageImages);
router.delete("/packages/images/:imageId", authenticate, authorize(["ADMIN"]), deletePackageImage);

// Generic CRUD (must be last to avoid matching static routes)
router.get("/packages", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getAllPackages);
router.post("/packages", authenticate, authorize(["ADMIN"]), uploadPDF.single("itinerary_pdf"), savePDFPath, createPackage);
router.get("/packages/:id", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getPackageById);
router.put("/packages/:id", authenticate, authorize(["ADMIN"]), uploadPDF.single("itinerary_pdf"), savePDFPath, updatePackage);
router.delete("/packages/:id", authenticate, authorize(["ADMIN"]), deletePackage);

// =====================================================
// FINANCE POS
// =====================================================
router.post("/finance/pos/assign-package", authenticate, authorize(["ADMIN", "FINANCE"]), assignJamaahToPackage);
router.post("/finance/pos/send-reminder", authenticate, authorize(["ADMIN", "FINANCE"]), sendJamaahNotification);

export default router;

