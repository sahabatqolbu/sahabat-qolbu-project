// backend/src/routes/agen.js
import express from "express";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { upload, optimizeImage } from "../utils/upload.js";
import { db } from "../db/index.js";
import { agentData, jamaahData } from "../db/schema.js";
import { logger } from "../utils/logger.js";
import {
    errorResponse,
    notFoundResponse,
    successResponse,
} from "../utils/response.js";
import * as agenController from "../controllers/agenController.js";
import * as packageController from "../controllers/packageController.js";
import * as agenJamaahController from "../controllers/agenJamaahController.js";
import {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getAgenJamaahReminders,
    agenSendReminderToJamaah,
} from "../controllers/notificationController.js";

const router = express.Router();

// =====================================================
// ADMIN: AGEN MANAGEMENT
// =====================================================
router.get("/admin", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), agenController.getAll);
router.get("/admin/:id", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), agenController.getById);
router.put("/admin/:id", authenticate, authorize(["ADMIN"]), agenController.update);
router.post("/admin/:id/approve", authenticate, authorize(["ADMIN"]), agenController.approve);
router.post("/admin/:id/reject", authenticate, authorize(["ADMIN"]), agenController.reject);
router.post("/admin/:id/request-ktp-reupload", authenticate, authorize(["ADMIN"]), agenController.requestKtpReupload);
router.post("/admin/:id/upload-certificate", authenticate, authorize(["ADMIN", "STAFF"]), ...agenController.uploadCertificatePdf);
router.post("/admin/:id/upload-id-card-design", authenticate, authorize(["ADMIN", "STAFF"]), ...agenController.uploadIdCardDesignPdf);
router.delete("/admin/:id", authenticate, authorize(["ADMIN"]), agenController.deleteAgent);

// =====================================================
// AGEN: PROFILE & UPLOAD
// =====================================================
router.get("/profile", authenticate, authorize(["AGEN"]), agenController.getMyProfile);
router.put("/profile", authenticate, authorize(["AGEN"]), agenController.updateMyProfile);
router.post("/profile/submit", authenticate, authorize(["AGEN"]), agenController.submitForApproval);
router.post("/profile/upload-ktp", authenticate, authorize(["AGEN"]), ...agenController.uploadKtp);
router.post("/profile/upload-payment-proof", authenticate, authorize(["AGEN"]), ...agenController.uploadPaymentProof);
router.post("/profile/upload-photo", authenticate, authorize(["AGEN"]), ...agenController.uploadProfilePhoto);
router.post("/profile/upload-landing-logo", authenticate, authorize(["AGEN"]), ...agenController.uploadLandingLogo);
router.post("/profile/request-docs", authenticate, authorize(["AGEN"]), agenController.requestAgentDocs);

// =====================================================
// AGEN: PACKAGES (Read-Only)
// =====================================================
router.get("/packages", authenticate, authorize(["AGEN"]), packageController.getAllPackages);
router.get("/packages/:id", authenticate, authorize(["AGEN"]), packageController.getPackageById);

// =====================================================
// AGEN: JAMAAH MANAGEMENT
// =====================================================
router.get("/jamaah", authenticate, authorize(["AGEN"]), agenJamaahController.getMyJamaah);
router.get("/jamaah/:id", authenticate, authorize(["AGEN"]), agenJamaahController.getJamaahById);
router.post("/jamaah", authenticate, authorize(["AGEN"]), agenJamaahController.createJamaah);
router.put("/jamaah/:id", authenticate, authorize(["AGEN"]), agenJamaahController.updateJamaah);

// =====================================================
// AGEN: DASHBOARD STATS
// =====================================================
router.get("/dashboard", authenticate, authorize(["AGEN"]), agenJamaahController.getDashboardStats);

// =====================================================
// AGEN: NOTIFICATIONS
// =====================================================
router.get("/notifications", authenticate, authorize(["AGEN"]), getMyNotifications);
router.get("/notifications/unread-count", authenticate, authorize(["AGEN"]), getUnreadCount);
router.patch("/notifications/:id/read", authenticate, authorize(["AGEN"]), markAsRead);
router.patch("/notifications/read-all", authenticate, authorize(["AGEN"]), markAllAsRead);
router.get("/reminders/jamaah", authenticate, authorize(["AGEN"]), getAgenJamaahReminders);
router.post("/reminders/send", authenticate, authorize(["AGEN"]), agenSendReminderToJamaah);

// =====================================================
// AGEN: DOCUMENT UPLOAD FOR JAMAAH
// =====================================================
router.post(
    "/jamaah/:id/upload/:type",
    authenticate,
    authorize(["AGEN"]),
    upload.single("document"),
    optimizeImage("jamaah"),
    async (req, res, next) => {
        try {
            const { id, type } = req.params;
            const agenUserId = req.user.userId;

            const allowedTypes = [
                "fotoUrl", "ktpUrl", "kkUrl", "pasporUrl",
                "bukuNikahUrl", "aktaLahirUrl", "ijazahUrl",
                "vaksinUrl", "meningitisUrl",
            ];

            if (!allowedTypes.includes(type)) {
                return errorResponse(
                    res,
                    "Tipe dokumen tidak valid",
                    400,
                    null,
                    "VALIDATION_FAILED"
                );
            }

            // Check agent ownership
            const agent = await db.query.agentData.findFirst({
                where: eq(agentData.userId, agenUserId),
            });

            if (!agent) {
                return notFoundResponse(res, "Data agen tidak ditemukan");
            }

            const jamaah = await db.query.jamaahData.findFirst({
                where: and(
                    eq(jamaahData.id, parseInt(id)),
                    eq(jamaahData.agenId, agent.id)
                ),
            });

            if (!jamaah) {
                return notFoundResponse(
                    res,
                    "Data jamaah tidak ditemukan atau bukan milik Anda"
                );
            }

            const fileUrl = req.uploadedFile?.path;
            if (!fileUrl) {
                return errorResponse(
                    res,
                    "File upload gagal diproses",
                    500,
                    null,
                    "UPLOAD_PROCESS_FAILED"
                );
            }

            await db
                .update(jamaahData)
                .set({
                    [type]: fileUrl,
                    updatedAt: new Date(),
                })
                .where(eq(jamaahData.id, parseInt(id)));

            return successResponse(
                res,
                {
                    type,
                    url: fileUrl,
                },
                "Dokumen berhasil diupload"
            );
        } catch (error) {
            logger.error("Upload document error", error);
            next(error);
        }
    }
);

export default router;
