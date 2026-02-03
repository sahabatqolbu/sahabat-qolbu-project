import { db } from "../db/index.js";
import { agentRequirements } from "../db/schema.js";
import { eq, asc, and } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET ALL =====
export const getAll = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    let query = db.select().from(agentRequirements);

    // Filter by isActive
    if (isActive !== undefined) {
      query = query.where(eq(agentRequirements.isActive, isActive === "true"));
    }

    const requirements = await query.orderBy(asc(agentRequirements.order));

    return successResponse(res, requirements);
  } catch (error) {
    next(error);
  }
};

// ===== CREATE =====
export const create = async (req, res, next) => {
  try {
    const { title, order } = req.body;

    if (!title) {
      return errorResponse(res, "Title wajib diisi", 400);
    }

    const [newReq] = await db.insert(agentRequirements).values({
      title,
      order: order || 0,
    });

    return successResponse(
      res,
      { id: newReq.insertId },
      "Persyaratan berhasil dibuat",
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
    const { title, order, isActive } = req.body;

    const [existing] = await db
      .select()
      .from(agentRequirements)
      .where(eq(agentRequirements.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Persyaratan tidak ditemukan", 404);
    }

    await db
      .update(agentRequirements)
      .set({ title, order, isActive })
      .where(eq(agentRequirements.id, parseInt(id)));

    return successResponse(res, null, "Persyaratan berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE =====
export const deleteRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(agentRequirements)
      .where(eq(agentRequirements.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Persyaratan tidak ditemukan", 404);
    }

    await db
      .delete(agentRequirements)
      .where(eq(agentRequirements.id, parseInt(id)));

    return successResponse(res, null, "Persyaratan berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
