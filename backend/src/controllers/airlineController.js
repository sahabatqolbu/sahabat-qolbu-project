// backend/src/controllers/airlineController.js
import { db } from "../db/index.js";
import { masterAirlines } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";

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
    const { code, name, country, isActive } = req.body;

    console.log("📥 RAW REQUEST:");
    console.log("  - Body:", req.body);
    console.log("  - File:", req.file); // ✅ Harus ada object jika upload file
    console.log("  - File path:", req.file?.path); // ✅ Harus ada path

    // ✅ CEK: Jika req.file kosong, berarti multer belum jalan
    if (!req.file) {
      console.warn("⚠️ No file uploaded!");
    }

    const result = await db.insert(masterAirlines).values({
      code: code.toUpperCase(),
      name,
      country: country || null,
      logo: req.file ? req.file.path.replace("public", "") : null,
      isActive: isActive === true || isActive === "true",
    });

    console.log("✅ Insert result:", result);
    console.log("✅ insertId:", result[0].insertId);

    const insertId = result[0].insertId;
    const [newAirline] = await db
      .select()
      .from(masterAirlines)
      .where(eq(masterAirlines.id, insertId))
      .limit(1);

    console.log("✅ Created airline with logo:", newAirline.logo); // ✅ Cek logo ada

    return createdResponse(res, newAirline, "Maskapai berhasil ditambahkan");
  } catch (error) {
    console.error("❌ Create airline error:", error);
    next(error);
  }
};

// =====================================================
// UPDATE AIRLINE ✅ MySQL Compatible (NO .returning())
// =====================================================
export const updateAirline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, country, isActive } = req.body;

    console.log("📥 Update airline request:", {
      id,
      code,
      name,
      hasFile: !!req.file,
    });

    const updateData = { updatedAt: new Date() };

    if (code) updateData.code = code.toUpperCase();
    if (name) updateData.name = name;
    if (country !== undefined) updateData.country = country || null;

    // Parse isActive
    if (isActive !== undefined) {
      updateData.isActive =
        isActive === true || isActive === "true" || isActive === "1";
    }

    // Upload logo baru (opsional)
    if (req.file && req.file.path) {
      updateData.logo = req.file.path.replace("public", "");
      console.log("📸 New logo path:", updateData.logo);
    }

    console.log("💾 Update data:", updateData);

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

    console.log("✅ Updated airline:", updatedAirline);

    return successResponse(res, updatedAirline, "Maskapai berhasil diupdate");
  } catch (error) {
    console.error("❌ Update airline error:", error);
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
        400
      );
    }

    next(error);
  }
};
