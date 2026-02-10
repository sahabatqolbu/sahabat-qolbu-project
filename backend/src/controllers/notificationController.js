// backend/src/controllers/notificationController.js

import { db } from "../db/index.js";
import { notifications, users, jamaahData, agentData } from "../db/schema.js";
import { eq, and, desc, inArray, sql, or, gte } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

// =====================================================
// HELPER: Create Notification
// =====================================================
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link = null,
  referenceId = null,
  referenceType = null,
}) => {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      link,
      referenceId,
      referenceType,
      isRead: false,
    });
    logger.info("Notification created", { userId, type });
    return true;
  } catch (error) {
    logger.error("Failed to create notification", error, { userId, type });
    return false;
  }
};

// =====================================================
// HELPER: Send to All Admins
// =====================================================
export const notifyAdmins = async ({
  type,
  title,
  message,
  link = null,
  referenceId = null,
  referenceType = null,
}) => {
  try {
    const admins = await db.query.users.findMany({
      where: and(eq(users.role, "ADMIN"), eq(users.isActive, true)),
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type,
        title,
        message,
        link,
        referenceId,
        referenceType,
      });
    }

    logger.info("Notification sent to admins", { count: admins.length, type });
    return true;
  } catch (error) {
    logger.error("Failed to notify admins", error, { type });
    return false;
  }
};

// =====================================================
// HELPER: Send to Finance Team
// =====================================================
export const notifyFinance = async ({
  type,
  title,
  message,
  link = null,
  referenceId = null,
  referenceType = null,
}) => {
  try {
    const financeUsers = await db.query.users.findMany({
      where: and(
        inArray(users.role, ["ADMIN", "FINANCE"]),
        eq(users.isActive, true),
      ),
    });

    for (const user of financeUsers) {
      await createNotification({
        userId: user.id,
        type,
        title,
        message,
        link,
        referenceId,
        referenceType,
      });
    }

    return true;
  } catch (error) {
    logger.error("Failed to notify finance", error, { type });
    return false;
  }
};

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================
export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, unreadOnly = false } = req.query;

    const conditions = [eq(notifications.userId, userId)];

    if (unreadOnly === "true") {
      conditions.push(eq(notifications.isRead, false));
    }

    const result = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
      limit: parseInt(limit),
    });

    const unreadCountResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    const unreadCount = Number(unreadCountResult[0]?.count || 0);

    return successResponse(res, {
      notifications: result,
      unreadCount,
    });
  } catch (error) {
    logger.error("Get notifications error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// GET UNREAD COUNT
// =====================================================
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    const count = Number(result[0]?.count || 0);

    return successResponse(res, { unreadCount: count });
  } catch (error) {
    logger.error("Get unread count error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// ADMIN: GET PENDING AGENT APPROVAL COUNT
// =====================================================
export const getPendingAgentApprovalsCount = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !["ADMIN", "STAFF", "FINANCE"].includes(user.role)) {
      return errorResponse(res, "Unauthorized", 403);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(agentData)
      .where(eq(agentData.status, "PENDING"));

    const todayResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(agentData)
      .where(and(eq(agentData.status, "PENDING"), gte(agentData.submittedAt, today)));

    const pendingCount = Number(result[0]?.count || 0);
    const todayCount = Number(todayResult[0]?.count || 0);

    return successResponse(res, {
      pendingApprovals: pendingCount,
      todaySubmitted: todayCount,
    });
  } catch (error) {
    logger.error("Get pending agent approvals count error", error);
    next(error);
  }
};

// =====================================================
// MARK AS READ (Single)
// =====================================================
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, parseInt(id)),
        eq(notifications.userId, userId),
      ),
    });

    if (!notification) {
      return errorResponse(res, "Notifikasi tidak ditemukan", 404);
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, parseInt(id)));

    return successResponse(res, null, "Notifikasi ditandai sudah dibaca");
  } catch (error) {
    logger.error("Mark as read error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// MARK ALL AS READ
// =====================================================
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return successResponse(res, null, "Semua notifikasi ditandai sudah dibaca");
  } catch (error) {
    logger.error("Mark all as read error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// DELETE NOTIFICATION
// =====================================================
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, parseInt(id)),
        eq(notifications.userId, userId),
      ),
    });

    if (!notification) {
      return errorResponse(res, "Notifikasi tidak ditemukan", 404);
    }

    await db.delete(notifications).where(eq(notifications.id, parseInt(id)));

    return successResponse(res, null, "Notifikasi dihapus");
  } catch (error) {
    logger.error("Delete notification error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// DELETE ALL READ NOTIFICATIONS
// =====================================================
export const deleteAllRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await db
      .delete(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, true)),
      );

    return successResponse(res, null, "Notifikasi yang sudah dibaca dihapus");
  } catch (error) {
    logger.error("Delete all read notifications error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// ADMIN: GET JAMAAH NEEDING REMINDER
// =====================================================
export const getJamaahNeedingReminder = async (req, res, next) => {
  try {
    const { filter } = req.query;

    const jamaahList = await db.query.jamaahData.findMany({
      with: {
        user: {
          columns: {
            password: false,
            otp: false,
            otpExpiry: false,
          },
        },
        package: true,
      },
      orderBy: [desc(jamaahData.createdAt)],
    });

    const now = new Date();
    const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

    const result = jamaahList.map((jamaah) => {
      const documentIssues = [];
      const paymentIssues = [];

      if (!jamaah.ktpUrl) documentIssues.push("KTP belum diupload");
      if (!jamaah.pasporUrl) documentIssues.push("Paspor belum diupload");
      if (!jamaah.fotoUrl) documentIssues.push("Foto belum diupload");
      if (!jamaah.kkUrl) documentIssues.push("KK belum diupload");
      if (!jamaah.namaPaspor) documentIssues.push("Nama paspor belum diisi");
      if (!jamaah.passportNumber)
        documentIssues.push("Nomor paspor belum diisi");
      if (!jamaah.birthDate) documentIssues.push("Tanggal lahir belum diisi");

      if (jamaah.statusPayment === "BELUM_BAYAR") {
        paymentIssues.push("Belum ada pembayaran");
      } else if (jamaah.statusPayment === "CICILAN") {
        const outstanding = parseFloat(jamaah.outstanding || 0);
        if (outstanding > 0) {
          paymentIssues.push(
            `Sisa pembayaran: Rp ${outstanding.toLocaleString("id-ID")}`,
          );
        }
      }

      let deadline = null;
      let daysUntilDeadline = null;
      let isUrgent = false;

      if (jamaah.package?.departureDate) {
        deadline = new Date(jamaah.package.departureDate);
      } else if (jamaah.createdAt) {
        deadline = new Date(
          new Date(jamaah.createdAt).getTime() + TWO_WEEKS_MS,
        );
      }

      if (deadline && !isNaN(deadline.getTime())) {
        daysUntilDeadline = Math.ceil(
          (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
      }

      const hasDocumentIssues = documentIssues.length > 0;
      const hasPaymentIssues = paymentIssues.length > 0;
      const hasIssues = hasDocumentIssues || hasPaymentIssues;

      return {
        id: jamaah.id,
        userId: jamaah.userId,
        bookingNumber: jamaah.bookingNumber,
        fullName: jamaah.user?.fullName || jamaah.namaPaspor || "-",
        email: jamaah.user?.email || "-",
        phone: jamaah.user?.phone || "-",
        packageName: jamaah.package?.name || "Belum pilih paket",
        packageDepartureDate: jamaah.package?.departureDate || null,
        registrationStatus: jamaah.registrationStatus,
        statusPayment: jamaah.statusPayment,
        documentIssues,
        paymentIssues,
        hasDocumentIssues,
        hasPaymentIssues,
        hasIssues,
        deadline,
        daysUntilDeadline,
        isUrgent,
        createdAt: jamaah.createdAt,
      };
    });

    let filtered = result;
    if (filter === "document") {
      filtered = result.filter((j) => j.hasDocumentIssues);
    } else if (filter === "payment") {
      filtered = result.filter((j) => j.hasPaymentIssues);
    } else if (filter === "all-issues") {
      filtered = result.filter((j) => j.hasIssues);
    } else if (filter === "urgent") {
      filtered = result.filter((j) => j.isUrgent && j.hasIssues);
    }

    filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
        return a.daysUntilDeadline - b.daysUntilDeadline;
      }
      return 0;
    });

    return successResponse(res, {
      data: filtered,
      stats: {
        total: result.length,
        withDocumentIssues: result.filter((j) => j.hasDocumentIssues).length,
        withPaymentIssues: result.filter((j) => j.hasPaymentIssues).length,
        withAnyIssues: result.filter((j) => j.hasIssues).length,
        urgent: result.filter((j) => j.isUrgent && j.hasIssues).length,
        complete: result.filter((j) => !j.hasIssues).length,
      },
    });
  } catch (error) {
    logger.error("Get jamaah needing reminder error", error);
    next(error);
  }
};

// =====================================================
// ADMIN: GET AGEN NEEDING REMINDER
// =====================================================
export const getAgenNeedingReminder = async (req, res, next) => {
  try {
    const { filter } = req.query;

    const agenList = await db.query.users.findMany({
      where: eq(users.role, "AGEN"),
      with: {
        agentData: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    const now = new Date();
    const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

    const result = agenList.map((agen) => {
      const profileIssues = [];
      const documentIssues = [];
      const paymentIssues = [];

      const ad = agen.agentData;

      if (!ad?.fullNameKtp) profileIssues.push("Nama KTP belum diisi");
      if (!ad?.nik) profileIssues.push("NIK belum diisi");
      if (!ad?.birthPlace) profileIssues.push("Tempat lahir belum diisi");
      if (!ad?.birthDate) profileIssues.push("Tanggal lahir belum diisi");
      if (!ad?.address) profileIssues.push("Alamat belum diisi");
      if (!ad?.province) profileIssues.push("Provinsi belum diisi");
      if (!ad?.city) profileIssues.push("Kota belum diisi");
      if (!ad?.accountName) profileIssues.push("Nama rekening belum diisi");
      if (!ad?.accountNumber) profileIssues.push("Nomor rekening belum diisi");
      if (!ad?.bankName) profileIssues.push("Nama bank belum diisi");

      if (!ad?.ktpPhoto) documentIssues.push("Foto KTP belum diupload");

      if (ad?.currentStar === 0 && !ad?.paymentProof) {
        paymentIssues.push("Bukti pembayaran registrasi belum diupload");
      }

      if (ad?.status === "DRAFT") {
        profileIssues.push("Status masih DRAFT (belum submit)");
      }

      let deadline = null;
      let daysUntilDeadline = null;
      let isUrgent = false;

      if (agen.createdAt) {
        deadline = new Date(new Date(agen.createdAt).getTime() + TWO_WEEKS_MS);
        if (!isNaN(deadline.getTime())) {
          daysUntilDeadline = Math.ceil(
            (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
          );
          isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
        }
      }

      const hasProfileIssues = profileIssues.length > 0;
      const hasDocumentIssues = documentIssues.length > 0;
      const hasPaymentIssues = paymentIssues.length > 0;
      const hasIssues =
        hasProfileIssues || hasDocumentIssues || hasPaymentIssues;

      return {
        id: agen.id,
        userId: agen.id,
        fullName: agen.fullName,
        email: agen.email,
        phone: agen.phone || "-",
        currentStar: ad?.currentStar || 0,
        status: ad?.status || "DRAFT",
        isComplete: ad?.isComplete || false,
        profileIssues,
        documentIssues,
        paymentIssues,
        hasProfileIssues,
        hasDocumentIssues,
        hasPaymentIssues,
        hasIssues,
        deadline,
        daysUntilDeadline,
        isUrgent,
        createdAt: agen.createdAt,
      };
    });

    let filtered = result;
    if (filter === "profile") {
      filtered = result.filter((a) => a.hasProfileIssues);
    } else if (filter === "document") {
      filtered = result.filter((a) => a.hasDocumentIssues);
    } else if (filter === "payment") {
      filtered = result.filter((a) => a.hasPaymentIssues);
    } else if (filter === "all-issues") {
      filtered = result.filter((a) => a.hasIssues);
    } else if (filter === "urgent") {
      filtered = result.filter((a) => a.isUrgent && a.hasIssues);
    }

    filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
        return a.daysUntilDeadline - b.daysUntilDeadline;
      }
      return 0;
    });

    return successResponse(res, {
      data: filtered,
      stats: {
        total: result.length,
        withProfileIssues: result.filter((a) => a.hasProfileIssues).length,
        withDocumentIssues: result.filter((a) => a.hasDocumentIssues).length,
        withPaymentIssues: result.filter((a) => a.hasPaymentIssues).length,
        withAnyIssues: result.filter((a) => a.hasIssues).length,
        urgent: result.filter((a) => a.isUrgent && a.hasIssues).length,
        complete: result.filter((a) => !a.hasIssues).length,
      },
    });
  } catch (error) {
    logger.error("Get agen needing reminder error", error);
    next(error);
  }
};

// =====================================================
// ADMIN: SEND REMINDER (Single)
// =====================================================
export const sendReminder = async (req, res, next) => {
  try {
    const { userId, type, title, message, referenceId, referenceType } =
      req.body;

    if (!userId || !type || !title || !message) {
      return errorResponse(
        res,
        "userId, type, title, dan message wajib diisi",
        400,
      );
    }

    const allowedTypes = [
      "REMINDER_DOCUMENT",
      "REMINDER_PAYMENT",
      "REMINDER_PROFILE",
      "REMINDER_GENERAL",
    ];
    if (!allowedTypes.includes(type)) {
      return errorResponse(res, "Type tidak valid", 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId)),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    let link = "/";
    if (user.role === "JAMAAH") {
      link = "/jamaah";
    } else if (user.role === "AGEN") {
      link = "/agen/profile";
    }

    await db.insert(notifications).values({
      userId: parseInt(userId),
      type,
      title,
      message,
      link,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      isRead: false,
    });

    logger.info("Reminder sent", { userId: parseInt(userId) });

    return successResponse(res, null, "Pengingat berhasil dikirim");
  } catch (error) {
    logger.error("Send reminder error", error);
    next(error);
  }
};

// =====================================================
// ADMIN: SEND BULK REMINDER
// =====================================================
export const sendBulkReminder = async (req, res, next) => {
  try {
    const { userIds, type, title, message } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(
        res,
        "userIds harus berupa array dan tidak boleh kosong",
        400,
      );
    }

    if (!type || !title || !message) {
      return errorResponse(res, "type, title, dan message wajib diisi", 400);
    }

    const allowedTypes = [
      "REMINDER_DOCUMENT",
      "REMINDER_PAYMENT",
      "REMINDER_PROFILE",
      "REMINDER_GENERAL",
    ];
    if (!allowedTypes.includes(type)) {
      return errorResponse(res, "Type tidak valid", 400);
    }

    const userList = await db.query.users.findMany({
      where: inArray(
        users.id,
        userIds.map((id) => parseInt(id)),
      ),
    });

    if (userList.length === 0) {
      return errorResponse(res, "Tidak ada user yang ditemukan", 404);
    }

    const notificationValues = userList.map((user) => {
      let link = "/";
      if (user.role === "JAMAAH") {
        link = "/jamaah";
      } else if (user.role === "AGEN") {
        link = "/agen/profile";
      }

      return {
        userId: user.id,
        type,
        title,
        message,
        link,
        referenceId: null,
        referenceType: null,
        isRead: false,
      };
    });

    await db.insert(notifications).values(notificationValues);

    logger.info("Bulk reminder sent", { count: userList.length });

    return successResponse(
      res,
      {
        sent: userList.length,
      },
      `Pengingat berhasil dikirim ke ${userList.length} orang`,
    );
  } catch (error) {
    logger.error("Bulk reminder error", error);
    next(error);
  }
};

// =====================================================
// AGEN: GET MY JAMAAH NEEDING REMINDER
// =====================================================
export const getAgenJamaahReminders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { filter } = req.query;

    const jamaahList = await db.query.jamaahData.findMany({
      where: eq(jamaahData.agenId, userId),
      with: {
        user: {
          columns: {
            password: false,
            otp: false,
            otpExpiry: false,
          },
        },
        package: true,
      },
      orderBy: [desc(jamaahData.createdAt)],
    });

    const now = new Date();
    const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

    const result = jamaahList.map((jamaah) => {
      const documentIssues = [];
      const paymentIssues = [];

      if (!jamaah.ktpUrl) documentIssues.push("KTP belum diupload");
      if (!jamaah.pasporUrl) documentIssues.push("Paspor belum diupload");
      if (!jamaah.fotoUrl) documentIssues.push("Foto belum diupload");
      if (!jamaah.kkUrl) documentIssues.push("KK belum diupload");
      if (!jamaah.namaPaspor) documentIssues.push("Nama paspor belum diisi");
      if (!jamaah.passportNumber)
        documentIssues.push("Nomor paspor belum diisi");
      if (!jamaah.birthDate) documentIssues.push("Tanggal lahir belum diisi");

      if (jamaah.statusPayment === "BELUM_BAYAR") {
        paymentIssues.push("Belum ada pembayaran");
      } else if (jamaah.statusPayment === "CICILAN") {
        const outstanding = parseFloat(jamaah.outstanding || 0);
        if (outstanding > 0) {
          paymentIssues.push(`Sisa: Rp ${outstanding.toLocaleString("id-ID")}`);
        }
      }

      let deadline = null;
      let daysUntilDeadline = null;
      let isUrgent = false;

      if (jamaah.package?.departureDate) {
        deadline = new Date(jamaah.package.departureDate);
      } else if (jamaah.createdAt) {
        deadline = new Date(
          new Date(jamaah.createdAt).getTime() + TWO_WEEKS_MS,
        );
      }

      if (deadline && !isNaN(deadline.getTime())) {
        daysUntilDeadline = Math.ceil(
          (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
      }

      const hasDocumentIssues = documentIssues.length > 0;
      const hasPaymentIssues = paymentIssues.length > 0;
      const hasIssues = hasDocumentIssues || hasPaymentIssues;

      return {
        id: jamaah.id,
        userId: jamaah.userId,
        bookingNumber: jamaah.bookingNumber,
        fullName: jamaah.user?.fullName || jamaah.namaPaspor || "-",
        email: jamaah.user?.email || "-",
        phone: jamaah.user?.phone || "-",
        packageName: jamaah.package?.name || "Belum pilih paket",
        packageDepartureDate: jamaah.package?.departureDate || null,
        registrationStatus: jamaah.registrationStatus,
        statusPayment: jamaah.statusPayment,
        documentIssues,
        paymentIssues,
        hasDocumentIssues,
        hasPaymentIssues,
        hasIssues,
        deadline,
        daysUntilDeadline,
        isUrgent,
        createdAt: jamaah.createdAt,
      };
    });

    let filtered = result;
    if (filter === "document") {
      filtered = result.filter((j) => j.hasDocumentIssues);
    } else if (filter === "payment") {
      filtered = result.filter((j) => j.hasPaymentIssues);
    } else if (filter === "all-issues") {
      filtered = result.filter((j) => j.hasIssues);
    } else if (filter === "urgent") {
      filtered = result.filter((j) => j.isUrgent && j.hasIssues);
    }

    filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
        return a.daysUntilDeadline - b.daysUntilDeadline;
      }
      return 0;
    });

    return successResponse(res, {
      data: filtered,
      stats: {
        total: result.length,
        withDocumentIssues: result.filter((j) => j.hasDocumentIssues).length,
        withPaymentIssues: result.filter((j) => j.hasPaymentIssues).length,
        withAnyIssues: result.filter((j) => j.hasIssues).length,
        urgent: result.filter((j) => j.isUrgent && j.hasIssues).length,
        complete: result.filter((j) => !j.hasIssues).length,
      },
    });
  } catch (error) {
    logger.error("Get agen jamaah reminders error", error, { userId: req.user?.userId });
    next(error);
  }
};

// =====================================================
// AGEN: SEND REMINDER TO JAMAAH
// =====================================================
export const agenSendReminderToJamaah = async (req, res, next) => {
  try {
    const agenUserId = req.user.userId;
    const { jamaahUserId, type, title, message } = req.body;

    if (!jamaahUserId || !type || !title || !message) {
      return errorResponse(
        res,
        "jamaahUserId, type, title, dan message wajib diisi",
        400,
      );
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: and(
        eq(jamaahData.userId, parseInt(jamaahUserId)),
        eq(jamaahData.agenId, agenUserId),
      ),
      with: {
        user: true,
      },
    });

    if (!jamaah) {
      return errorResponse(
        res,
        "Jamaah tidak ditemukan atau bukan milik Anda",
        404,
      );
    }

    await db.insert(notifications).values({
      userId: parseInt(jamaahUserId),
      type,
      title,
      message,
      link: "/jamaah",
      referenceId: jamaah.id,
      referenceType: "jamaah",
      isRead: false,
    });

    logger.info("Agen sent reminder to jamaah", {
      agenUserId,
      jamaahUserId: parseInt(jamaahUserId),
    });

    return successResponse(res, null, "Pengingat berhasil dikirim ke jamaah");
  } catch (error) {
    logger.error("Agen send reminder error", error, { userId: req.user?.userId });
    next(error);
  }
};
