import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { validate, validateQuery, prospectSchemas } from "../validators/index.js";
import {
  addProspectFollowUp,
  adminConvertProspectToJamaah,
  convertMyProspectToJamaah,
  getMyPackageInterests,
  getMyProspectSummary,
  getProspectDetail,
  getProspects,
  saveMyPackageInterest,
} from "../controllers/prospectController.js";

const router = express.Router();

router.get("/me", authenticate, authorize(["CALON_JAMAAH"]), getMyProspectSummary);
router.get(
  "/me/interests",
  authenticate,
  authorize(["CALON_JAMAAH"]),
  getMyPackageInterests,
);
router.post(
  "/me/interests",
  authenticate,
  authorize(["CALON_JAMAAH"]),
  validate(prospectSchemas.interest),
  saveMyPackageInterest,
);
router.post(
  "/me/convert",
  authenticate,
  authorize(["CALON_JAMAAH"]),
  validate(prospectSchemas.interest),
  convertMyProspectToJamaah,
);

router.get(
  "/admin",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  validateQuery(prospectSchemas.listQuery),
  getProspects,
);
router.get("/admin/:id", authenticate, authorize(["ADMIN", "STAFF"]), getProspectDetail);
router.post(
  "/admin/:id/follow-ups",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  validate(prospectSchemas.followUp),
  addProspectFollowUp,
);
router.post(
  "/admin/:id/convert",
  authenticate,
  authorize(["ADMIN"]),
  validate(prospectSchemas.interest),
  adminConvertProspectToJamaah,
);

export default router;
