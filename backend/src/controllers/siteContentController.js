import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { siteContents } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";

// Halaman yang teks dan fotonya bisa diatur dari dashboard.
export const SITE_CONTENT_KEYS = ["home", "about"];

const MAX_BYTES = 120_000;
const MAX_STRING = 4000;
const MAX_ARRAY = 40;
const MAX_DEPTH = 6;

// Field gambar hanya boleh berisi file yang diupload ke server atau https.
const isImageKey = (key) => /(url|photo|image)$/i.test(key);
const safeImage = (value) =>
  value.startsWith("/uploads/") || /^https:\/\/[^\s"'<>]+$/i.test(value)
    ? value
    : "";
const safeLink = (value) =>
  (value.startsWith("/") && !value.startsWith("//")) ||
  /^https:\/\/[^\s"'<>]+$/i.test(value)
    ? value
    : "";

/**
 * Membersihkan konten sebelum disimpan: hanya objek, array, string, angka,
 * dan boolean; string dipotong; URL gambar dan link dibatasi supaya tidak ada
 * javascript: atau data: yang lolos ke website.
 */
export const sanitizeContent = (value, key = "", depth = 0) => {
  if (depth > MAX_DEPTH) return null;
  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, MAX_STRING);
    if (!trimmed) return "";
    if (isImageKey(key)) return safeImage(trimmed);
    if (/(link|href)$/i.test(key)) return safeLink(trimmed);
    return trimmed;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY)
      .map((item) => sanitizeContent(item, key, depth + 1))
      .filter((item) => item !== null);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (!/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(k)) continue;
      const cleaned = sanitizeContent(v, k, depth + 1);
      if (cleaned !== null) out[k] = cleaned;
    }
    return out;
  }
  return null;
};

const readKey = (req, res) => {
  const key = String(req.params.key || "");
  if (!SITE_CONTENT_KEYS.includes(key)) {
    errorResponse(res, "Konten tidak dikenal", 404);
    return null;
  }
  return key;
};

const findContent = async (key) => {
  const row = await db.query.siteContents.findFirst({
    where: eq(siteContents.key, key),
  });
  if (!row) return null;
  const content =
    typeof row.content === "string" ? JSON.parse(row.content) : row.content;
  return { content, updatedAt: row.updatedAt };
};

export const getPublicSiteContent = async (req, res, next) => {
  try {
    const key = readKey(req, res);
    if (!key) return;
    const found = await findContent(key);
    res.set("Cache-Control", "public, max-age=60");
    return successResponse(res, {
      key,
      content: found?.content || null,
      updatedAt: found?.updatedAt || null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteContent = async (req, res, next) => {
  try {
    const key = readKey(req, res);
    if (!key) return;
    const found = await findContent(key);
    return successResponse(res, {
      key,
      content: found?.content || null,
      updatedAt: found?.updatedAt || null,
    });
  } catch (error) {
    next(error);
  }
};

export const saveSiteContent = async (req, res, next) => {
  try {
    const key = readKey(req, res);
    if (!key) return;
    const raw = req.body?.content;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return errorResponse(res, "Isi konten harus berupa objek", 400);
    }
    const content = sanitizeContent(raw);
    const size = Buffer.byteLength(JSON.stringify(content));
    if (size > MAX_BYTES) {
      return errorResponse(res, "Konten terlalu panjang", 413);
    }

    const existing = await db.query.siteContents.findFirst({
      where: eq(siteContents.key, key),
      columns: { id: true },
    });
    if (existing) {
      await db
        .update(siteContents)
        .set({ content, updatedBy: req.user?.id ?? null })
        .where(eq(siteContents.id, existing.id));
    } else {
      await db
        .insert(siteContents)
        .values({ key, content, updatedBy: req.user?.id ?? null });
    }
    return successResponse(res, { key, content }, "Konten website tersimpan");
  } catch (error) {
    next(error);
  }
};

export const uploadSiteContentImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile?.path) {
      return errorResponse(res, "Gambar wajib dipilih", 400);
    }
    return successResponse(
      res,
      { url: req.uploadedFile.path },
      "Gambar berhasil diupload",
      201,
    );
  } catch (error) {
    next(error);
  }
};
