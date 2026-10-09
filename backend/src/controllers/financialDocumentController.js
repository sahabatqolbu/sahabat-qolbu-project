import { randomBytes } from "node:crypto";
import sharp from "sharp";
import multer from "multer";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { auditLogs, financialDocuments, financialDocumentSettings } from "../db/schema.js";
import { errorResponse, notFoundResponse, successResponse } from "../utils/response.js";
import { getFinancialBank, listFinancialBanks, resolveFinancialSource } from "../utils/financialDocumentData.js";
import { renderFinancialDocument } from "../utils/financialDocumentPdf.js";

const money = z.coerce.number().finite().min(0).max(1_000_000_000_000);
const requestSchema = z.object({
  type: z.enum(["INVOICE", "RECEIPT"]),
  sourceType: z.enum(["MANUAL", "BOOKING", "PAYMENT", "TRANSACTION", "AGENT", "AGENT_PAYMENT"]),
  sourceId: z.string().trim().max(64).optional(),
  bankId: z.coerce.number().int().positive().optional().nullable(),
  customerName: z.string().trim().min(2).max(255).optional(),
  customerPhone: z.string().trim().max(40).optional(),
  memberCount: z.coerce.number().int().min(1).max(999).optional(),
  programName: z.string().trim().max(255).optional(),
  departureDate: z.string().optional(),
  roomType: z.string().trim().max(100).optional(),
  items: z.array(z.object({
    description: z.string().trim().min(2).max(500),
    qty: z.coerce.number().int().min(1).max(999),
    unitPrice: money.positive(),
  })).min(1).max(40).optional(),
  previousPaid: money.optional(),
  currentPayment: money.optional(),
  paymentMethod: z.string().trim().max(100).optional(),
  paidBy: z.string().trim().max(255).optional(),
  targetStar: z.coerce.number().int().min(1).max(2).optional(),
  confirmedReceived: z.boolean().optional(),
});

const words = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
const spell = (number) => {
  if (number < 10) return words[number];
  if (number === 10) return "sepuluh";
  if (number === 11) return "sebelas";
  if (number < 20) return `${words[number - 10]} belas`;
  if (number < 100) return `${words[Math.floor(number / 10)]} puluh ${spell(number % 10)}`.trim();
  if (number < 200) return `seratus ${spell(number - 100)}`.trim();
  if (number < 1000) return `${words[Math.floor(number / 100)]} ratus ${spell(number % 100)}`.trim();
  if (number < 2000) return `seribu ${spell(number - 1000)}`.trim();
  for (const [unit, label] of [[1_000_000_000, "miliar"], [1_000_000, "juta"], [1000, "ribu"]]) {
    if (number >= unit) return `${spell(Math.floor(number / unit))} ${label} ${spell(number % unit)}`.trim();
  }
  return "";
};
const amountWords = (value) => `${spell(Math.floor(Number(value || 0))).replace(/\s+/g, " ").trim()} rupiah`;

const createSnapshot = async (payload, actor, number, issuedAt) => {
  if (payload.sourceType !== "MANUAL" && !payload.sourceId) throw Object.assign(new Error("ID sumber wajib diisi"), { status: 400 });
  if (payload.sourceType === "MANUAL" && (!payload.customerName || !payload.items?.length)) {
    throw Object.assign(new Error("Nama pelanggan dan rincian tagihan wajib diisi"), { status: 400 });
  }
  if (payload.type === "RECEIPT" && payload.sourceType === "MANUAL" && !payload.currentPayment) {
    throw Object.assign(new Error("Nominal pembayaran wajib diisi"), { status: 400 });
  }
  const source = await resolveFinancialSource({
    type: payload.type, sourceType: payload.sourceType, sourceId: payload.sourceId,
    input: { ...payload, actorName: actor.fullName },
  });
  const settings = await db.query.financialDocumentSettings.findFirst({ where: eq(financialDocumentSettings.id, 1) });
  const bank = await getFinancialBank(payload.bankId ?? source.bankId);
  if (payload.type === "INVOICE" && !bank) throw Object.assign(new Error("Pilih rekening resmi untuk invoice"), { status: 400 });
  const remaining = Math.max(0, Math.round((source.totalAmount - source.previousPaid - source.currentPayment) * 100) / 100);
  return {
    ...source, bank, number, type: payload.type, issuedAt, remaining,
    amountWords: amountWords(source.currentPayment),
    createdByName: actor.fullName,
    signerName: settings?.signerName || actor.fullName,
    signaturePng: settings?.signaturePng || null,
    stampPng: settings?.stampPng || null,
  };
};

const handle = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (error) {
    if (error.status) return errorResponse(res, error.message, error.status);
    next(error);
  }
};

export const getFinancialSettings = handle(async (_req, res) => {
  const settings = await db.query.financialDocumentSettings.findFirst({ where: eq(financialDocumentSettings.id, 1) });
  return successResponse(res, {
    signerName: settings?.signerName || "",
    hasSignature: Boolean(settings?.signaturePng),
    hasStamp: Boolean(settings?.stampPng),
  });
});

export const uploadFinancialMark = [
  multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
    cb(["image/png", "image/jpeg", "image/webp"].includes(file.mimetype) ? null : new Error("Gunakan gambar PNG, JPG, atau WebP"), true);
  } }).single("file"),
  handle(async (req, res) => {
    if (!req.file || !["signature", "stamp"].includes(req.params.kind)) return errorResponse(res, "Jenis gambar tidak valid", 400);
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width > 5000 || metadata.height > 5000) return errorResponse(res, "Ukuran gambar tidak valid", 400);
    const png = await image.resize({ width: 420, height: 180, fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
    const update = req.params.kind === "signature" ? { signaturePng: png.toString("base64") } : { stampPng: png.toString("base64") };
    await db.insert(financialDocumentSettings).values({ id: 1, ...update, updatedBy: req.user.userId, updatedAt: new Date() })
      .onDuplicateKeyUpdate({ set: { ...update, updatedBy: req.user.userId, updatedAt: new Date() } });
    return successResponse(res, null, "Gambar pengesahan tersimpan");
  }),
];

export const updateFinancialSigner = handle(async (req, res) => {
  const name = z.string().trim().min(2).max(255).safeParse(req.body?.signerName);
  if (!name.success) return errorResponse(res, "Nama penandatangan tidak valid", 400);
  await db.insert(financialDocumentSettings).values({ id: 1, signerName: name.data, updatedBy: req.user.userId, updatedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { signerName: name.data, updatedBy: req.user.userId, updatedAt: new Date() } });
  return successResponse(res, null, "Nama penandatangan tersimpan");
});

export const getFinancialBanks = handle(async (_req, res) => successResponse(res, await listFinancialBanks()));

export const prepareFinancialDocument = handle(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, "Periksa data dokumen", 400, z.treeifyError(parsed.error));
  const snapshot = await createSnapshot(parsed.data, req.user, "PRATINJAU", new Date().toISOString());
  const { signaturePng, stampPng, ...preview } = snapshot;
  return successResponse(res, { ...preview, hasSignature: Boolean(signaturePng), hasStamp: Boolean(stampPng) });
});

export const previewFinancialPdf = handle(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, "Periksa data dokumen", 400, z.treeifyError(parsed.error));
  const snapshot = await createSnapshot(parsed.data, req.user, "PRATINJAU", new Date().toISOString());
  const pdf = await renderFinancialDocument(snapshot);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "no-store");
  return res.send(pdf);
});

export const issueFinancialDocument = handle(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return errorResponse(res, "Periksa data dokumen", 400, z.treeifyError(parsed.error));
  const issuedAt = new Date();
  const kind = parsed.data.type === "INVOICE" ? "INV" : "KWT";
  const number = `${kind}/SQ/${issuedAt.getFullYear()}${String(issuedAt.getMonth() + 1).padStart(2, "0")}/${randomBytes(4).toString("hex").toUpperCase()}`;
  const snapshot = await createSnapshot(parsed.data, req.user, number, issuedAt.toISOString());
  const activeSourceKey = snapshot.sourceId ? `${parsed.data.type}:${snapshot.sourceType}:${snapshot.sourceId}` : null;
  await renderFinancialDocument(snapshot);
  try {
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx.insert(financialDocuments).values({
        type: snapshot.type, number, status: "ISSUED", sourceType: snapshot.sourceType,
        sourceId: snapshot.sourceId, activeSourceKey, customerName: snapshot.customerName,
        totalAmount: String(snapshot.totalAmount), snapshot, issuedBy: req.user.userId, issuedAt,
      }).$returningId();
      await tx.insert(auditLogs).values({ userId: req.user.userId, action: "ISSUE_FINANCIAL_DOCUMENT", module: "FINANCE", description: number, ipAddress: req.ip, userAgent: req.get("user-agent") || null });
      return row;
    });
    return successResponse(res, { id: inserted.id, number }, "Dokumen berhasil diterbitkan", 201);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return errorResponse(res, "Dokumen aktif untuk sumber ini sudah ada", 409);
    throw error;
  }
});

export const listFinancialDocuments = handle(async (req, res) => {
  const type = ["INVOICE", "RECEIPT"].includes(req.query.type) ? req.query.type : null;
  const search = String(req.query.search || "").trim().slice(0, 100);
  const rows = await db.query.financialDocuments.findMany({
    where: and(type ? eq(financialDocuments.type, type) : undefined, search ? like(financialDocuments.number, `%${search}%`) : undefined),
    columns: { snapshot: false }, orderBy: [desc(financialDocuments.issuedAt)], limit: 100,
  });
  return successResponse(res, rows);
});

export const downloadFinancialDocument = handle(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return errorResponse(res, "ID dokumen tidak valid", 400);
  const document = await db.query.financialDocuments.findFirst({ where: eq(financialDocuments.id, id) });
  if (!document) return notFoundResponse(res, "Dokumen tidak ditemukan");
  const pdf = await renderFinancialDocument(document.snapshot, { voided: document.status === "VOID" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${document.number.replaceAll("/", "-")}.pdf"`);
  res.setHeader("Cache-Control", "no-store");
  return res.send(pdf);
});

export const voidFinancialDocument = handle(async (req, res) => {
  const id = Number(req.params.id);
  const reason = z.string().trim().min(5).max(1000).safeParse(req.body?.reason);
  if (!Number.isInteger(id) || id < 1 || !reason.success) return errorResponse(res, "ID atau alasan pembatalan tidak valid", 400);
  const document = await db.query.financialDocuments.findFirst({ where: eq(financialDocuments.id, id) });
  if (!document) return notFoundResponse(res, "Dokumen tidak ditemukan");
  if (document.status !== "ISSUED") return errorResponse(res, "Dokumen sudah dibatalkan", 409);
  await db.transaction(async (tx) => {
    const [result] = await tx.update(financialDocuments).set({ status: "VOID", activeSourceKey: null, voidBy: req.user.userId, voidAt: new Date(), voidReason: reason.data })
      .where(and(eq(financialDocuments.id, id), eq(financialDocuments.status, "ISSUED")));
    if (result.affectedRows !== 1) throw Object.assign(new Error("Dokumen sudah dibatalkan"), { status: 409 });
    await tx.insert(auditLogs).values({ userId: req.user.userId, action: "VOID_FINANCIAL_DOCUMENT", module: "FINANCE", description: `${document.number}: ${reason.data}`, ipAddress: req.ip, userAgent: req.get("user-agent") || null });
  });
  return successResponse(res, null, "Dokumen dibatalkan");
});
