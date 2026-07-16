import { db } from "../db/index.js";
import {
  articles,
  masterHotels,
  masterAirlines,
  packages,
} from "../db/schema.js";
import { and, desc, eq, like, or } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";
import { deleteFile } from "../utils/upload.js";

const ARTICLE_CATEGORIES = new Set([
  "UMRAH",
  "HOTEL",
  "MASKAPAI",
  "PANDUAN",
  "LAYANAN",
  "LAINNYA",
]);
const ARTICLE_STATUSES = new Set(["DRAFT", "PUBLISHED"]);
const RELATED_TYPES = new Set([
  "NONE",
  "HOTEL",
  "AIRLINE",
  "PACKAGE",
  "SERVICE",
]);

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeStatus = (value, fallback = "DRAFT") => {
  const normalized = String(value || fallback)
    .trim()
    .toUpperCase();
  return ARTICLE_STATUSES.has(normalized) ? normalized : fallback;
};

const normalizeCategory = (value, fallback = "LAINNYA") => {
  const normalized = String(value || fallback)
    .trim()
    .toUpperCase();
  return ARTICLE_CATEGORIES.has(normalized) ? normalized : fallback;
};

const normalizeRelatedType = (value, fallback = "NONE") => {
  const normalized = String(value || fallback)
    .trim()
    .toUpperCase();
  return RELATED_TYPES.has(normalized) ? normalized : fallback;
};

const parseTags = (value) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  const text = String(value || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || "").trim()).filter(Boolean);
    }
  } catch {
    // fall through to comma parsing
  }
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value) =>
  ["true", "1", "yes", "on"].includes(String(value || "").toLowerCase());

const mapArticle = (article) => ({
  ...article,
  tags: Array.isArray(article.tags) ? article.tags : article.tags || [],
});

const ensureUniqueSlug = async (baseSlug, currentId = null) => {
  const fallbackBase = baseSlug || `artikel-${Date.now()}`;
  let candidate = fallbackBase;
  let suffix = 2;

  while (true) {
    const existing = await db.query.articles.findFirst({
      where: eq(articles.slug, candidate),
    });

    if (!existing || Number(existing.id) === Number(currentId)) {
      return candidate;
    }

    candidate = `${fallbackBase}-${suffix}`;
    suffix += 1;
  }
};

const buildArticlePayload = async (
  body,
  uploadedPath,
  existing = null,
  userId = null,
) => {
  const title =
    body.title !== undefined
      ? String(body.title || "").trim()
      : existing?.title;
  const content =
    body.content !== undefined
      ? String(body.content || "").trim()
      : existing?.content;

  if (!title || title.length < 3) {
    return { error: "Judul artikel minimal 3 karakter" };
  }
  if (!content || content.length < 10) {
    return { error: "Konten artikel minimal 10 karakter" };
  }

  const status = normalizeStatus(body.status, existing?.status || "DRAFT");
  const relatedType = normalizeRelatedType(
    body.relatedType,
    existing?.relatedType || "NONE",
  );
  const relatedId =
    relatedType === "NONE" || relatedType === "SERVICE"
      ? null
      : parsePositiveInt(body.relatedId ?? existing?.relatedId);
  if (relatedType !== "NONE" && relatedType !== "SERVICE" && !relatedId) {
    return { error: "Relasi artikel wajib dipilih" };
  }

  const requestedSlug = String(body.slug || "").trim();
  const slugBase = slugify(requestedSlug || title);
  const slug = await ensureUniqueSlug(slugBase, existing?.id || null);
  const tags = parseTags(body.tags);
  const publishedAt =
    status === "PUBLISHED" ? existing?.publishedAt || new Date() : null;

  const payload = {
    title,
    slug,
    excerpt:
      body.excerpt !== undefined
        ? body.excerpt || null
        : existing?.excerpt || null,
    content,
    category: normalizeCategory(body.category, existing?.category || "LAINNYA"),
    status,
    relatedType,
    relatedId,
    seoTitle:
      body.seoTitle !== undefined
        ? body.seoTitle || null
        : existing?.seoTitle || null,
    seoDescription:
      body.seoDescription !== undefined
        ? body.seoDescription || null
        : existing?.seoDescription || null,
    publishedAt,
  };

  if (tags !== undefined) payload.tags = tags;
  if (uploadedPath) payload.coverImage = uploadedPath;
  if (!uploadedPath && existing && parseBoolean(body.removeCoverImage)) {
    payload.coverImage = null;
  }
  if (!existing && userId) payload.authorId = userId;

  return { payload };
};

export const getAllArticles = async (req, res, next) => {
  try {
    const { search, status, category, relatedType } = req.query;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(articles.title, `%${search}%`),
          like(articles.excerpt, `%${search}%`),
        ),
      );
    }
    if (status && status !== "all") {
      conditions.push(eq(articles.status, normalizeStatus(status)));
    }
    if (category && category !== "all") {
      conditions.push(eq(articles.category, normalizeCategory(category)));
    }
    if (relatedType && relatedType !== "all") {
      conditions.push(
        eq(articles.relatedType, normalizeRelatedType(relatedType)),
      );
    }

    const rows = await db.query.articles.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(articles.createdAt)],
    });

    return successResponse(res, rows.map(mapArticle));
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req, res, next) => {
  try {
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, parseInt(req.params.id, 10)),
    });

    if (!article) return errorResponse(res, "Artikel tidak ditemukan", 404);
    return successResponse(res, mapArticle(article));
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const built = await buildArticlePayload(
      req.body,
      req.uploadedFile?.path,
      null,
      req.user?.userId,
    );
    if (built.error) return errorResponse(res, built.error, 400);

    const [created] = await db
      .insert(articles)
      .values(built.payload)
      .$returningId();
    return successResponse(
      res,
      { id: created.id },
      "Artikel berhasil ditambahkan",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await db.query.articles.findFirst({
      where: eq(articles.id, id),
    });
    if (!existing) return errorResponse(res, "Artikel tidak ditemukan", 404);

    const built = await buildArticlePayload(
      req.body,
      req.uploadedFile?.path,
      existing,
      req.user?.userId,
    );
    if (built.error) return errorResponse(res, built.error, 400);

    const shouldDeleteOldCover =
      existing.coverImage &&
      (req.uploadedFile?.path || built.payload.coverImage === null);

    await db.update(articles).set(built.payload).where(eq(articles.id, id));
    if (shouldDeleteOldCover) {
      await deleteFile(existing.coverImage);
    }
    return successResponse(res, null, "Artikel berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    await db
      .delete(articles)
      .where(eq(articles.id, parseInt(req.params.id, 10)));
    return successResponse(res, null, "Artikel berhasil dihapus");
  } catch (error) {
    next(error);
  }
};

export const uploadArticleImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile?.path) {
      return errorResponse(res, "Gambar wajib diupload", 400);
    }
    return successResponse(
      res,
      { url: req.uploadedFile.path },
      "Gambar artikel berhasil diupload",
    );
  } catch (error) {
    next(error);
  }
};

export const getPublicArticles = async (req, res, next) => {
  try {
    const { category, relatedType, relatedId, limit = 20 } = req.query;
    const conditions = [eq(articles.status, "PUBLISHED")];

    if (category && category !== "all") {
      conditions.push(eq(articles.category, normalizeCategory(category)));
    }
    if (relatedType && relatedType !== "all") {
      conditions.push(
        eq(articles.relatedType, normalizeRelatedType(relatedType)),
      );
    }
    if (relatedId) {
      conditions.push(eq(articles.relatedId, parseInt(relatedId, 10)));
    }

    const rows = await db.query.articles.findMany({
      where: and(...conditions),
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
      limit: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
    });

    return successResponse(res, { articles: rows.map(mapArticle) });
  } catch (error) {
    next(error);
  }
};

export const getPublicArticleBySlug = async (req, res, next) => {
  try {
    const article = await db.query.articles.findFirst({
      where: and(
        eq(articles.slug, req.params.slug),
        eq(articles.status, "PUBLISHED"),
      ),
    });

    if (!article) return errorResponse(res, "Artikel tidak ditemukan", 404);
    return successResponse(res, { article: mapArticle(article) });
  } catch (error) {
    next(error);
  }
};

export const getPublicHotelById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const hotel = await db.query.masterHotels.findFirst({
      where: eq(masterHotels.id, id),
    });
    if (!hotel || hotel.isActive === false)
      return errorResponse(res, "Hotel tidak ditemukan", 404);

    const relatedArticles = await db.query.articles.findMany({
      where: and(
        eq(articles.status, "PUBLISHED"),
        eq(articles.relatedType, "HOTEL"),
        eq(articles.relatedId, id),
      ),
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
    });

    const relatedPackages = await db.query.packages.findMany({
      where: or(
        eq(packages.hotelMakkahId, id),
        eq(packages.hotelMadinahId, id),
      ),
      orderBy: [desc(packages.departureDate)],
      limit: 12,
    });

    return successResponse(res, {
      hotel,
      articles: relatedArticles.map(mapArticle),
      packages: relatedPackages,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicAirlineById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const airline = await db.query.masterAirlines.findFirst({
      where: eq(masterAirlines.id, id),
    });
    if (!airline || airline.isActive === false)
      return errorResponse(res, "Maskapai tidak ditemukan", 404);

    const relatedArticles = await db.query.articles.findMany({
      where: and(
        eq(articles.status, "PUBLISHED"),
        eq(articles.relatedType, "AIRLINE"),
        eq(articles.relatedId, id),
      ),
      orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
    });

    const relatedPackages = await db.query.packages.findMany({
      where: and(
        eq(packages.airlineId, id),
        eq(packages.isActive, true),
        eq(packages.isPublished, true),
      ),
      orderBy: [desc(packages.departureDate)],
      limit: 12,
    });

    return successResponse(res, {
      airline,
      articles: relatedArticles.map(mapArticle),
      packages: relatedPackages,
    });
  } catch (error) {
    next(error);
  }
};
