// backend/src/routes/public.js
import express from "express";
import {
  getPublicPackages,
  getPublicPackageById,
} from "../controllers/packageController.js";
import {
  getPublicAgentLandingBySlug,
  getPublicAgentSlugs,
} from "../controllers/publicAgentController.js";

const router = express.Router();

// Health check
router.get("/health-check", (req, res) => res.json({ status: "API router is alive" }));

// Public package listing (no auth required)
router.get("/packages", getPublicPackages);
router.get("/packages/:id", getPublicPackageById);
router.get("/agents/slugs", getPublicAgentSlugs);
router.get("/agents/:slug", getPublicAgentLandingBySlug);

export default router;
