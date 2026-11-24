import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { auditLogs, jamaahData, jamaahDataLinks, masterBanks, packages, users } from "../db/schema.js";
import { seatHeldForPackage } from "../utils/seats.js";
import { sendSeatConfirmedEmail } from "../utils/email.js";
import { errorResponse, notFoundResponse, successResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { issueAuthSession } from "./authController.js";
import { extractToken, verifyToken } from "../utils/jwt.js";

const LINK_TTL_DAYS = 14;
const dashboardUrl = () => (process.env.DASHBOARD_URL || "https://dashboard.sahabatqolbu.com").replace(/\/$/, "");

const STAFF_ROLES = new Set(["ADMIN", "STAFF", "FINANCE", "AGEN"]);

// Role of the staff session already in this browser, if any; jamaah flows must not replace it.
export const currentStaffRole = async (req) => {
  const token = extractToken(req.headers?.authorization) || req.cookies?.access_token;
  if (!token) return null;
  try {
    const { userId } = verifyToken(token);
    const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { role: true, isActive: true } });
    return user?.isActive && STAFF_ROLES.has(user.role) ? user.role : null;
  } catch {
    return null;
  }
};

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

// One live link per account: a new link replaces the previous one.
export const issueDataLink = async (userId, createdBy = null) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.transaction(async (tx) => {
    await tx.update(jamaahDataLinks).set({ revokedAt: new Date() }).where(activeLinkWhere(userId));
    await tx.insert(jamaahDataLinks).values({ userId, tokenHash: hashLinkToken(token), expiresAt, createdBy });
  });
  return { url: `${dashboardUrl()}/isi-data/${token}`, expiresAt };
};

export const createDataLink = async (req, res, next) => {
  try {
    const { jamaah, user, error } = await findAccount(req.params.bookingNumber);
    if (error) return notFoundResponse(res, error);
    if (user.role !== "JAMAAH") return errorResponse(res, "Link pengisian data hanya untuk akun jamaah", 400);
    if (!user.isActive) return errorResponse(res, "Akun jamaah nonaktif", 400);

    const { url, expiresAt } = await issueDataLink(user.id, req.user.userId);
    await audit(req, "CREATE_DATA_LINK", `Link pengisian data untuk booking ${jamaah.bookingNumber}`);

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
    const staffRole = await currentStaffRole(req);
    if (staffRole) {
      return errorResponse(res, `Browser ini sedang login sebagai ${staffRole}. Buka link jamaah di jendela incognito agar sesi Anda tidak tertimpa.`, 409, null, "STAFF_SESSION_ACTIVE");
    }
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
        seatConfirmedAt: jamaahData.seatConfirmedAt,
        statusPayment: jamaahData.statusPayment,
        packageId: jamaahData.packageId,
        ...Object.fromEntries([...REQUIRED_FIELDS, ...REQUIRED_DOCS].map((field) => [field, jamaahData[field]])),
        fullName: users.fullName,
        phone: users.phone,
        email: users.email,
      })
      .from(jamaahData)
      .innerJoin(users, eq(users.id, jamaahData.userId))
      .where(and(eq(users.role, "JAMAAH"), eq(users.isActive, true)));

    const links = await db.select().from(jamaahDataLinks).orderBy(desc(jamaahDataLinks.createdAt));
    const latestLink = new Map();
    for (const link of links) if (!latestLink.has(link.userId)) latestLink.set(link.userId, link);

    const accounts = new Map();
    for (const member of members) {
      const email = member.email && !member.email.endsWith(".invalid") ? member.email : null;
      const account = accounts.get(member.userId) || { userId: member.userId, name: member.fullName, phone: member.phone, email, members: [] };
      account.members.push({
        bookingNumber: member.bookingNumber,
        name: member.memberName || member.namaPaspor || member.fullName,
        isPrimary: Boolean(member.isPrimaryMember),
        registrationStatus: member.registrationStatus,
        progress: memberProgress(member),
        seatHeld: holdsSeat(member),
        hasPackage: Boolean(member.packageId),
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
        seatConfirmed: account.members.every((m) => m.seatHeld || !m.hasPackage),
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

const holdsSeat = (member) =>
  Boolean(member.seatConfirmedAt) || ["CICILAN", "LUNAS"].includes(member.statusPayment) || member.registrationStatus === "APPROVED";

// Admin confirms a registration: hold the seats, then email the jamaah an access link and payment details.
export const confirmSeat = async (req, res, next) => {
  try {
    const { jamaah, user, error } = await findAccount(req.params.bookingNumber);
    if (error) return notFoundResponse(res, error);
    if (user.role !== "JAMAAH") return errorResponse(res, "Konfirmasi hanya untuk akun jamaah", 400);

    const members = await db.query.jamaahData.findMany({ where: eq(jamaahData.userId, user.id) });
    const pending = members.filter((m) => m.packageId && !m.seatConfirmedAt && m.registrationStatus !== "REJECTED");
    if (pending.length === 0) return errorResponse(res, "Semua anggota sudah dikonfirmasi atau belum memilih paket", 400);

    const byPackage = new Map();
    for (const member of pending) byPackage.set(member.packageId, [...(byPackage.get(member.packageId) || []), member]);
    for (const [packageId, group] of byPackage) {
      const pkg = await db.query.packages.findFirst({ where: eq(packages.id, packageId), columns: { name: true, totalSeats: true } });
      const [{ held }] = await db.select({ held: count() }).from(jamaahData).where(seatHeldForPackage(packageId));
      const needed = group.filter((m) => !holdsSeat(m)).length;
      const remaining = Number(pkg?.totalSeats || 0) - Number(held || 0);
      if (needed > remaining) {
        return errorResponse(res, `Sisa seat ${pkg?.name || "paket"} tinggal ${Math.max(remaining, 0)}, butuh ${needed}`, 409, null, "SEATS_FULL");
      }
    }

    await db.update(jamaahData)
      .set({ seatConfirmedAt: new Date(), seatConfirmedBy: req.user.userId, updatedAt: new Date() })
      .where(inArray(jamaahData.id, pending.map((m) => m.id)));
    await audit(req, "CONFIRM_SEAT", `Konfirmasi seat ${pending.length} jamaah untuk booking ${jamaah.bookingNumber}`);

    const { url } = await issueDataLink(user.id, req.user.userId);
    const account = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { email: true } });
    const primary = members.find((m) => m.isPrimaryMember) || members[0];
    const pkg = await db.query.packages.findFirst({ where: eq(packages.id, primary.packageId), columns: { name: true } });
    const people = members.filter((m) => m.packageId === primary.packageId && m.registrationStatus !== "REJECTED");
    let emailSent = false;
    if (account?.email && !account.email.endsWith(".invalid")) {
      const banks = await db.query.masterBanks.findMany({ where: eq(masterBanks.isActive, true), columns: { bankName: true, accountNumber: true, accountName: true } });
      const result = await sendSeatConfirmedEmail({
        email: account.email,
        fullName: primary.memberName || user.fullName,
        packageName: pkg?.name || "Paket umroh",
        people: people.length,
        roomType: primary.roomTypeMakkah || "-",
        total: people.reduce((sum, m) => sum + Number(m.hargaFinal || 0), 0),
        accessUrl: url,
        banks,
      }).catch((err) => { logger.error("Seat confirmation email failed", err, { userId: user.id }); return null; });
      emailSent = Boolean(result?.success);
    }
    return successResponse(res, { confirmed: pending.length, emailSent }, emailSent ? "Seat dikonfirmasi dan email akses terkirim" : "Seat dikonfirmasi (email belum terkirim)");
  } catch (error) {
    next(error);
  }
};
