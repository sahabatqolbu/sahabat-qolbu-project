import path from "path";
import { promises as fs } from "fs";
import { db } from "../db/index.js";
import { assets, assetAssignments, assetDocuments, users } from "../db/schema.js";
import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
  createdResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { UPLOAD_BASE } from "../utils/upload.js";

const ASSET_TYPES = ["DEVICE", "ACCOUNT"];
const ASSET_STATUSES = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST"];
const ASSIGNMENT_STATUSES = ["ACTIVE", "RETURNED"];
const INTERNAL_HOLDER_ROLES = ["ADMIN", "STAFF", "FINANCE"];
const BLOCKED_SECRET_KEYS = [
  "password",
  "pass",
  "apiKey",
  "apikey",
  "api_key",
  "token",
  "secret",
  "clientSecret",
  "client_secret",
];

const hasSecretField = (body = {}) => {
  const keys = Object.keys(body).map((key) => key.toLowerCase());
  return BLOCKED_SECRET_KEYS.some((blocked) => keys.includes(blocked.toLowerCase()));
};

const asInt = (value) => Number.parseInt(value, 10);

const normalizeString = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

const escapePdfText = (value) =>
  String(value ?? "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const makeSimplePdfBuffer = (title, lines) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const commands = [];

  const add = (command) => commands.push(command);
  const rgb = (r, g, b) => `${r} ${g} ${b}`;
  const text = (value, x, y, size = 10, font = "F1", color = "0.10 0.12 0.16") => {
    add(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  };
  const rect = (x, y, w, h, stroke = "0.85 0.88 0.92", fill = null) => {
    if (fill) add(`${fill} rg ${x} ${y} ${w} ${h} re f`);
    add(`${stroke} RG ${x} ${y} ${w} ${h} re S`);
  };
  const line = (x1, y1, x2, y2, color = "0.85 0.88 0.92") => {
    add(`${color} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const primary = rgb("0.03", "0.22", "0.18");
  const gold = rgb("0.73", "0.55", "0.20");
  const muted = rgb("0.36", "0.42", "0.50");

  rect(32, 30, pageWidth - 64, pageHeight - 60, "0.82 0.86 0.90");
  add(`${primary} rg 32 782 531 30 re f`);
  add(`${gold} rg 32 778 531 4 re f`);

  add(`${primary} rg 50 710 58 58 re f`);
  add(`${gold} rg 50 710 58 9 re f`);
  text("SQ", 64, 731, 20, "F2", "1 1 1");
  text("PT. SAHABAT QOLBU CAHAYA BAITULLAH", 122, 752, 16, "F2", primary);
  text("Manajemen Aset Internal", 122, 735, 10, "F2", gold);
  text("Ruko Jl. Ebony, Metland Transyogi No.11, Cileungsi, Bogor 16820", 122, 720, 9, "F1", muted);
  text("Website: sahabatqolbu.com | Email: admin@sahabatqolbu.com | Hotline: 0812 4000 0101", 122, 707, 8.5, "F1", muted);
  line(50, 696, 545, 696, gold);

  rect(50, 648, 495, 34, "0.88 0.82 0.64", "0.98 0.96 0.89");
  text(title, 62, 668, 13, "F2", primary);
  text("Dokumen ini menjadi dasar administrasi sebelum dokumen bertanda tangan diupload sebagai bukti final.", 62, 654, 8.5, "F1", muted);

  let y = 620;
  text("Detail Dokumen", 50, y, 11, "F2", primary);
  y -= 14;

  lines.slice(0, 18).forEach((entry, index) => {
    const parts = String(entry).split(":");
    const label = parts.shift()?.trim() || "Informasi";
    const value = parts.join(":").trim() || "-";
    const fill = index % 2 === 0 ? "0.98 0.99 1" : "1 1 1";
    rect(50, y - 14, 495, 22, "0.90 0.92 0.95", fill);
    text(label, 62, y - 6, 8.5, "F2", muted);
    text(value.slice(0, 82), 190, y - 6, 8.5, "F1", "0.10 0.12 0.16");
    y -= 22;
  });

  y -= 8;
  rect(50, y - 76, 495, 70, "0.88 0.82 0.64", "0.99 0.97 0.91");
  text("Pernyataan Tanggung Jawab", 62, y - 24, 10, "F2", primary);
  text("Pemegang aset menyatakan telah menerima aset dalam kondisi yang tercatat dan bertanggung jawab", 62, y - 41, 8.5, "F1", "0.18 0.23 0.30");
  text("untuk menjaga, menggunakan, serta mengembalikan aset sesuai kebutuhan operasional perusahaan.", 62, y - 55, 8.5, "F1", "0.18 0.23 0.30");
  y -= 104;

  text("Tanda Tangan", 50, y, 11, "F2", primary);
  y -= 126;
  rect(60, y, 190, 96, "0.78 0.82 0.88");
  rect(345, y, 190, 96, "0.78 0.82 0.88");
  text("Atasan / Penanggung Jawab", 86, y + 75, 9, "F2", primary);
  text("Pemegang Aset", 397, y + 75, 9, "F2", primary);
  line(88, y + 25, 222, y + 25, "0.35 0.40 0.48");
  line(373, y + 25, 507, y + 25, "0.35 0.40 0.48");
  text("Nama & Tanda Tangan", 103, y + 11, 8, "F1", muted);
  text("Nama & Tanda Tangan", 388, y + 11, 8, "F1", muted);

  text("Catatan: setelah dokumen ini ditandatangani, upload scan/foto dokumen signed pada dashboard aset.", 50, 54, 8, "F1", muted);

  const content = commands.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n",
    `6 0 obj << /Length ${Buffer.byteLength(content, "utf8")} >> stream\n${content}\nendstream endobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
};

const generateAssetCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `SQ-AST-${year}-`;
  const rows = await db
    .select({ assetCode: assets.assetCode })
    .from(assets)
    .where(like(assets.assetCode, `${prefix}%`))
    .orderBy(desc(assets.assetCode))
    .limit(1);

  const lastNumber = rows[0]?.assetCode?.slice(prefix.length);
  const nextNumber = Number.parseInt(lastNumber || "0", 10) + 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

const generateDocumentNumber = async (type) => {
  const year = new Date().getFullYear();
  const typeCode = type === "RETURN" ? "KMB" : "ST";
  const prefix = `SQ/${typeCode}/AST/${year}/`;
  const rows = await db
    .select({ documentNumber: assetDocuments.documentNumber })
    .from(assetDocuments)
    .where(like(assetDocuments.documentNumber, `${prefix}%`))
    .orderBy(desc(assetDocuments.documentNumber))
    .limit(1);

  const lastNumber = rows[0]?.documentNumber?.slice(prefix.length);
  const nextNumber = Number.parseInt(lastNumber || "0", 10) + 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

const validateAssetBody = (body, isUpdate = false) => {
  if (hasSecretField(body)) {
    return "Data akun digital tidak boleh berisi password, API key, token, atau secret.";
  }

  if (!isUpdate && !normalizeString(body.name)) return "Nama aset wajib diisi";
  if (!isUpdate && !ASSET_TYPES.includes(body.type)) return "Tipe aset tidak valid";
  if (!isUpdate && !normalizeString(body.category)) return "Kategori aset wajib diisi";
  if (body.type !== undefined && !ASSET_TYPES.includes(body.type)) return "Tipe aset tidak valid";
  if (body.status !== undefined && !ASSET_STATUSES.includes(body.status)) {
    return "Status aset tidak valid";
  }
  return null;
};

const pickAssetValues = async (body, existing = null, userId = null) => {
  const type = body.type ?? existing?.type;
  const values = {};

  const fields = [
    "name",
    "type",
    "category",
    "status",
    "brand",
    "model",
    "serialNumber",
    "identifier",
    "location",
    "condition",
    "notes",
    "platform",
    "accountUsername",
    "recoveryContact",
    "accountPic",
    "accountNotes",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      values[field] = typeof body[field] === "string" ? normalizeString(body[field]) : body[field];
    }
  }

  if (!existing) {
    values.assetCode = normalizeString(body.assetCode) || (await generateAssetCode());
    values.status = values.status || "AVAILABLE";
    values.createdBy = userId;
  } else if (body.assetCode !== undefined) {
    values.assetCode = normalizeString(body.assetCode) || existing.assetCode;
  }

  if (type === "DEVICE") {
    values.platform = null;
    values.accountUsername = null;
    values.recoveryContact = null;
    values.accountPic = null;
    values.accountNotes = null;
  }

  return values;
};

const getActiveAssignmentsForAssets = async (assetIds) => {
  if (assetIds.length === 0) return new Map();

  const rows = await db
    .select({
      assignment: assetAssignments,
      holderId: users.id,
      holderName: users.fullName,
      holderEmail: users.email,
      holderRole: users.role,
    })
    .from(assetAssignments)
    .innerJoin(users, eq(assetAssignments.holderUserId, users.id))
    .where(and(inArray(assetAssignments.assetId, assetIds), eq(assetAssignments.status, "ACTIVE")));

  return new Map(
    rows.map((row) => [
      row.assignment.assetId,
      {
        ...row.assignment,
        holder: {
          id: row.holderId,
          fullName: row.holderName,
          email: row.holderEmail,
          role: row.holderRole,
        },
      },
    ]),
  );
};

const getDocumentsForAsset = async (assetId) =>
  db
    .select({
      id: assetDocuments.id,
      assetId: assetDocuments.assetId,
      assignmentId: assetDocuments.assignmentId,
      type: assetDocuments.type,
      documentNumber: assetDocuments.documentNumber,
      fileName: assetDocuments.fileName,
      mimeType: assetDocuments.mimeType,
      signedFileUrl: assetDocuments.signedFileUrl,
      signedFileName: assetDocuments.signedFileName,
      signedMimeType: assetDocuments.signedMimeType,
      signedUploadedAt: assetDocuments.signedUploadedAt,
      createdAt: assetDocuments.createdAt,
    })
    .from(assetDocuments)
    .where(eq(assetDocuments.assetId, assetId))
    .orderBy(desc(assetDocuments.createdAt));

export const getAssets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      type = "",
      status = "",
    } = req.query;
    const parsedPage = Math.max(1, asInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, asInt(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(assets.name, `%${search}%`),
          like(assets.assetCode, `%${search}%`),
          like(assets.category, `%${search}%`),
          like(assets.identifier, `%${search}%`),
          like(assets.accountUsername, `%${search}%`),
        ),
      );
    }
    if (type && ASSET_TYPES.includes(type)) conditions.push(eq(assets.type, type));
    if (status && ASSET_STATUSES.includes(status)) conditions.push(eq(assets.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(assets).where(where);
    const assetRows = await db
      .select()
      .from(assets)
      .where(where)
      .orderBy(desc(assets.createdAt))
      .limit(parsedLimit)
      .offset(offset);

    const activeAssignments = await getActiveAssignmentsForAssets(assetRows.map((asset) => asset.id));
    const data = assetRows.map((asset) => ({
      ...asset,
      activeAssignment: activeAssignments.get(asset.id) || null,
    }));

    return paginatedResponse(res, data, {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    logger.error("Get assets error", error);
    next(error);
  }
};


export const getAssetAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const parsedPage = Math.max(1, asInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, asInt(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;
    const conditions = [];

    if (status && ASSIGNMENT_STATUSES.includes(status)) {
      conditions.push(eq(assetAssignments.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(assetAssignments).where(where);
    const rows = await db
      .select({
        assignment: assetAssignments,
        assetId: assets.id,
        assetCode: assets.assetCode,
        assetName: assets.name,
        assetType: assets.type,
        assetCategory: assets.category,
        holderId: users.id,
        holderName: users.fullName,
        holderEmail: users.email,
        holderRole: users.role,
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .innerJoin(users, eq(assetAssignments.holderUserId, users.id))
      .where(where)
      .orderBy(desc(assetAssignments.createdAt))
      .limit(parsedLimit)
      .offset(offset);

    return paginatedResponse(
      res,
      rows.map((row) => ({
        ...row.assignment,
        asset: {
          id: row.assetId,
          assetCode: row.assetCode,
          name: row.assetName,
          type: row.assetType,
          category: row.assetCategory,
        },
        holder: {
          id: row.holderId,
          fullName: row.holderName,
          email: row.holderEmail,
          role: row.holderRole,
        },
      })),
      {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    );
  } catch (error) {
    logger.error("Get asset assignments error", error);
    next(error);
  }
};

export const getAssetDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = "" } = req.query;
    const parsedPage = Math.max(1, asInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, asInt(limit) || 20));
    const offset = (parsedPage - 1) * parsedLimit;
    const documentTypes = ["HANDOVER", "RETURN"];
    const conditions = [];

    if (type && documentTypes.includes(type)) {
      conditions.push(eq(assetDocuments.type, type));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: count() }).from(assetDocuments).where(where);
    const rows = await db
      .select({
        document: assetDocuments,
        assetId: assets.id,
        assetCode: assets.assetCode,
        assetName: assets.name,
        assetType: assets.type,
        holderId: users.id,
        holderName: users.fullName,
        holderRole: users.role,
      })
      .from(assetDocuments)
      .innerJoin(assets, eq(assetDocuments.assetId, assets.id))
      .innerJoin(assetAssignments, eq(assetDocuments.assignmentId, assetAssignments.id))
      .innerJoin(users, eq(assetAssignments.holderUserId, users.id))
      .where(where)
      .orderBy(desc(assetDocuments.createdAt))
      .limit(parsedLimit)
      .offset(offset);

    return paginatedResponse(
      res,
      rows.map((row) => ({
        ...row.document,
        asset: {
          id: row.assetId,
          assetCode: row.assetCode,
          name: row.assetName,
          type: row.assetType,
        },
        holder: {
          id: row.holderId,
          fullName: row.holderName,
          role: row.holderRole,
        },
      })),
      {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    );
  } catch (error) {
    logger.error("Get asset documents error", error);
    next(error);
  }
};
export const getAssetById = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    if (!asset) return notFoundResponse(res, "Aset tidak ditemukan");

    const activeAssignments = await getActiveAssignmentsForAssets([asset.id]);
    const assignments = await db
      .select({
        assignment: assetAssignments,
        holderId: users.id,
        holderName: users.fullName,
        holderEmail: users.email,
        holderRole: users.role,
      })
      .from(assetAssignments)
      .innerJoin(users, eq(assetAssignments.holderUserId, users.id))
      .where(eq(assetAssignments.assetId, asset.id))
      .orderBy(desc(assetAssignments.createdAt));

    return successResponse(res, {
      ...asset,
      activeAssignment: activeAssignments.get(asset.id) || null,
      assignments: assignments.map((row) => ({
        ...row.assignment,
        holder: {
          id: row.holderId,
          fullName: row.holderName,
          email: row.holderEmail,
          role: row.holderRole,
        },
      })),
      documents: await getDocumentsForAsset(asset.id),
    });
  } catch (error) {
    logger.error("Get asset by ID error", error);
    next(error);
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const validationError = validateAssetBody(req.body);
    if (validationError) return errorResponse(res, validationError, 400);

    const values = await pickAssetValues(req.body, null, req.user.userId);
    const existingCode = await db.query.assets.findFirst({
      where: eq(assets.assetCode, values.assetCode),
    });
    if (existingCode) return errorResponse(res, "Kode aset sudah digunakan", 409);

    const [created] = await db.insert(assets).values(values).$returningId();
    const asset = await db.query.assets.findFirst({ where: eq(assets.id, created.id) });

    return createdResponse(res, asset, "Aset berhasil dibuat");
  } catch (error) {
    logger.error("Create asset error", error);
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const existing = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    if (!existing) return notFoundResponse(res, "Aset tidak ditemukan");

    const validationError = validateAssetBody(req.body, true);
    if (validationError) return errorResponse(res, validationError, 400);
    if (existing.status === "ASSIGNED" && req.body.status && req.body.status !== "ASSIGNED") {
      return errorResponse(res, "Status aset assigned hanya bisa diubah lewat proses pengembalian", 400);
    }

    const values = await pickAssetValues(req.body, existing);
    if (values.assetCode && values.assetCode !== existing.assetCode) {
      const conflict = await db.query.assets.findFirst({
        where: eq(assets.assetCode, values.assetCode),
      });
      if (conflict) return errorResponse(res, "Kode aset sudah digunakan", 409);
    }

    await db.update(assets).set(values).where(eq(assets.id, assetId));
    const updated = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    return successResponse(res, updated, "Aset berhasil diperbarui");
  } catch (error) {
    logger.error("Update asset error", error);
    next(error);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const existing = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    if (!existing) return notFoundResponse(res, "Aset tidak ditemukan");

    const active = await db.query.assetAssignments.findFirst({
      where: and(eq(assetAssignments.assetId, assetId), eq(assetAssignments.status, "ACTIVE")),
    });
    if (existing.status === "ASSIGNED" || active) {
      return errorResponse(res, "Aset yang sedang dipinjam tidak bisa dihapus", 400);
    }

    await db.delete(assets).where(eq(assets.id, assetId));
    return successResponse(res, null, "Aset berhasil dihapus");
  } catch (error) {
    logger.error("Delete asset error", error);
    next(error);
  }
};

const createDocument = async ({ asset, assignment, holder, type, actorUserId }) => {
  const documentNumber = await generateDocumentNumber(type);
  const title = type === "RETURN" ? "SURAT PENGEMBALIAN ASET" : "SURAT SERAH TERIMA ASET";
  const lines =
    type === "RETURN"
      ? [
          `Nomor: ${documentNumber}`,
          `Kode aset: ${asset.assetCode}`,
          `Nama aset: ${asset.name}`,
          `Tipe/Kategori: ${asset.type} / ${asset.category}`,
          `Pemegang: ${holder.fullName} (${holder.role})`,
          `Email pemegang: ${holder.email}`,
          `Tanggal kembali: ${assignment.returnedAt}`,
          `Kondisi kembali: ${assignment.returnCondition}`,
          `Catatan kembali: ${assignment.returnNotes || "-"}`,
        ]
      : [
          `Nomor: ${documentNumber}`,
          `Kode aset: ${asset.assetCode}`,
          `Nama aset: ${asset.name}`,
          `Tipe/Kategori: ${asset.type} / ${asset.category}`,
          `Brand/Model: ${asset.brand || "-"} / ${asset.model || "-"}`,
          `Serial/Identifier: ${asset.serialNumber || asset.identifier || "-"}`,
          `Pemegang: ${holder.fullName} (${holder.role})`,
          `Email pemegang: ${holder.email}`,
          `Tanggal serah terima: ${assignment.assignedAt}`,
          `Kondisi awal: ${assignment.initialCondition}`,
          `Tujuan pemakaian: ${assignment.purpose}`,
          `Estimasi kembali: ${assignment.expectedReturnAt || "-"}`,
          `Catatan: ${assignment.notes || "-"}`,
        ];

  const pdf = makeSimplePdfBuffer(title, lines);
  const fileName = `${documentNumber.replaceAll("/", "-")}.pdf`;
  const [created] = await db
    .insert(assetDocuments)
    .values({
      assetId: asset.id,
      assignmentId: assignment.id,
      type,
      documentNumber,
      fileName,
      mimeType: "application/pdf",
      content: pdf.toString("base64"),
      createdBy: actorUserId,
    })
    .$returningId();

  return db.query.assetDocuments.findFirst({ where: eq(assetDocuments.id, created.id) });
};

export const assignAsset = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const {
      holderUserId,
      assignedAt,
      initialCondition,
      purpose,
      notes,
      expectedReturnAt,
    } = req.body;

    if (!holderUserId || !assignedAt || !normalizeString(initialCondition) || !normalizeString(purpose)) {
      return errorResponse(res, "Pemegang, tanggal, kondisi awal, dan tujuan wajib diisi", 400);
    }

    const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    if (!asset) return notFoundResponse(res, "Aset tidak ditemukan");
    if (asset.status !== "AVAILABLE") {
      return errorResponse(res, "Hanya aset AVAILABLE yang bisa diserahterimakan", 400);
    }

    const holder = await db.query.users.findFirst({
      where: and(eq(users.id, asInt(holderUserId)), inArray(users.role, INTERNAL_HOLDER_ROLES), eq(users.isActive, true)),
      columns: { id: true, fullName: true, email: true, role: true },
    });
    if (!holder) return errorResponse(res, "Pemegang aset harus user internal aktif", 400);

    const active = await db.query.assetAssignments.findFirst({
      where: and(eq(assetAssignments.assetId, assetId), eq(assetAssignments.status, "ACTIVE")),
    });
    if (active) return errorResponse(res, "Aset sudah memiliki assignment aktif", 400);

    const [created] = await db
      .insert(assetAssignments)
      .values({
        assetId,
        holderUserId: holder.id,
        status: "ACTIVE",
        assignedAt,
        initialCondition: normalizeString(initialCondition),
        purpose: normalizeString(purpose),
        notes: normalizeString(notes),
        expectedReturnAt: normalizeString(expectedReturnAt),
        createdBy: req.user.userId,
      })
      .$returningId();

    await db.update(assets).set({ status: "ASSIGNED" }).where(eq(assets.id, assetId));
    const assignment = await db.query.assetAssignments.findFirst({
      where: eq(assetAssignments.id, created.id),
    });
    const updatedAsset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    const document = await createDocument({
      asset: updatedAsset,
      assignment,
      holder,
      type: "HANDOVER",
      actorUserId: req.user.userId,
    });

    return createdResponse(
      res,
      { asset: updatedAsset, assignment: { ...assignment, holder }, document },
      "Serah terima aset berhasil dibuat",
    );
  } catch (error) {
    logger.error("Assign asset error", error);
    next(error);
  }
};

export const returnAsset = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const { returnedAt, returnCondition, returnNotes, nextStatus = "AVAILABLE" } = req.body;

    if (!returnedAt || !normalizeString(returnCondition)) {
      return errorResponse(res, "Tanggal kembali dan kondisi kembali wajib diisi", 400);
    }
    if (!ASSET_STATUSES.includes(nextStatus) || nextStatus === "ASSIGNED") {
      return errorResponse(res, "Status aset setelah pengembalian tidak valid", 400);
    }

    const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    if (!asset) return notFoundResponse(res, "Aset tidak ditemukan");

    const assignment = await db.query.assetAssignments.findFirst({
      where: and(eq(assetAssignments.assetId, assetId), eq(assetAssignments.status, "ACTIVE")),
    });
    if (!assignment) return errorResponse(res, "Assignment aktif tidak ditemukan", 400);

    await db
      .update(assetAssignments)
      .set({
        status: "RETURNED",
        returnedAt,
        returnCondition: normalizeString(returnCondition),
        returnNotes: normalizeString(returnNotes),
        returnedBy: req.user.userId,
      })
      .where(eq(assetAssignments.id, assignment.id));

    await db.update(assets).set({ status: nextStatus }).where(eq(assets.id, assetId));

    const updatedAssignment = await db.query.assetAssignments.findFirst({
      where: eq(assetAssignments.id, assignment.id),
    });
    const updatedAsset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
    const holder = await db.query.users.findFirst({
      where: eq(users.id, assignment.holderUserId),
      columns: { id: true, fullName: true, email: true, role: true },
    });
    const document = await createDocument({
      asset: updatedAsset,
      assignment: updatedAssignment,
      holder,
      type: "RETURN",
      actorUserId: req.user.userId,
    });

    return successResponse(
      res,
      { asset: updatedAsset, assignment: { ...updatedAssignment, holder }, document },
      "Pengembalian aset berhasil diproses",
    );
  } catch (error) {
    logger.error("Return asset error", error);
    next(error);
  }
};

export const getAssetHolders = async (req, res, next) => {
  try {
    const holderRows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(and(inArray(users.role, INTERNAL_HOLDER_ROLES), eq(users.isActive, true)))
      .orderBy(asc(users.fullName));

    return successResponse(res, holderRows);
  } catch (error) {
    logger.error("Get asset holders error", error);
    next(error);
  }
};


export const uploadAssetSignedDocument = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const documentId = asInt(req.params.documentId);
    const document = await db.query.assetDocuments.findFirst({
      where: and(eq(assetDocuments.id, documentId), eq(assetDocuments.assetId, assetId)),
    });
    if (!document) return notFoundResponse(res, "Dokumen aset tidak ditemukan");
    if (!req.uploadedFile?.path) return errorResponse(res, "File bukti tanda tangan wajib diupload", 400);

    await db
      .update(assetDocuments)
      .set({
        signedFileUrl: req.uploadedFile.path,
        signedFileName: req.uploadedFile.originalName || req.uploadedFile.filename,
        signedMimeType: req.uploadedFile.mimeType,
        signedUploadedBy: req.user.userId,
        signedUploadedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(assetDocuments.id, documentId), eq(assetDocuments.assetId, assetId)));

    const updated = await db.query.assetDocuments.findFirst({
      where: and(eq(assetDocuments.id, documentId), eq(assetDocuments.assetId, assetId)),
    });
    return successResponse(res, updated, "Dokumen bertanda tangan berhasil diupload");
  } catch (error) {
    logger.error("Upload asset signed document error", error);
    next(error);
  }
};

export const downloadAssetSignedDocument = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const documentId = asInt(req.params.documentId);
    const document = await db.query.assetDocuments.findFirst({
      where: and(eq(assetDocuments.id, documentId), eq(assetDocuments.assetId, assetId)),
    });
    if (!document?.signedFileUrl) return notFoundResponse(res, "Bukti dokumen bertanda tangan belum diupload");

    const relativePath = document.signedFileUrl.replace(/^\/uploads\//, "");
    const fullPath = path.resolve(UPLOAD_BASE, relativePath);
    const uploadRoot = path.resolve(UPLOAD_BASE);
    if (!fullPath.startsWith(uploadRoot)) return errorResponse(res, "Path dokumen tidak valid", 400);

    const file = await fs.readFile(fullPath);
    res.setHeader("Content-Type", document.signedMimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${document.signedFileName || path.basename(fullPath)}"`);
    return res.status(200).send(file);
  } catch (error) {
    logger.error("Download asset signed document error", error);
    next(error);
  }
};

export const downloadAssetDocument = async (req, res, next) => {
  try {
    const assetId = asInt(req.params.id);
    const documentId = asInt(req.params.documentId);
    const document = await db.query.assetDocuments.findFirst({
      where: and(eq(assetDocuments.id, documentId), eq(assetDocuments.assetId, assetId)),
    });
    if (!document) return notFoundResponse(res, "Dokumen aset tidak ditemukan");

    const pdf = Buffer.from(document.content, "base64");
    res.setHeader("Content-Type", document.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
    return res.status(200).send(pdf);
  } catch (error) {
    logger.error("Download asset document error", error);
    next(error);
  }
};
