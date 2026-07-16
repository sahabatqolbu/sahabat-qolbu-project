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
  const pageLines = [
    "PT Sahabat Qolbu",
    "Form Internal Manajemen Aset",
    "",
    title,
    "",
    ...lines,
    "",
    "Pernyataan:",
    "Pemegang aset bertanggung jawab menjaga aset dan menggunakannya untuk kebutuhan kerja.",
    "Tanda tangan dilakukan manual pada dokumen cetak ini.",
    "",
    "Atasan/Penanggung Jawab                         Pemegang Aset",
    "",
    "",
    "(____________________)                         (____________________)",
  ];

  const textCommands = pageLines
    .slice(0, 42)
    .map((line, index) => `BT /F1 10 Tf 50 ${790 - index * 17} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${Buffer.byteLength(textCommands, "utf8")} >> stream\n${textCommands}\nendstream endobj\n`,
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
