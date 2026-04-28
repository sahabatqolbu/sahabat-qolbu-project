// backend/src/routes/jamaah.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { uploadDocument, saveDocument } from "../utils/upload.js";
import {
  validate,
  validateParams,
  jamaahAdminSchemas,
} from "../validators/index.js";

// Controllers
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
import {
  getAllJamaah,
  getJamaahByBookingNumber,
  createJamaah,
  updateJamaah,
  deleteJamaah,
  addPayment,
  getPayments,
  verifyPayment,
  rejectPayment,
  syncJamaahFromUsers,
  approveJamaah,
  rejectJamaah,
  revertToVerified,
  uploadAdminDocument,
} from "../controllers/jamaahController.js";

const router = express.Router();
export const adminJamaahAliasRouter = express.Router();

const registerAdminJamaahAliasRoutes = (targetRouter) => {
  targetRouter.post("/sync", authenticate, authorize(["ADMIN"]), syncJamaahFromUsers);
  targetRouter.get("/", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), getAllJamaah);
  targetRouter.post("/", authenticate, authorize(["ADMIN", "AGEN"]), validate(jamaahAdminSchemas.create), createJamaah);
  targetRouter.get("/:bookingNumber", authenticate, authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), getJamaahByBookingNumber);
  targetRouter.put("/:bookingNumber", authenticate, authorize(["ADMIN"]), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.update), updateJamaah);
  targetRouter.delete("/:bookingNumber", authenticate, authorize(["ADMIN"]), validateParams(jamaahAdminSchemas.bookingParams), deleteJamaah);
  targetRouter.post("/:bookingNumber/documents", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), uploadDocument.single("file"), saveDocument("jamaah"), uploadAdminDocument);
  targetRouter.post("/:bookingNumber/payments", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.addPayment), addPayment);
  targetRouter.get("/:bookingNumber/payments", authenticate, authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), getPayments);
  targetRouter.patch("/payments/:paymentId/verify", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.paymentParams), verifyPayment);
  targetRouter.patch("/payments/:paymentId/reject", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.paymentParams), validate(jamaahAdminSchemas.rejectPayment), rejectPayment);
};

registerAdminJamaahAliasRoutes(adminJamaahAliasRouter);

// =====================================================
// JAMAAH SELF-SERVICE ROUTES
// Must be before /admin/jamaah routes
// =====================================================
router.get("/profile", authenticate, authorize(["JAMAAH"]), getMyProfile);
router.put("/biodata", authenticate, authorize(["JAMAAH"]), updateMyBiodata);
router.post("/documents", authenticate, authorize(["JAMAAH"]), uploadDocument.single("file"), saveDocument("jamaah"), uploadMyDocument);
router.post("/submit", authenticate, authorize(["JAMAAH"]), submitForApproval);
router.get("/mahram/search", authenticate, authorize(["JAMAAH"]), searchMahram);
router.get("/payments", authenticate, authorize(["JAMAAH"]), getMyPayments);
router.get("/package", authenticate, authorize(["JAMAAH"]), getMyPackage);
router.post("/package/request", authenticate, authorize(["JAMAAH"]), requestPackageConsultation);

// =====================================================
// ADMIN JAMAAH MANAGEMENT (mounted at /admin/jamaah)
// =====================================================
router.post("/admin/sync", authenticate, authorize(["ADMIN"]), syncJamaahFromUsers);
router.get("/admin", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), getAllJamaah);
router.post("/admin", authenticate, authorize(["ADMIN", "AGEN"]), validate(jamaahAdminSchemas.create), createJamaah);
router.get("/admin/:bookingNumber", authenticate, authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), getJamaahByBookingNumber);
router.put("/admin/:bookingNumber", authenticate, authorize(["ADMIN"]), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.update), updateJamaah);
router.delete("/admin/:bookingNumber", authenticate, authorize(["ADMIN"]), validateParams(jamaahAdminSchemas.bookingParams), deleteJamaah);
router.post("/admin/:bookingNumber/documents", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), uploadDocument.single("file"), saveDocument("jamaah"), uploadAdminDocument);

// Payments
router.post("/admin/:bookingNumber/payments", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.addPayment), addPayment);
router.get("/admin/:bookingNumber/payments", authenticate, authorize(["ADMIN", "FINANCE", "AGEN", "STAFF"]), validateParams(jamaahAdminSchemas.bookingParams), getPayments);
router.patch("/admin/payments/:paymentId/verify", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.paymentParams), verifyPayment);
router.patch("/admin/payments/:paymentId/reject", authenticate, authorize(["ADMIN", "FINANCE"]), validateParams(jamaahAdminSchemas.paymentParams), validate(jamaahAdminSchemas.rejectPayment), rejectPayment);

// Approval
router.post("/:bookingNumber/approve", authenticate, authorize("ADMIN"), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.approveRejectRevert), approveJamaah);
router.post("/:bookingNumber/reject", authenticate, authorize("ADMIN"), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.approveRejectRevert), rejectJamaah);
router.post("/:bookingNumber/revert", authenticate, authorize("ADMIN"), validateParams(jamaahAdminSchemas.bookingParams), validate(jamaahAdminSchemas.approveRejectRevert), revertToVerified);

export default router;
