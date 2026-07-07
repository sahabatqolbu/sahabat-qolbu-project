import { db } from "../db/index.js";
import { gallery } from "../db/schema.js";
import { and, eq, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

const parseGalleryDate = (value) => {
  if (!value) return new Date();

  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getPublicGallery = async (req, res, next) => {
  try {
    const activeGallery = await db.query.gallery.findMany({
      where: eq(gallery.isActive, true),
      orderBy: [desc(gallery.createdAt)],
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
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(gallery.createdAt)],
    });

    return successResponse(res, allGallery);
  } catch (error) {
    next(error);
  }
};

export const createGallery = async (req, res, next) => {
  try {
    const { title, description, category, galleryDate } = req.body;
    const imageUrl = req.uploadedFile?.path;
    const createdAt = parseGalleryDate(galleryDate);

    if (!imageUrl) {
      return errorResponse(res, "Gambar wajib diupload", 400);
    }

    if (!createdAt) {
      return errorResponse(res, "Tanggal gallery tidak valid", 400);
    }

    const [newGallery] = await db
      .insert(gallery)
      .values({
        title: title || null,
        description: description || null,
        imageUrl,
        category: category || "LAINNYA",
        isActive: true,
        sortOrder: 0,
        createdAt,
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
    const { title, description, category, galleryDate } = req.body;
    const imageUrl = req.uploadedFile?.path;
    const createdAt = parseGalleryDate(galleryDate);

    const existing = await db.query.gallery.findFirst({
      where: eq(gallery.id, parseInt(id, 10)),
    });

    if (!existing) {
      return errorResponse(res, "Gallery tidak ditemukan", 404);
    }

    if (!createdAt) {
      return errorResponse(res, "Tanggal gallery tidak valid", 400);
    }

    await db
      .update(gallery)
      .set({
        title: title ?? existing.title,
        description: description ?? existing.description,
        imageUrl: imageUrl ?? existing.imageUrl,
        category: category ?? existing.category,
        isActive: true,
        sortOrder: 0,
        createdAt,
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
