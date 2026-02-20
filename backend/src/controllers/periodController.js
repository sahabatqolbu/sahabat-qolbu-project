import { db } from "../db/index.js";
import { periods, agentClosingHistory } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET ALL =====
export const getAll = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    let query = db.select().from(periods);

    // Filter by isActive
    if (isActive !== undefined) {
      query = query.where(eq(periods.isActive, isActive === "true"));
    }

    const allPeriods = await query.orderBy(desc(periods.startDate));

    return successResponse(res, allPeriods);
  } catch (error) {
    next(error);
  }
};

// ===== GET BY ID =====
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [period] = await db
      .select()
      .from(periods)
      .where(eq(periods.id, parseInt(id)))
      .limit(1);

    if (!period) {
      return errorResponse(res, "Periode tidak ditemukan", 404);
    }

    return successResponse(res, period);
  } catch (error) {
    next(error);
  }
};

// ===== CREATE =====
export const create = async (req, res, next) => {
  try {
    const { name, startDate, endDate, duration } = req.body;

    if (!name || !startDate || !endDate) {
      return errorResponse(
        res,
        "Nama, start date, dan end date wajib diisi",
        400
      );
    }

    // Hitung durasi otomatis jika tidak diisi
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return errorResponse(
        res,
        "End date harus lebih besar dari start date",
        400
      );
    }

    const calculatedDuration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const [newPeriod] = await db.insert(periods).values({
      name,
      startDate: start,
      endDate: end,
      duration: duration || calculatedDuration,
    });

    return successResponse(
      res,
      { id: newPeriod.insertId },
      "Periode berhasil dibuat",
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
    const { name, startDate, endDate, duration, isActive } = req.body;

    const [existing] = await db
      .select()
      .from(periods)
      .where(eq(periods.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Periode tidak ditemukan", 404);
    }

    // Hitung ulang durasi jika tanggal berubah
    let calculatedDuration = duration;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return errorResponse(
          res,
          "End date harus lebih besar dari start date",
          400
        );
      }

      calculatedDuration = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    await db
      .update(periods)
      .set({
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        duration: calculatedDuration,
        isActive,
      })
      .where(eq(periods.id, parseInt(id)));

    return successResponse(res, null, "Periode berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE =====
export const deletePeriod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(periods)
      .where(eq(periods.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return errorResponse(res, "Periode tidak ditemukan", 404);
    }

    const [closingCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(agentClosingHistory)
      .where(eq(agentClosingHistory.periodId, parseInt(id)));

    if (Number(closingCount?.count || 0) > 0) {
      return errorResponse(
        res,
        "Periode tidak dapat dihapus karena sudah digunakan pada histori closing",
        400
      );
    }

    await db.delete(periods).where(eq(periods.id, parseInt(id)));

    return successResponse(res, null, "Periode berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
