import { db } from "../db/index.js";
import { agentPurposes } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET ALL =====
export const getAll = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    let query = db.select().from(agentPurposes);

    // Filter by isActive
    if (isActive !== undefined) {
      query = query.where(eq(agentPurposes.isActive, isActive === "true"));
    }

    const purposes = await query.orderBy(asc(agentPurposes.order));

    return successResponse(res, purposes);
  } catch (error) {
    next(error);
  }
};

// ===== CREATE =====
export const create = async (req, res, next) => {
  try {
    const { title, slug, order } = req.body;

    if (!title || !slug) {
      return errorResponse(res, "Title dan slug wajib diisi", 400);
    }

    // Cek duplikat slug
    const [existingSlug] = await db
      .select()
      .from(agentPurposes)
      .where(eq(agentPurposes.slug, slug))
      .limit(1);

    if (existingSlug) {
      return errorResponse(res, "Slug sudah digunakan", 409);
    }

    const [newPurpose] = await db.insert(agentPurposes).values({
      title,
      slug,
      order: order || 0,
    });

    return successResponse(
      res,
      { id: newPurpose.insertId },
      "Tujuan berhasil dibuat",
      201
    );
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE =====
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, order, isActive } = req.body;

    const [existing] = await db
      .select()
      .from(agentPurposes)
      .where(eq(agentPurposes.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Tujuan tidak ditemukan", 404);
    }

    // Cek duplikat slug jika berubah
    if (slug && slug !== existing.slug) {
      const [existingSlug] = await db
        .select()
        .from(agentPurposes)
        .where(eq(agentPurposes.slug, slug))
        .limit(1);

      if (existingSlug) {
        return errorResponse(res, "Slug sudah digunakan", 409);
      }
    }

    await db
      .update(agentPurposes)
      .set({ title, slug, order, isActive })
      .where(eq(agentPurposes.id, parseInt(id)));

    return successResponse(res, null, "Tujuan berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE =====
export const deletePurpose = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(agentPurposes)
      .where(eq(agentPurposes.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Tujuan tidak ditemukan", 404);
    }

    await db.delete(agentPurposes).where(eq(agentPurposes.id, parseInt(id)));

    return successResponse(res, null, "Tujuan berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
