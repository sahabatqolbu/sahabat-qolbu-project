import { db } from "../db/index.js";
import { testimonials } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ===== GET ALL TESTIMONIALS =====
export const getAllTestimonials = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(testimonials.isActive, isActive === "true"));
    }

    const allTestimonials = await db.query.testimonials.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: [testimonials.sortOrder, desc(testimonials.createdAt)],
    });

    return successResponse(res, allTestimonials);
  } catch (error) {
    next(error);
  }
};

// ===== CREATE TESTIMONIAL =====
export const createTestimonial = async (req, res, next) => {
  try {
    const { name, role, photo, rating, message, isActive, sortOrder } =
      req.body;

    const [newTestimonial] = await db
      .insert(testimonials)
      .values({
        name,
        role: role || null,
        photo: photo || null,
        rating: rating || 5,
        message,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      })
      .$returningId();

    return successResponse(
      res,
      { id: newTestimonial.id },
      "Testimonial berhasil ditambahkan",
      201
    );
  } catch (error) {
    next(error);
  }
};

// ===== UPDATE TESTIMONIAL =====
export const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, photo, rating, message, isActive, sortOrder } =
      req.body;

    const existing = await db.query.testimonials.findFirst({
      where: eq(testimonials.id, parseInt(id)),
    });

    if (!existing) {
      return errorResponse(res, "Testimonial tidak ditemukan", 404);
    }

    await db
      .update(testimonials)
      .set({
        name: name ?? existing.name,
        role: role ?? existing.role,
        photo: photo ?? existing.photo,
        rating: rating ?? existing.rating,
        message: message ?? existing.message,
        isActive: isActive ?? existing.isActive,
        sortOrder: sortOrder ?? existing.sortOrder,
      })
      .where(eq(testimonials.id, parseInt(id)));

    return successResponse(res, null, "Testimonial berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// ===== DELETE TESTIMONIAL =====
export const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.delete(testimonials).where(eq(testimonials.id, parseInt(id)));

    return successResponse(res, null, "Testimonial berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
