// backend/src/controllers/airportController.js
import { db } from "../db/index.js";
import { masterAirports } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";

// GET ALL AIRPORTS
export const getAllAirports = async (req, res, next) => {
  try {
    const { search, country } = req.query;

    let query = db
      .select()
      .from(masterAirports)
      .orderBy(desc(masterAirports.createdAt));

    const airports = await query;

    let filtered = airports;

    if (search) {
      filtered = filtered.filter(
        (airport) =>
          airport.name.toLowerCase().includes(search.toLowerCase()) ||
          airport.code.toLowerCase().includes(search.toLowerCase()) ||
          airport.city.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (country) {
      filtered = filtered.filter(
        (airport) => airport.country.toLowerCase() === country.toLowerCase()
      );
    }

    return successResponse(res, filtered);
  } catch (error) {
    next(error);
  }
};

// GET AIRPORT BY ID
export const getAirportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const airport = await db.query.masterAirports.findFirst({
      where: eq(masterAirports.id, parseInt(id)),
    });

    if (!airport) {
      return errorResponse(res, "Bandara tidak ditemukan", 404);
    }

    return successResponse(res, airport);
  } catch (error) {
    next(error);
  }
};

// CREATE AIRPORT ✅ MySQL Compatible
export const createAirport = async (req, res, next) => {
  try {
    const { name, code, city, country } = req.body;

    // Check if code already exists
    const existing = await db.query.masterAirports.findFirst({
      where: eq(masterAirports.code, code.toUpperCase()),
    });

    if (existing) {
      return errorResponse(res, "Kode bandara sudah terdaftar", 400);
    }

    // ✅ INSERT tanpa .returning()
    const result = await db.insert(masterAirports).values({
      name,
      code: code.toUpperCase(),
      city,
      country,
    });

    // ✅ FETCH data baru
    const insertId = result[0].insertId;
    const [newAirport] = await db
      .select()
      .from(masterAirports)
      .where(eq(masterAirports.id, insertId))
      .limit(1);

    return createdResponse(res, newAirport, "Bandara berhasil ditambahkan");
  } catch (error) {
    next(error);
  }
};

// UPDATE AIRPORT ✅ MySQL Compatible
export const updateAirport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, city, country } = req.body;

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (city) updateData.city = city;
    if (country) updateData.country = country;

    // ✅ UPDATE tanpa .returning()
    await db
      .update(masterAirports)
      .set(updateData)
      .where(eq(masterAirports.id, parseInt(id)));

    // ✅ FETCH data updated
    const [updatedAirport] = await db
      .select()
      .from(masterAirports)
      .where(eq(masterAirports.id, parseInt(id)))
      .limit(1);

    if (!updatedAirport) {
      return errorResponse(res, "Bandara tidak ditemukan", 404);
    }

    return successResponse(res, updatedAirport, "Bandara berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// DELETE AIRPORT ✅ MySQL Compatible
export const deleteAirport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Cek exist
    const [airport] = await db
      .select()
      .from(masterAirports)
      .where(eq(masterAirports.id, parseInt(id)))
      .limit(1);

    if (!airport) {
      return errorResponse(res, "Bandara tidak ditemukan", 404);
    }

    // ✅ DELETE
    await db.delete(masterAirports).where(eq(masterAirports.id, parseInt(id)));

    return successResponse(res, null, "Bandara berhasil dihapus");
  } catch (error) {
    // ✅ Handle foreign key constraint
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return errorResponse(
        res,
        "Bandara tidak bisa dihapus karena masih digunakan di paket",
        400
      );
    }
    next(error);
  }
};
