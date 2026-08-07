import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { promotionalPopups } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";

const toBoolean = (value, fallback = false) =>
  value === undefined || value === null || value === ""
    ? fallback
    : value === true || String(value).toLowerCase() === "true";

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toTargetUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) return null;
  if (input.startsWith("/") && !input.startsWith("//")) return input;
  try {
    const url = new URL(input);
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const parsePayload = (body, existing = {}) => {
  const startAt = toDate(body.startAt);
  const endAt = toDate(body.endAt);
  const targetUrl = toTargetUrl(body.targetUrl);
  const delay = Number.parseInt(body.delaySeconds, 10);
  if (startAt === undefined || endAt === undefined)
    return { error: "Jadwal popup tidak valid" };
  if (targetUrl === undefined)
    return { error: "Link tujuan popup tidak valid" };
  if (startAt && endAt && startAt >= endAt)
    return { error: "Waktu selesai harus setelah waktu mulai" };
  return {
    data: {
      title: String(body.title || "").trim() || null,
      altText: String(body.altText || "").trim() || null,
      targetUrl,
      isActive: toBoolean(body.isActive, existing.isActive || false),
      startAt,
      endAt,
      delaySeconds: Number.isFinite(delay)
        ? Math.min(Math.max(delay, 0), 30)
        : (existing.delaySeconds ?? 2),
    },
  };
};

export const getPublicPromotionalPopup = async (req, res, next) => {
  try {
    const rows = await db.query.promotionalPopups.findMany({
      where: eq(promotionalPopups.isActive, true),
      orderBy: [desc(promotionalPopups.updatedAt), desc(promotionalPopups.id)],
    });
    const now = new Date();
    const popup = rows.find(
      (item) =>
        (!item.startAt || new Date(item.startAt) <= now) &&
        (!item.endAt || new Date(item.endAt) >= now),
    );
    return successResponse(res, { popup: popup || null });
  } catch (error) {
    next(error);
  }
};

export const getAllPromotionalPopups = async (req, res, next) => {
  try {
    const rows = await db.query.promotionalPopups.findMany({
      orderBy: [desc(promotionalPopups.updatedAt), desc(promotionalPopups.id)],
    });
    return successResponse(res, rows);
  } catch (error) {
    next(error);
  }
};

export const createPromotionalPopup = async (req, res, next) => {
  try {
    if (!req.uploadedFile?.path)
      return errorResponse(res, "Gambar popup wajib diupload", 400);
    const parsed = parsePayload(req.body);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    if (parsed.data.isActive)
      await db.update(promotionalPopups).set({ isActive: false });
    const [created] = await db
      .insert(promotionalPopups)
      .values({ ...parsed.data, imageUrl: req.uploadedFile.path })
      .$returningId();
    return successResponse(
      res,
      { id: created.id },
      "Popup berhasil dibuat",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updatePromotionalPopup = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await db.query.promotionalPopups.findFirst({
      where: eq(promotionalPopups.id, id),
    });
    if (!existing) return errorResponse(res, "Popup tidak ditemukan", 404);
    const parsed = parsePayload(req.body, existing);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    if (parsed.data.isActive)
      await db.update(promotionalPopups).set({ isActive: false });
    await db
      .update(promotionalPopups)
      .set({
        ...parsed.data,
        imageUrl: req.uploadedFile?.path || existing.imageUrl,
      })
      .where(eq(promotionalPopups.id, id));
    return successResponse(res, null, "Popup berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

export const deletePromotionalPopup = async (req, res, next) => {
  try {
    await db
      .delete(promotionalPopups)
      .where(eq(promotionalPopups.id, Number.parseInt(req.params.id, 10)));
    return successResponse(res, null, "Popup berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
