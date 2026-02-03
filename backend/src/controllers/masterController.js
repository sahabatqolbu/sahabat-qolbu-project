// backend/src/controllers/masterController.js
import { db } from "../db/index.js";
import { masterHotels } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import xlsx from "xlsx";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";

// HELPER
function facilitiesToString(facilities) {
  if (!facilities) return "";
  if (typeof facilities === "string") {
    try {
      const parsed = JSON.parse(facilities);
      if (Array.isArray(parsed)) return parsed.join("\n");
      return facilities;
    } catch {
      return facilities;
    }
  }
  if (Array.isArray(facilities)) return facilities.join("\n");
  return "";
}

function stringToFacilities(str) {
  if (!str || str.trim() === "") return null;
  const lines = str
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  return JSON.stringify(lines);
}

// GET ALL
export const getAllHotels = async (req, res, next) => {
  try {
    const { search, city } = req.query;
    const hotels = await db
      .select()
      .from(masterHotels)
      .orderBy(desc(masterHotels.createdAt));

    let filtered = hotels;
    if (search)
      filtered = filtered.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase())
      );
    if (city)
      filtered = filtered.filter(
        (h) => h.city.toLowerCase() === city.toLowerCase()
      );

    filtered = filtered.map((h) => ({
      ...h,
      facilities: facilitiesToString(h.facilities),
    }));
    return successResponse(res, filtered);
  } catch (error) {
    next(error);
  }
};

// GET BY ID
export const getHotelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotel = await db.query.masterHotels.findFirst({
      where: eq(masterHotels.id, parseInt(id)),
    });
    if (!hotel) return errorResponse(res, "Hotel tidak ditemukan", 404);

    return successResponse(res, {
      ...hotel,
      facilities: facilitiesToString(hotel.facilities),
    });
  } catch (error) {
    next(error);
  }
};

// CREATE
export const createHotel = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      country,
      stars,
      distanceToHaram,
      facilities,
      isActive,
    } = req.body;

    const result = await db.insert(masterHotels).values({
      name,
      address: address || null,
      city,
      country: country || "Saudi Arabia",
      starRating: stars ? parseInt(stars) : null,
      distanceToHaram: distanceToHaram ? parseInt(distanceToHaram) : null,
      facilities: stringToFacilities(facilities),
      imageUrl: req.file ? req.file.path.replace("public", "") : null,
      isActive: isActive === true || isActive === "true",
    });

    const [newHotel] = await db
      .select()
      .from(masterHotels)
      .where(eq(masterHotels.id, result[0].insertId))
      .limit(1);
    return createdResponse(res, newHotel, "Hotel berhasil ditambahkan");
  } catch (error) {
    next(error);
  }
};

// UPDATE
export const updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    // ✅ FIX: distanceToHaram (BUKAN distanceToHarem)
    const { name, address, city, country, stars, distanceToHaram, facilities, isActive } = req.body;

    console.log("📥 Update hotel request:");
    console.log("  - ID:", id);
    console.log("  - Body:", req.body);
    console.log("  - File:", req.file ? { name: req.file.originalname, path: req.file.path } : "No file");

    const updateData = { updatedAt: new Date() };

    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address || null;
    if (city) updateData.city = city;
    if (country !== undefined) updateData.country = country || null;
    
    if (stars !== undefined) {
      updateData.starRating = parseInt(stars);
      console.log("  - Star Rating:", updateData.starRating);
    }
    
    // ✅ Sekarang distanceToHaram sudah defined
    if (distanceToHaram !== undefined) {
      const dist = parseInt(distanceToHaram);
      updateData.distanceToHaram = isNaN(dist) ? null : dist;
      console.log("  - Distance:", updateData.distanceToHaram);
    }
    
    if (facilities !== undefined) {
      updateData.facilities = stringToFacilities(facilities);
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === "true" || isActive === "1";
    }
    
    if (req.file && req.file.path) {
      updateData.imageUrl = req.file.path.replace("public", "");
      console.log("  - New Image URL:", updateData.imageUrl);
    }

    console.log("💾 Data to update:", updateData);

    await db
      .update(masterHotels)
      .set(updateData)
      .where(eq(masterHotels.id, parseInt(id)));

    const [updatedHotel] = await db
      .select()
      .from(masterHotels)
      .where(eq(masterHotels.id, parseInt(id)))
      .limit(1);

    if (!updatedHotel) {
      return errorResponse(res, "Hotel tidak ditemukan", 404);
    }

    console.log("✅ Updated hotel:", updatedHotel);

    const response = {
      ...updatedHotel,
      facilities: facilitiesToString(updatedHotel.facilities),
    };

    return successResponse(res, response, "Hotel berhasil diupdate");
  } catch (error) {
    console.error("❌ Error updateHotel:", error);
    next(error);
  }
};

// DELETE
export const deleteHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [hotel] = await db
      .select()
      .from(masterHotels)
      .where(eq(masterHotels.id, parseInt(id)))
      .limit(1);
    if (!hotel) return errorResponse(res, "Hotel tidak ditemukan", 404);

    await db.delete(masterHotels).where(eq(masterHotels.id, parseInt(id)));
    return successResponse(res, null, "Hotel berhasil dihapus");
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return errorResponse(
        res,
        "Hotel tidak bisa dihapus karena masih digunakan di paket",
        400
      );
    }
    next(error);
  }
};

// IMPORT
export const importHotels = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, "File Excel tidak ditemukan", 400);

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) return errorResponse(res, "File Excel kosong", 400);

    const hotels = data.map((row) => ({
      name: row.name || row.Name || row.NAMA,
      address: row.address || row.Address || row.ALAMAT || null,
      city: row.city || row.City || row.KOTA,
      country: row.country || row.Country || row.NEGARA || "Saudi Arabia",
      starRating: row.stars || row.Stars || row.BINTANG || null,
      distanceToHaram: row.distanceToHaram || row.distance || row.JARAK || null,
      facilities: row.facilities ? stringToFacilities(row.facilities) : null,
    }));

    await db.insert(masterHotels).values(hotels);
    return createdResponse(
      res,
      { imported: hotels.length },
      `${hotels.length} hotel berhasil diimport`
    );
  } catch (error) {
    next(error);
  }
};
