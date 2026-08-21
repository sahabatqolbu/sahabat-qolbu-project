import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { heroSlides } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";

const toBoolean = (value, fallback = true) =>
  value === undefined || value === null || value === ""
    ? fallback
    : value === true || String(value).toLowerCase() === "true";

const parsePayload = (body, existing = {}) => {
  const parsedOrder = Number.parseInt(body.sortOrder, 10);
  return {
    title: String(body.title || "").trim() || null,
    altText: String(body.altText || "").trim() || null,
    isActive: toBoolean(body.isActive, existing.isActive ?? true),
    sortOrder: Number.isFinite(parsedOrder)
      ? Math.min(Math.max(parsedOrder, 0), 999)
      : (existing.sortOrder ?? 0),
  };
};

export const getPublicHeroSlides = async (req, res, next) => {
  try {
    const slides = await db.query.heroSlides.findMany({
      where: eq(heroSlides.isActive, true),
      orderBy: [asc(heroSlides.sortOrder), asc(heroSlides.id)],
    });
    return successResponse(res, { slides });
  } catch (error) {
    next(error);
  }
};

export const getAllHeroSlides = async (req, res, next) => {
  try {
    const slides = await db.query.heroSlides.findMany({
      orderBy: [asc(heroSlides.sortOrder), asc(heroSlides.id)],
    });
    return successResponse(res, slides);
  } catch (error) {
    next(error);
  }
};

export const createHeroSlide = async (req, res, next) => {
  try {
    if (!req.uploadedFile?.path) {
      return errorResponse(res, "Gambar hero wajib diupload", 400);
    }

    const [created] = await db
      .insert(heroSlides)
      .values({
        ...parsePayload(req.body),
        imageUrl: req.uploadedFile.path,
      })
      .$returningId();

    return successResponse(
      res,
      { id: created.id },
      "Slide hero berhasil dibuat",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateHeroSlide = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await db.query.heroSlides.findFirst({
      where: eq(heroSlides.id, id),
    });
    if (!existing) return errorResponse(res, "Slide hero tidak ditemukan", 404);

    await db
      .update(heroSlides)
      .set({
        ...parsePayload(req.body, existing),
        imageUrl: req.uploadedFile?.path || existing.imageUrl,
      })
      .where(eq(heroSlides.id, id));

    return successResponse(res, null, "Slide hero berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

export const deleteHeroSlide = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await db.query.heroSlides.findFirst({
      where: eq(heroSlides.id, id),
    });
    if (!existing) return errorResponse(res, "Slide hero tidak ditemukan", 404);

    await db.delete(heroSlides).where(eq(heroSlides.id, id));
    return successResponse(res, null, "Slide hero berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
