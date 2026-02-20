// backend/src/routes/notifications.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    getPendingAgentApprovalsCount,
    getJamaahNeedingReminder,
    getAgenNeedingReminder,
    sendReminder,
    sendBulkReminder,
    getAgenJamaahReminders,
    agenSendReminderToJamaah,
} from "../controllers/notificationController.js";

const router = express.Router();

// =====================================================
// GENERAL NOTIFICATION ROUTES
// =====================================================
router.get("/", authenticate, getMyNotifications);
router.get("/unread-count", authenticate, getUnreadCount);
router.get("/admin/pending-agent-approvals", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getPendingAgentApprovalsCount);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);
router.delete("/clear-read", authenticate, deleteAllRead);
router.delete("/:id", authenticate, deleteNotification);

// =====================================================
// ADMIN REMINDER ROUTES
// =====================================================
router.get("/admin/reminders/jamaah", authenticate, authorize(["ADMIN", "FINANCE", "STAFF"]), getJamaahNeedingReminder);
router.get("/admin/reminders/agen", authenticate, authorize(["ADMIN", "STAFF", "FINANCE"]), getAgenNeedingReminder);
router.post("/admin/reminders/send", authenticate, authorize(["ADMIN"]), sendReminder);
router.post("/admin/reminders/send-bulk", authenticate, authorize(["ADMIN"]), sendBulkReminder);

// =====================================================
// AGEN NOTIFICATION & REMINDER ROUTES
// =====================================================
router.get("/agen", authenticate, authorize(["AGEN"]), getMyNotifications);
router.get("/agen/unread-count", authenticate, authorize(["AGEN"]), getUnreadCount);
router.patch("/agen/:id/read", authenticate, authorize(["AGEN"]), markAsRead);
router.patch("/agen/read-all", authenticate, authorize(["AGEN"]), markAllAsRead);
router.get("/agen/reminders/jamaah", authenticate, authorize(["AGEN"]), getAgenJamaahReminders);
router.post("/agen/reminders/send", authenticate, authorize(["AGEN"]), agenSendReminderToJamaah);

export default router;
