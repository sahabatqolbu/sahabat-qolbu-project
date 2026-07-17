import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { saveDocument, uploadDocument } from "../utils/upload.js";
import {
  assignAsset,
  createAsset,
  deleteAsset,
  downloadAssetDocument,
  downloadAssetSignedDocument,
  getAssetAssignments,
  getAssetById,
  getAssetDocuments,
  getAssetHolders,
  getAssets,
  returnAsset,
  updateAsset,
  uploadAssetSignedDocument,
} from "../controllers/assetController.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["ADMIN", "STAFF"]));

router.get("/", getAssets);
router.get("/holders", getAssetHolders);
router.get("/assignments", getAssetAssignments);
router.get("/documents", getAssetDocuments);
router.get("/:id/documents/:documentId/download", downloadAssetDocument);
router.get("/:id/documents/:documentId/signed/download", downloadAssetSignedDocument);
router.get("/:id", getAssetById);

router.post("/", authorize(["ADMIN"]), createAsset);
router.put("/:id", authorize(["ADMIN"]), updateAsset);
router.delete("/:id", authorize(["ADMIN"]), deleteAsset);
router.post("/:id/assign", authorize(["ADMIN"]), assignAsset);
router.post("/:id/return", authorize(["ADMIN"]), returnAsset);
router.post(
  "/:id/documents/:documentId/signed",
  authorize(["ADMIN"]),
  uploadDocument.single("file"),
  saveDocument("documents"),
  uploadAssetSignedDocument,
);

export default router;