// backend/src/routes/api.js
// Main API router — delegates to domain-specific sub-routers
import express from "express";
import authRoutes from "./auth.js";
import adminRoutes from "./admin.js";
import jamaahRoutes, { adminJamaahAliasRouter } from "./jamaah.js";
import masterRoutes from "./master.js";
import agenRoutes, { adminAgenAliasRouter } from "./agen.js";
import notificationRoutes from "./notifications.js";
import calendarRoutes from "./calendar.js";
import publicRoutes from "./public.js";
import prospectRoutes from "./prospect.js";
import assetRoutes from "./assets.js";

const router = express.Router();

// Mount sub-routers
router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/jamaah", adminJamaahAliasRouter);
router.use("/jamaah", jamaahRoutes);
router.use("/master", masterRoutes);
router.use("/admin/master", masterRoutes);
router.use("/admin/agen", adminAgenAliasRouter);
router.use("/agen", agenRoutes);
router.use("/notifications", notificationRoutes);
router.use("/calendar", calendarRoutes);
router.use("/prospects", prospectRoutes);
router.use("/assets", assetRoutes);
router.use("/", publicRoutes);

export default router;
