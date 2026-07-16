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
import { getPublicCompanyProfile } from "../controllers/companyController.js";
import { getPublicFaqs } from "../controllers/faqController.js";
import { getPublicGallery } from "../controllers/galleryController.js";
import {
  getPublicArticles,
  getPublicArticleBySlug,
  getPublicHotelById,
  getPublicAirlineById,
} from "../controllers/articleController.js";

const router = express.Router();

// Health check
router.get("/health-check", (req, res) =>
  res.json({ status: "API router is alive" }),
);

// Public package listing (no auth required)
router.get("/packages", getPublicPackages);
router.get("/packages/:id", getPublicPackageById);
router.get("/company-profile", getPublicCompanyProfile);
router.get("/faqs", getPublicFaqs);
router.get("/gallery", getPublicGallery);
router.get("/articles", getPublicArticles);
router.get("/articles/:slug", getPublicArticleBySlug);
router.get("/hotels/:id", getPublicHotelById);
router.get("/airlines/:id", getPublicAirlineById);
router.get("/agents/slugs", getPublicAgentSlugs);
router.get("/agents/:slug", getPublicAgentLandingBySlug);

export default router;
