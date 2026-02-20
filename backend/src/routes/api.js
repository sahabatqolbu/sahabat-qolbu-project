// backend/src/routes/api.js
// Main API router — delegates to domain-specific sub-routers
import express from "express";
import authRoutes from "./auth.js";
import adminRoutes from "./admin.js";
import jamaahRoutes from "./jamaah.js";
import masterRoutes from "./master.js";
import agenRoutes from "./agen.js";
import notificationRoutes from "./notifications.js";
import calendarRoutes from "./calendar.js";
import publicRoutes from "./public.js";

const router = express.Router();

const ensureLeadingSlash = (url = "/") =>
  url.startsWith("/") ? url : `/${url}`;

const adminAgenRouteBridge = (req, _res, next) => {
  const normalizedUrl = ensureLeadingSlash(req.url);
  req.url = normalizedUrl.startsWith("/admin")
    ? normalizedUrl
    : `/admin${normalizedUrl}`;
  next();
};

const adminJamaahRouteBridge = (req, _res, next) => {
  const normalizedUrl = ensureLeadingSlash(req.url);
  req.url = normalizedUrl.startsWith("/admin")
    ? normalizedUrl
    : `/admin${normalizedUrl}`;
  next();
};

const adminReminderRouteBridge = (req, _res, next) => {
  const normalizedUrl = ensureLeadingSlash(req.url);
  req.url = normalizedUrl.startsWith("/admin/reminders")
    ? normalizedUrl
    : `/admin/reminders${normalizedUrl}`;
  next();
};

// Mount sub-routers
router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/jamaah", adminJamaahRouteBridge, jamaahRoutes);
router.use("/jamaah", jamaahRoutes);
router.use("/master", masterRoutes);
router.use("/admin/master", masterRoutes);
router.use("/admin/agen", adminAgenRouteBridge, agenRoutes);
router.use("/agen", agenRoutes);
router.use("/admin/reminders", adminReminderRouteBridge, notificationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/calendar", calendarRoutes);
router.use("/", publicRoutes);

export default router;
