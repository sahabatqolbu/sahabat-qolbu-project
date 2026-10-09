import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  downloadFinancialDocument, getFinancialBanks, getFinancialSettings,
  issueFinancialDocument, listFinancialDocuments, prepareFinancialDocument,
  previewFinancialPdf, updateFinancialSigner, uploadFinancialMark, voidFinancialDocument,
} from "../controllers/financialDocumentController.js";

const router = express.Router();
router.use(authenticate, authorize(["ADMIN", "FINANCE"]));
router.get("/", listFinancialDocuments);
router.get("/banks", getFinancialBanks);
router.get("/settings", getFinancialSettings);
router.put("/settings/signer", authorize(["ADMIN"]), updateFinancialSigner);
router.post("/settings/:kind", authorize(["ADMIN"]), ...uploadFinancialMark);
router.post("/prepare", prepareFinancialDocument);
router.post("/preview", previewFinancialPdf);
router.post("/", issueFinancialDocument);
router.get("/:id/pdf", downloadFinancialDocument);
router.post("/:id/void", voidFinancialDocument);
export default router;
