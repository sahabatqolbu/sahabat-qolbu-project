import { db } from "../db/index.js";
import { agentLevels, agentBenefits } from "../db/schema.js";
import { eq, desc, asc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET ALL LEVELS =====
export const getAll = async (req, res, next) => {
  try {
    const levels = await db
      .select({
        id: agentLevels.id,
        name: agentLevels.name,
        slug: agentLevels.slug,
        star: agentLevels.star,
        price: agentLevels.price,
        minClosing: agentLevels.minClosing,
        maxPeriod: agentLevels.maxPeriod,
        maintainClosing: agentLevels.maintainClosing,
        maintainPeriod: agentLevels.maintainPeriod,
        downgradeClosing: agentLevels.downgradeClosing,
        description: agentLevels.description,
        isActive: agentLevels.isActive,
        order: agentLevels.order,
        createdAt: agentLevels.createdAt,
        updatedAt: agentLevels.updatedAt,
      })
      .from(agentLevels)
      .orderBy(asc(agentLevels.order));

    // Get benefits untuk setiap level
    const levelsWithBenefits = await Promise.all(
      levels.map(async (level) => {
        const benefits = await db
          .select()
          .from(agentBenefits)
          .where(eq(agentBenefits.agentLevelId, level.id))
          .orderBy(asc(agentBenefits.order));

        return {
          ...level,
          benefits,
        };
      })
    );

    return successResponse(res, levelsWithBenefits);
  } catch (error) {
    next(error);
  }
};

// ===== GET LEVEL BY ID =====
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [level] = await db
      .select()
      .from(agentLevels)
      .where(eq(agentLevels.id, parseInt(id)))
      .limit(1);

    if (!level) {
      return errorResponse(res, "Level tidak ditemukan", 404);
    }

    // Get benefits
    const benefits = await db
      .select()
      .from(agentBenefits)
      .where(eq(agentBenefits.agentLevelId, level.id))
      .orderBy(asc(agentBenefits.order));

    return successResponse(res, {
      ...level,
      benefits,
    });
  } catch (error) {
    next(error);
  }
};

// ===== CREATE LEVEL =====
export const create = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      star,
      price,
      minClosing,
      maxPeriod,
      maintainClosing,
      maintainPeriod,
      downgradeClosing,
      description,
      order,
      benefits,
    } = req.body;

    // Validasi
    if (!name || !slug || star === undefined) {
      return errorResponse(res, "Nama, slug, dan star wajib diisi", 400);
    }

    // Cek duplikat slug
    const [existingSlug] = await db
      .select()
      .from(agentLevels)
      .where(eq(agentLevels.slug, slug))
      .limit(1);

    if (existingSlug) {
      return errorResponse(res, "Slug sudah digunakan", 409);
    }

    // Cek duplikat star
    const [existingStar] = await db
      .select()
      .from(agentLevels)
      .where(eq(agentLevels.star, star))
      .limit(1);

    if (existingStar) {
      return errorResponse(res, "Star sudah digunakan", 409);
    }

    // Insert level
    const [newLevel] = await db.insert(agentLevels).values({
      name,
      slug,
      star,
      price: price || "0",
      minClosing,
      maxPeriod,
      maintainClosing,
      maintainPeriod,
      downgradeClosing,
      description,
      order: order || 0,
    });

    // Insert benefits jika ada
    if (benefits && Array.isArray(benefits) && benefits.length > 0) {
      const benefitValues = benefits.map((b, index) => ({
        agentLevelId: newLevel.insertId,
        title: b.title,
        description: b.description || null,
        order: b.order !== undefined ? b.order : index,
      }));

      await db.insert(agentBenefits).values(benefitValues);
    }

    return successResponse(
      res,
      { id: newLevel.insertId },
      "Level berhasil dibuat",
      201
    );
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE LEVEL =====
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      star,
      price,
      minClosing,
      maxPeriod,
      maintainClosing,
      maintainPeriod,
      downgradeClosing,
      description,
      isActive,
      order,
      benefits,
    } = req.body;

    // Cek apakah level ada
    const [existingLevel] = await db
      .select()
      .from(agentLevels)
      .where(eq(agentLevels.id, parseInt(id)))
      .limit(1);

    if (!existingLevel) {
      return errorResponse(res, "Level tidak ditemukan", 404);
    }

    // Update level
    await db
      .update(agentLevels)
      .set({
        name,
        slug,
        star,
        price,
        minClosing,
        maxPeriod,
        maintainClosing,
        maintainPeriod,
        downgradeClosing,
        description,
        isActive,
        order,
      })
      .where(eq(agentLevels.id, parseInt(id)));

    // Update benefits jika ada
    if (benefits !== undefined && Array.isArray(benefits)) {
      // Hapus benefits lama
      await db
        .delete(agentBenefits)
        .where(eq(agentBenefits.agentLevelId, parseInt(id)));

      // Insert benefits baru
      if (benefits.length > 0) {
        const benefitValues = benefits.map((b, index) => ({
          agentLevelId: parseInt(id),
          title: b.title,
          description: b.description || null,
          order: b.order !== undefined ? b.order : index,
        }));

        await db.insert(agentBenefits).values(benefitValues);
      }
    }

    return successResponse(res, null, "Level berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE LEVEL =====
export const deleteLevel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existingLevel] = await db
      .select()
      .from(agentLevels)
      .where(eq(agentLevels.id, parseInt(id)))
      .limit(1);

    if (!existingLevel) {
      return errorResponse(res, "Level tidak ditemukan", 404);
    }

    // Delete level (benefits akan auto-delete karena onDelete: cascade)
    await db.delete(agentLevels).where(eq(agentLevels.id, parseInt(id)));

    return successResponse(res, null, "Level berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
