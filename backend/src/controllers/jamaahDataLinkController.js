import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { auditLogs, jamaahData, jamaahDataLinks, users } from "../db/schema.js";
import { errorResponse, notFoundResponse, successResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { issueAuthSession } from "./authController.js";

const LINK_TTL_DAYS = 14;
const dashboardUrl = () => (process.env.DASHBOARD_URL || "https://dashboard.sahabatqolbu.com").replace(/\/$/, "");

export const hashLinkToken = (token) => createHash("sha256").update(String(token)).digest("hex");

// WhatsApp wants 62xxxxxxxxxx without "+", spaces or a leading 0.
export const toWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const audit = (req, action, description) =>
  db.insert(auditLogs).values({
    userId: req.user.userId,
    action,
    module: "JAMAAH_DATA_LINK",
    description,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
  }).catch((error) => logger.warn("Data link audit failed", { error: error.message }));

const findAccount = async (bookingNumber) => {
  const jamaah = await db.query.jamaahData.findFirst({
    where: eq(jamaahData.bookingNumber, String(bookingNumber || "")),
    columns: { id: true, userId: true, bookingNumber: true, memberName: true },
  });
  if (!jamaah) return { error: "Data jamaah tidak ditemukan" };
  const user = await db.query.users.findFirst({
    where: eq(users.id, jamaah.userId),
    columns: { id: true, fullName: true, phone: true, role: true, isActive: true },
  });
  if (!user) return { error: "Akun jamaah tidak ditemukan" };
  return { jamaah, user };
};

const activeLinkWhere = (userId) => and(
  eq(jamaahDataLinks.userId, userId),
  isNull(jamaahDataLinks.revokedAt),
  gt(jamaahDataLinks.expiresAt, new Date()),
);

export const createDataLink = async (req, res, next) => {
  try {
    const { jamaah, user, error } = await findAccount(req.params.bookingNumber);
    if (error) return notFoundResponse(res, error);
    if (user.role !== "JAMAAH") return errorResponse(res, "Link pengisian data hanya untuk akun jamaah", 400);
    if (!user.isActive) return errorResponse(res, "Akun jamaah nonaktif", 400);

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
    await db.transaction(async (tx) => {
      // One live link per account: a new link replaces the previous one.
      await tx.update(jamaahDataLinks).set({ revokedAt: new Date() }).where(activeLinkWhere(user.id));
      await tx.insert(jamaahDataLinks).values({ userId: user.id, tokenHash: hashLinkToken(token), expiresAt, createdBy: req.user.userId });
    });
    await audit(req, "CREATE_DATA_LINK", `Link pengisian data untuk booking ${jamaah.bookingNumber}`);

    const url = `${dashboardUrl()}/isi-data/${token}`;
    const name = jamaah.memberName || user.fullName || "Bapak/Ibu";
    const message = [
      `Assalamu'alaikum ${name},`,
      "",
      "Untuk persiapan keberangkatan umroh bersama Sahabat Qolbu, mohon lengkapi data jamaah melalui link berikut:",
      url,
      "",
      "Cukup buka link di HP, tidak perlu membuat akun atau password. Data tersimpan otomatis, dokumen bisa menyusul.",
      `Link berlaku ${LINK_TTL_DAYS} hari dan khusus untuk Anda, mohon tidak dibagikan.`,
      "",
      "Terima kasih.",
    ].join("\n");
    const waNumber = toWhatsAppNumber(user.phone);
    return successResponse(res, {
      url,
      expiresAt,
      message,
      whatsappUrl: waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}` : null,
      phone: user.phone || null,
    }, "Link pengisian data dibuat");
  } catch (error) {
    next(error);
  }
};

export const getDataLinkStatus = async (req, res, next) => {
  try {
    const { user, error } = await findAccount(req.params.bookingNumber);
    if (error) return notFoundResponse(res, error);
    const link = await db.query.jamaahDataLinks.findFirst({
      where: activeLinkWhere(user.id),
      orderBy: [desc(jamaahDataLinks.createdAt)],
      columns: { createdAt: true, expiresAt: true, lastUsedAt: true, useCount: true },
    });
    return successResponse(res, { active: Boolean(link), ...(link || {}) });
  } catch (error) {
    next(error);
  }
};

export const revokeDataLink = async (req, res, next) => {
  try {
    const { jamaah, user, error } = await findAccount(req.params.bookingNumber);
    if (error) return notFoundResponse(res, error);
    await db.update(jamaahDataLinks).set({ revokedAt: new Date() }).where(activeLinkWhere(user.id));
    await audit(req, "REVOKE_DATA_LINK", `Link pengisian data dicabut untuk booking ${jamaah.bookingNumber}`);
    return successResponse(res, null, "Link pengisian data dicabut");
  } catch (error) {
    next(error);
  }
};

// Public: trade a personal link for a normal jamaah session.
export const exchangeDataLink = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "");
    if (token.length < 20 || token.length > 100) return errorResponse(res, "Link tidak valid", 400);
    const link = await db.query.jamaahDataLinks.findFirst({
      where: and(eq(jamaahDataLinks.tokenHash, hashLinkToken(token)), isNull(jamaahDataLinks.revokedAt), gt(jamaahDataLinks.expiresAt, new Date())),
    });
    if (!link) {
      logger.security("Data link rejected", { ip: req.ip });
      return errorResponse(res, "Link sudah tidak berlaku. Minta link baru ke admin Sahabat Qolbu.", 410, null, "DATA_LINK_INVALID");
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, link.userId),
      columns: { id: true, email: true, fullName: true, role: true, phone: true, isActive: true },
    });
    if (!user || !user.isActive || user.role !== "JAMAAH") {
      return errorResponse(res, "Akun untuk link ini tidak aktif. Hubungi admin Sahabat Qolbu.", 410, null, "DATA_LINK_INVALID");
    }
    await db.update(jamaahDataLinks).set({ lastUsedAt: new Date(), useCount: link.useCount + 1 }).where(eq(jamaahDataLinks.id, link.id));
    logger.security("Data link used", { userId: user.id, linkId: link.id, ip: req.ip });
    return issueAuthSession(req, res, user, "Selamat datang");
  } catch (error) {
    next(error);
  }
};

// Same requirements as submitting for approval (jamaahSelfController.submitForApproval).
const REQUIRED_FIELDS = ["namaPaspor", "nik", "birthDate", "birthPlace", "gender", "address", "province", "city", "emergencyName", "emergencyPhone"];
const REQUIRED_DOCS = ["fotoUrl", "ktpUrl", "kkUrl"];

const memberProgress = (member) => {
  const filled = [...REQUIRED_FIELDS, ...REQUIRED_DOCS].filter((field) => member[field]).length;
  return Math.round((filled / (REQUIRED_FIELDS.length + REQUIRED_DOCS.length)) * 100);
};

// Tracker for the data collection drive: one row per jamaah account (a family shares one link).
export const getDataCollection = async (req, res, next) => {
  try {
    const members = await db
      .select({
        id: jamaahData.id,
        userId: jamaahData.userId,
        bookingNumber: jamaahData.bookingNumber,
        memberName: jamaahData.memberName,
        isPrimaryMember: jamaahData.isPrimaryMember,
        registrationStatus: jamaahData.registrationStatus,
        ...Object.fromEntries([...REQUIRED_FIELDS, ...REQUIRED_DOCS].map((field) => [field, jamaahData[field]])),
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(jamaahData)
      .innerJoin(users, eq(users.id, jamaahData.userId))
      .where(and(eq(users.role, "JAMAAH"), eq(users.isActive, true)));

    const links = await db.select().from(jamaahDataLinks).orderBy(desc(jamaahDataLinks.createdAt));
    const latestLink = new Map();
    for (const link of links) if (!latestLink.has(link.userId)) latestLink.set(link.userId, link);

    const accounts = new Map();
    for (const member of members) {
      const account = accounts.get(member.userId) || { userId: member.userId, name: member.fullName, phone: member.phone, members: [] };
      account.members.push({
        bookingNumber: member.bookingNumber,
        name: member.memberName || member.namaPaspor || member.fullName,
        isPrimary: Boolean(member.isPrimaryMember),
        registrationStatus: member.registrationStatus,
        progress: memberProgress(member),
      });
      accounts.set(member.userId, account);
    }

    const now = Date.now();
    const rows = [...accounts.values()].map((account) => {
      account.members.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
      const link = latestLink.get(account.userId);
      const progress = Math.round(account.members.reduce((sum, m) => sum + m.progress, 0) / account.members.length);
      return {
        ...account,
        bookingNumber: account.members[0].bookingNumber,
        progress,
        complete: account.members.every((m) => m.progress === 100),
        submitted: account.members.every((m) => m.registrationStatus !== "DRAFT"),
        link: link ? {
          sentAt: link.createdAt,
          active: !link.revokedAt && new Date(link.expiresAt).getTime() > now,
          expiresAt: link.expiresAt,
          lastUsedAt: link.lastUsedAt,
          useCount: link.useCount,
        } : null,
      };
    }).sort((a, b) => a.progress - b.progress);

    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};
