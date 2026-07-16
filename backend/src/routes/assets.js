import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  assignAsset,
  createAsset,
  deleteAsset,
  downloadAssetDocument,
  getAssetById,
  getAssetHolders,
  getAssets,
  returnAsset,
  updateAsset,
} from "../controllers/assetController.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["ADMIN", "STAFF"]));

router.get("/", getAssets);
router.get("/holders", getAssetHolders);
router.get("/:id/documents/:documentId/download", downloadAssetDocument);
router.get("/:id", getAssetById);

router.post("/", authorize(["ADMIN"]), createAsset);
router.put("/:id", authorize(["ADMIN"]), updateAsset);
router.delete("/:id", authorize(["ADMIN"]), deleteAsset);
router.post("/:id/assign", authorize(["ADMIN"]), assignAsset);
router.post("/:id/return", authorize(["ADMIN"]), returnAsset);

export default router;
