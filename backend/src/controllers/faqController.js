import { db } from "../db/index.js";
import { faqs } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET PUBLIC FAQs =====
export const getPublicFaqs = async (req, res, next) => {
  try {
    const activeFaqs = await db.query.faqs.findMany({
      where: eq(faqs.isActive, true),
      orderBy: [faqs.sortOrder, desc(faqs.createdAt)],
    });

    return successResponse(res, { faqs: activeFaqs });
  } catch (error) {
    next(error);
  }
};

// ===== GET ALL FAQs =====
export const getAllFAQs = async (req, res, next) => {
  try {
    const { category, isActive } = req.query;

    const conditions = [];
    if (category && category !== "all") {
      conditions.push(eq(faqs.category, category));
    }
    if (isActive !== undefined) {
      conditions.push(eq(faqs.isActive, isActive === "true"));
    }

    const allFAQs = await db.query.faqs.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: [faqs.sortOrder, desc(faqs.createdAt)],
    });

    return successResponse(res, allFAQs);
  } catch (error) {
    next(error);
  }
};

// ===== CREATE FAQ =====
export const createFAQ = async (req, res, next) => {
  try {
    const { category, question, answer, isActive, sortOrder } = req.body;

    const [newFAQ] = await db
      .insert(faqs)
      .values({
        category: category || "GENERAL",
        question,
        answer,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      })
      .$returningId();

    return successResponse(
      res,
      { id: newFAQ.id },
      "FAQ berhasil ditambahkan",
      201,
    );
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE FAQ =====
export const updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, question, answer, isActive, sortOrder } = req.body;

    const existing = await db.query.faqs.findFirst({
      where: eq(faqs.id, parseInt(id)),
    });

    if (!existing) {
      return errorResponse(res, "FAQ tidak ditemukan", 404);
    }

    await db
      .update(faqs)
      .set({
        category: category ?? existing.category,
        question: question ?? existing.question,
        answer: answer ?? existing.answer,
        isActive: isActive ?? existing.isActive,
        sortOrder: sortOrder ?? existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(faqs.id, parseInt(id)));

    return successResponse(res, null, "FAQ berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE FAQ =====
export const deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.delete(faqs).where(eq(faqs.id, parseInt(id)));

    return successResponse(res, null, "FAQ berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
