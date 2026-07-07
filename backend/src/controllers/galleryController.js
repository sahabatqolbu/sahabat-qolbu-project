import { db } from "../db/index.js";
import { gallery } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const parseSortOrder = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
export const getPublicGallery = async (req, res, next) => {
  try {
    const activeGallery = await db.query.gallery.findMany({
      where: eq(gallery.isActive, true),
      orderBy: [gallery.sortOrder, desc(gallery.createdAt)],
    });

    return successResponse(res, { gallery: activeGallery });
  } catch (error) {
    next(error);
  }
};

export const getAllGallery = async (req, res, next) => {
  try {
    const { category, isActive } = req.query;

    const conditions = [];
    if (category && category !== "all") {
      conditions.push(eq(gallery.category, category));
    }
    if (isActive !== undefined) {
      conditions.push(eq(gallery.isActive, isActive === "true"));
    }

    const allGallery = await db.query.gallery.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: [gallery.sortOrder, desc(gallery.createdAt)],
    });

    return successResponse(res, allGallery);
  } catch (error) {
    next(error);
  }
};

export const createGallery = async (req, res, next) => {
  try {
    const { title, description, category, isActive, sortOrder } = req.body;
    const imageUrl = req.uploadedFile?.path || req.body.imageUrl;

    if (!imageUrl) {
      return errorResponse(res, "Gambar wajib diupload", 400);
    }

    const [newGallery] = await db
      .insert(gallery)
      .values({
        title: title || null,
        description: description || null,
        imageUrl,
        category: category || "LAINNYA",
        isActive: parseBoolean(isActive, true),
        sortOrder: parseSortOrder(sortOrder, 0),
      })
      .$returningId();

    return successResponse(
      res,
      { id: newGallery.id },
      "Gallery berhasil ditambahkan",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateGallery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, isActive, sortOrder } = req.body;
    const imageUrl = req.uploadedFile?.path || req.body.imageUrl;

    const existing = await db.query.gallery.findFirst({
      where: eq(gallery.id, parseInt(id, 10)),
    });

    if (!existing) {
      return errorResponse(res, "Gallery tidak ditemukan", 404);
    }

    await db
      .update(gallery)
      .set({
        title: title ?? existing.title,
        description: description ?? existing.description,
        imageUrl: imageUrl ?? existing.imageUrl,
        category: category ?? existing.category,
        isActive: parseBoolean(isActive, existing.isActive),
        sortOrder: parseSortOrder(sortOrder, existing.sortOrder),
      })
      .where(eq(gallery.id, parseInt(id, 10)));

    return successResponse(res, null, "Gallery berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

export const deleteGallery = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.delete(gallery).where(eq(gallery.id, parseInt(id, 10)));

    return successResponse(res, null, "Gallery berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
