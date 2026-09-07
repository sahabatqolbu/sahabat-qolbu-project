// backend/src/controllers/airlineController.js
import { db } from "../db/index.js";
import { masterAirlines } from "../db/schema.js";
import { eq, desc, asc } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";

const normalizeVideoUrls = (value) => {
  if (!value) return [];
  let candidates = value;
  if (typeof value === "string") {
    try {
      candidates = JSON.parse(value);
    } catch {
      candidates = value.split(/\r?\n/);
    }
  }

  return (Array.isArray(candidates) ? candidates : [])
    .map((item) => String(item?.url || item || "").trim())
    .filter((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return (
          host === "youtu.be" ||
          host === "youtube.com" ||
          host.endsWith(".youtube.com") ||
          host === "instagram.com" ||
          host.endsWith(".instagram.com")
        );
      } catch {
        return false;
      }
    })
    .slice(0, 10);
};

// =====================================================
// GET ALL AIRLINES
// =====================================================
export const getAllAirlines = async (req, res, next) => {
  try {
    const airlines = await db
      .select()
      .from(masterAirlines)
      .orderBy(desc(masterAirlines.createdAt));

    return successResponse(res, airlines);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET AIRLINE BY ID
// =====================================================
export const getAirlineById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const airline = await db.query.masterAirlines.findFirst({
      where: eq(masterAirlines.id, parseInt(id)),
      with: {
        images: {
          orderBy: (images) => [asc(images.sortOrder), asc(images.id)],
        },
      },
    });

    if (!airline) {
      return errorResponse(res, "Maskapai tidak ditemukan", 404);
    }

    return successResponse(res, airline);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE AIRLINE ✅ MySQL Compatible (NO .returning())
// =====================================================
export const createAirline = async (req, res, next) => {
  try {
    const {
      code,
      name,
      country,
      description,
      facilities,
      videoUrls,
      isActive,
    } = req.body;

    const result = await db.insert(masterAirlines).values({
      code: code.toUpperCase(),
      name,
      country: country || null,
      description: description || null,
      facilities: facilities || null,
      videoUrls: normalizeVideoUrls(videoUrls),
      logo: req.uploadedFile ? req.uploadedFile.path : null,
      isActive: isActive === true || isActive === "true",
    });

    const insertId = result[0].insertId;
    const [newAirline] = await db
      .select()
      .from(masterAirlines)
      .where(eq(masterAirlines.id, insertId))
      .limit(1);

    return createdResponse(res, newAirline, "Maskapai berhasil ditambahkan");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE AIRLINE ✅ MySQL Compatible (NO .returning())
// =====================================================
export const updateAirline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      country,
      description,
      facilities,
      videoUrls,
      isActive,
    } = req.body;

    const updateData = { updatedAt: new Date() };

    if (code) updateData.code = code.toUpperCase();
    if (name) updateData.name = name;
    if (country !== undefined) updateData.country = country || null;
    if (description !== undefined) updateData.description = description || null;
    if (facilities !== undefined) updateData.facilities = facilities || null;
    if (videoUrls !== undefined) {
      updateData.videoUrls = normalizeVideoUrls(videoUrls);
    }

    // Parse isActive
    if (isActive !== undefined) {
      updateData.isActive =
        isActive === true || isActive === "true" || isActive === "1";
    }

    // Upload logo baru (opsional)
    if (req.uploadedFile?.path) {
      updateData.logo = req.uploadedFile.path;
    }

    // ✅ UPDATE tanpa .returning()
    await db
      .update(masterAirlines)
      .set(updateData)
      .where(eq(masterAirlines.id, parseInt(id)));

    // ✅ FETCH data yang sudah diupdate
    const [updatedAirline] = await db
      .select()
      .from(masterAirlines)
      .where(eq(masterAirlines.id, parseInt(id)))
      .limit(1);

    if (!updatedAirline) {
      return errorResponse(res, "Maskapai tidak ditemukan", 404);
    }

    return successResponse(res, updatedAirline, "Maskapai berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE AIRLINE ✅ MySQL Compatible
// =====================================================
export const deleteAirline = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Delete airline request:", { id });

    // ✅ Check if airline exists
    const [airline] = await db
      .select()
      .from(masterAirlines)
      .where(eq(masterAirlines.id, parseInt(id)))
      .limit(1);

    if (!airline) {
      return errorResponse(res, "Maskapai tidak ditemukan", 404);
    }

    // ✅ DELETE
    await db.delete(masterAirlines).where(eq(masterAirlines.id, parseInt(id)));

    console.log("✅ Deleted airline:", airline.name);

    return successResponse(res, null, "Maskapai berhasil dihapus");
  } catch (error) {
    console.error("❌ Delete airline error:", error);

    // ✅ Handle foreign key constraint error
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return errorResponse(
        res,
        "Maskapai tidak bisa dihapus karena masih digunakan di paket",
        400,
      );
    }

    next(error);
  }
};
