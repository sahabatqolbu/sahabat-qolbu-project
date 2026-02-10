// backend/src/controllers/packageController.js

import { db } from "../db/index.js";
import {
  packages,
  packageImages,
  jamaahData,
  calendarEvents,
} from "../db/schema.js";
import { eq, desc, like, and, or, count, inArray } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  createdResponse,
  paginatedResponse,
} from "../utils/response.js";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { UPLOAD_BASE } from "../utils/upload.js";

// ✅ IMPORT SYNC FUNCTION
import { syncPackageEvent } from "./calendarController.js";

const getUploadAbsolutePath = (uploadPath) => {
  if (!uploadPath || typeof uploadPath !== "string") return null;
  const relativePath = uploadPath.startsWith("/uploads/")
    ? uploadPath.replace("/uploads/", "")
    : uploadPath.replace(/^\/+/, "");
  return path.join(UPLOAD_BASE, relativePath);
};

// =====================================================
// HELPER: Generate Package Code
// =====================================================
const generatePackageCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `UMR-${year}`;

  const result = await db
    .select({ count: count() })
    .from(packages)
    .where(like(packages.code, `${prefix}%`));

  const num = (result[0]?.count || 0) + 1;
  return `${prefix}-${String(num).padStart(3, "0")}`;
};

// =====================================================
// HELPER: Calculate Booked Seats
// =====================================================
const getBookedSeats = async (packageId) => {
  const result = await db
    .select({ count: count() })
    .from(jamaahData)
    .where(
      and(
        eq(jamaahData.packageId, packageId),
        or(
          eq(jamaahData.registrationStatus, "CONFIRMED"),
          eq(jamaahData.registrationStatus, "PENDING_PAYMENT"),
        ),
      ),
    );
  return result[0]?.count || 0;
};

const getBookedSeatsByPackageIds = async (packageIds = []) => {
  if (!packageIds.length) {
    return new Map();
  }

  const rows = await db
    .select({
      packageId: jamaahData.packageId,
      count: count(),
    })
    .from(jamaahData)
    .where(
      and(
        inArray(jamaahData.packageId, packageIds),
        or(
          eq(jamaahData.registrationStatus, "CONFIRMED"),
          eq(jamaahData.registrationStatus, "PENDING_PAYMENT"),
        ),
      ),
    )
    .groupBy(jamaahData.packageId);

  const bookedSeatsByPackageId = new Map();
  for (const row of rows) {
    if (row.packageId != null) {
      bookedSeatsByPackageId.set(Number(row.packageId), Number(row.count || 0));
    }
  }

  return bookedSeatsByPackageId;
};

// =====================================================
// HELPER: Calculate Days Until Departure
// =====================================================
const getDaysUntilDeparture = (departureDate) => {
  const today = new Date();
  const departure = new Date(departureDate);
  const diffTime = departure - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// =====================================================
// GET ALL PACKAGES (with Stats)
// =====================================================
export const getAllPackages = async (req, res, next) => {
  try {
    const { search, type, isActive, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(packages.name, `%${search}%`),
          like(packages.code, `%${search}%`),
        ),
      );
    }
    if (type && type !== "all") {
      conditions.push(eq(packages.type, type));
    }
    if (isActive !== undefined) {
      conditions.push(eq(packages.isActive, isActive === "true"));
    }

    const allPackages = await db.query.packages.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(packages.departureDate)],
      limit: parseInt(limit),
      offset,
      with: {
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
        departureAirport: true,
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
        },
      },
    });

    const allPackageIds = allPackages.map((pkg) => pkg.id);
    const bookedSeatsByPackageId = await getBookedSeatsByPackageIds(allPackageIds);

    const packagesWithStats = allPackages.map((pkg) => {
        const bookedSeats = bookedSeatsByPackageId.get(pkg.id) || 0;
        const remainingSeats = pkg.totalSeats - bookedSeats;
        const daysUntilDeparture = getDaysUntilDeparture(pkg.departureDate);

        const airlineTermin1 = parseFloat(pkg.airlineTermin1Amount) || 0;
        const airlineTermin2 = parseFloat(pkg.airlineTermin2Amount) || 0;
        const airlinePaymentTotal = airlineTermin1 + airlineTermin2;
        const airlinePaymentStatus =
          pkg.airlineTermin1Status === "PAID" &&
          pkg.airlineTermin2Status === "PAID"
            ? "PAID"
            : pkg.airlineTermin1Status === "PAID" ||
                pkg.airlineTermin2Status === "PAID"
              ? "PARTIAL"
              : "UNPAID";

        const hotelMakkahRooms =
          (pkg.hotelMakkahDouble || 0) +
          (pkg.hotelMakkahTriple || 0) +
          (pkg.hotelMakkahQuad || 0) +
          (pkg.hotelMakkahQuint || 0);

        const hotelMadinahRooms =
          (pkg.hotelMadinahDouble || 0) +
          (pkg.hotelMadinahTriple || 0) +
          (pkg.hotelMadinahQuad || 0) +
          (pkg.hotelMadinahQuint || 0);

        return {
          ...pkg,
          bookedSeats,
          remainingSeats,
          daysUntilDeparture,
          airlinePaymentTotal,
          airlinePaymentStatus,
          hotelMakkahRooms,
          hotelMadinahRooms,
        };
      });

    const totalResult = await db
      .select({ count: count() })
      .from(packages)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    const allPackagesForStats = await db.query.packages.findMany({
      where: eq(packages.isActive, true),
    });

    let totalSeatsAll = 0;
    let bookedSeatsAll = 0;

    const statsPackageIds = allPackagesForStats.map((pkg) => pkg.id);
    const summaryBookedSeatsByPackageId =
      await getBookedSeatsByPackageIds(statsPackageIds);

    for (const pkg of allPackagesForStats) {
      totalSeatsAll += pkg.totalSeats;
      bookedSeatsAll += summaryBookedSeatsByPackageId.get(pkg.id) || 0;
    }

    return successResponse(res, {
      packages: packagesWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      summary: {
        totalSeats: totalSeatsAll,
        bookedSeats: bookedSeatsAll,
        remainingSeats: totalSeatsAll - bookedSeatsAll,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET PACKAGE BY ID
// =====================================================
export const getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const packageData = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
      with: {
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
        departureAirport: true,
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
        },
      },
    });

    if (!packageData) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    const bookedSeats = await getBookedSeats(packageData.id);
    const remainingSeats = packageData.totalSeats - bookedSeats;
    const daysUntilDeparture = getDaysUntilDeparture(packageData.departureDate);

    return successResponse(res, {
      ...packageData,
      bookedSeats,
      remainingSeats,
      daysUntilDeparture,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE PACKAGE
// =====================================================
export const createPackage = async (req, res, next) => {
  try {
    const data = req.body;

    const code = await generatePackageCode();

    const departureDate = new Date(data.departureDate);
    const returnDate = new Date(data.returnDate);
    const duration = Math.ceil(
      (returnDate - departureDate) / (1000 * 60 * 60 * 24),
    );

    const itineraryPdf = req.uploadedFile ? req.uploadedFile.path : null;

    const insertData = {
      code,
      name: data.name,
      description: data.description || null,
      type: data.type || "REGULER",
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      duration,
      price: data.price ? parseFloat(data.price).toFixed(2) : "0.00",
      discountPrice: data.discountPrice
        ? parseFloat(data.discountPrice).toFixed(2)
        : null,
      totalSeats: parseInt(data.totalSeats) || 45,
      facilities: data.facilities || null,
      notes: data.notes || null,
      itineraryPdf,
      airlineId: data.airlineId ? parseInt(data.airlineId) : null,
      airlineStatus: data.airlineStatus || "PLANNING",
      airlineIssuedDate: data.airlineIssuedDate || null,
      airlineTermin1Amount: data.airlineTermin1Amount
        ? parseFloat(data.airlineTermin1Amount).toFixed(2)
        : "0.00",
      airlineTermin1Date: data.airlineTermin1Date || null,
      airlineTermin1Status: data.airlineTermin1Status || "UNPAID",
      airlineTermin2Amount: data.airlineTermin2Amount
        ? parseFloat(data.airlineTermin2Amount).toFixed(2)
        : "0.00",
      airlineTermin2Date: data.airlineTermin2Date || null,
      airlineTermin2Status: data.airlineTermin2Status || "UNPAID",
      hotelMakkahId: data.hotelMakkahId ? parseInt(data.hotelMakkahId) : null,
      hotelMakkahStatus: data.hotelMakkahStatus || "PLANNING",
      hotelMakkahDouble: parseInt(data.hotelMakkahDouble) || 0,
      hotelMakkahTriple: parseInt(data.hotelMakkahTriple) || 0,
      hotelMakkahQuad: parseInt(data.hotelMakkahQuad) || 0,
      hotelMakkahQuint: parseInt(data.hotelMakkahQuint) || 0,
      hotelMadinahId: data.hotelMadinahId
        ? parseInt(data.hotelMadinahId)
        : null,
      hotelMadinahStatus: data.hotelMadinahStatus || "PLANNING",
      hotelMadinahDouble: parseInt(data.hotelMadinahDouble) || 0,
      hotelMadinahTriple: parseInt(data.hotelMadinahTriple) || 0,
      hotelMadinahQuad: parseInt(data.hotelMadinahQuad) || 0,
      hotelMadinahQuint: parseInt(data.hotelMadinahQuint) || 0,
      departureAirportId: data.departureAirportId
        ? parseInt(data.departureAirportId)
        : null,
      isActive: data.isActive !== false,
      isPublished: data.isPublished === true,
    };

    console.log("✅ INSERT DATA:", JSON.stringify(insertData, null, 2));

    const [newPackage] = await db
      .insert(packages)
      .values(insertData)
      .$returningId();

    const packageId = newPackage.id;

    if (data.images && data.images.length > 0) {
      const imageValues = data.images.map((img, index) => ({
        packageId,
        imageUrl: img.url,
        caption: img.caption || null,
        sortOrder: index,
        isPrimary: index === 0,
      }));

      await db.insert(packageImages).values(imageValues);
    }

    const createdPackage = await db.query.packages.findFirst({
      where: eq(packages.id, packageId),
      with: {
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
        departureAirport: true,
        images: true,
      },
    });

    // ✅ SYNC KE CALENDAR
    console.log("📅 Syncing new package to calendar...");
    await syncPackageEvent(createdPackage);

    return createdResponse(res, createdPackage, "Paket berhasil dibuat");
  } catch (error) {
    console.error("❌ CREATE PACKAGE ERROR:", error);
    console.error("❌ SQL MESSAGE:", error.sqlMessage);
    next(error);
  }
};

// =====================================================
// UPDATE PACKAGE
// =====================================================
export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log("📥 UPDATE REQUEST:", { id, body: data });

    const existingPackage = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
    });

    if (!existingPackage) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    let duration = existingPackage.duration;
    if (data.departureDate && data.returnDate) {
      const departureDate = new Date(data.departureDate);
      const returnDate = new Date(data.returnDate);
      duration = Math.ceil(
        (returnDate - departureDate) / (1000 * 60 * 60 * 24),
      );
    }

    let itineraryPdf = existingPackage.itineraryPdf;
    if (req.uploadedFile) {
      if (existingPackage.itineraryPdf) {
        const oldPdfPath = getUploadAbsolutePath(existingPackage.itineraryPdf);
        if (oldPdfPath && fs.existsSync(oldPdfPath)) {
          fs.unlinkSync(oldPdfPath);
        }
      }
      itineraryPdf = req.uploadedFile.path;
    }

    const updateData = {
      name: data.name ?? existingPackage.name,
      description: data.description ?? existingPackage.description,
      type: data.type ?? existingPackage.type,
      departureDate: data.departureDate ?? existingPackage.departureDate,
      returnDate: data.returnDate ?? existingPackage.returnDate,
      duration,
      price: data.price
        ? parseFloat(data.price).toFixed(2)
        : existingPackage.price,
      discountPrice: data.discountPrice
        ? parseFloat(data.discountPrice).toFixed(2)
        : existingPackage.discountPrice,
      totalSeats: data.totalSeats
        ? parseInt(data.totalSeats)
        : existingPackage.totalSeats,
      facilities: data.facilities ?? existingPackage.facilities,
      notes: data.notes ?? existingPackage.notes,
      itineraryPdf,
      airlineId: data.airlineId
        ? parseInt(data.airlineId)
        : existingPackage.airlineId,
      airlineStatus: data.airlineStatus ?? existingPackage.airlineStatus,
      airlineIssuedDate:
        data.airlineIssuedDate ?? existingPackage.airlineIssuedDate,
      airlineTermin1Amount: data.airlineTermin1Amount
        ? parseFloat(data.airlineTermin1Amount).toFixed(2)
        : existingPackage.airlineTermin1Amount,
      airlineTermin1Date:
        data.airlineTermin1Date ?? existingPackage.airlineTermin1Date,
      airlineTermin1Status:
        data.airlineTermin1Status ?? existingPackage.airlineTermin1Status,
      airlineTermin2Amount: data.airlineTermin2Amount
        ? parseFloat(data.airlineTermin2Amount).toFixed(2)
        : existingPackage.airlineTermin2Amount,
      airlineTermin2Date:
        data.airlineTermin2Date ?? existingPackage.airlineTermin2Date,
      airlineTermin2Status:
        data.airlineTermin2Status ?? existingPackage.airlineTermin2Status,
      hotelMakkahId: data.hotelMakkahId
        ? parseInt(data.hotelMakkahId)
        : existingPackage.hotelMakkahId,
      hotelMakkahStatus:
        data.hotelMakkahStatus ?? existingPackage.hotelMakkahStatus,
      hotelMakkahDouble:
        data.hotelMakkahDouble !== undefined
          ? parseInt(data.hotelMakkahDouble)
          : existingPackage.hotelMakkahDouble,
      hotelMakkahTriple:
        data.hotelMakkahTriple !== undefined
          ? parseInt(data.hotelMakkahTriple)
          : existingPackage.hotelMakkahTriple,
      hotelMakkahQuad:
        data.hotelMakkahQuad !== undefined
          ? parseInt(data.hotelMakkahQuad)
          : existingPackage.hotelMakkahQuad,
      hotelMakkahQuint:
        data.hotelMakkahQuint !== undefined
          ? parseInt(data.hotelMakkahQuint)
          : existingPackage.hotelMakkahQuint,
      hotelMadinahId: data.hotelMadinahId
        ? parseInt(data.hotelMadinahId)
        : existingPackage.hotelMadinahId,
      hotelMadinahStatus:
        data.hotelMadinahStatus ?? existingPackage.hotelMadinahStatus,
      hotelMadinahDouble:
        data.hotelMadinahDouble !== undefined
          ? parseInt(data.hotelMadinahDouble)
          : existingPackage.hotelMadinahDouble,
      hotelMadinahTriple:
        data.hotelMadinahTriple !== undefined
          ? parseInt(data.hotelMadinahTriple)
          : existingPackage.hotelMadinahTriple,
      hotelMadinahQuad:
        data.hotelMadinahQuad !== undefined
          ? parseInt(data.hotelMadinahQuad)
          : existingPackage.hotelMadinahQuad,
      hotelMadinahQuint:
        data.hotelMadinahQuint !== undefined
          ? parseInt(data.hotelMadinahQuint)
          : existingPackage.hotelMadinahQuint,
      departureAirportId: data.departureAirportId
        ? parseInt(data.departureAirportId)
        : existingPackage.departureAirportId,
      isActive:
        data.isActive !== undefined
          ? data.isActive === true || data.isActive === "true"
          : existingPackage.isActive,
      isPublished:
        data.isPublished !== undefined
          ? data.isPublished === true || data.isPublished === "true"
          : existingPackage.isPublished,
      updatedAt: new Date(),
    };

    console.log("✅ EXECUTING UPDATE WITH DATA:", updateData);

    await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, parseInt(id)));

    const updatedPackage = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
      with: {
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
        departureAirport: true,
        images: true,
      },
    });

    // ✅ SYNC KE CALENDAR
    console.log("📅 Syncing updated package to calendar...");
    await syncPackageEvent(updatedPackage);

    return successResponse(res, updatedPackage, "Paket berhasil diupdate");
  } catch (error) {
    console.error("❌ UPDATE PACKAGE ERROR:", error);
    console.error("❌ SQL MESSAGE:", error.sqlMessage);
    next(error);
  }
};

// =====================================================
// UPLOAD ITINERARY PDF
// =====================================================
export const uploadItineraryPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.uploadedFile) {
      return errorResponse(res, "File PDF harus diupload", 400);
    }

    const existingPackage = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
    });

    if (!existingPackage) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    if (existingPackage.itineraryPdf) {
      const oldPdfPath = getUploadAbsolutePath(existingPackage.itineraryPdf);
      if (oldPdfPath && fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath);
      }
    }

    await db
      .update(packages)
      .set({
        itineraryPdf: req.uploadedFile.path,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, parseInt(id)));

    return successResponse(
      res,
      {
        path: req.uploadedFile.path,
        filename: req.uploadedFile.filename,
      },
      "PDF Itinerary berhasil diupload",
    );
  } catch (error) {
    console.error("❌ UPLOAD PDF ERROR:", error);
    next(error);
  }
};

// =====================================================
// DELETE ITINERARY PDF
// =====================================================
export const deleteItineraryPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPackage = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
    });

    if (!existingPackage) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    if (!existingPackage.itineraryPdf) {
      return errorResponse(res, "Tidak ada PDF untuk dihapus", 404);
    }

    const pdfPath = getUploadAbsolutePath(existingPackage.itineraryPdf);

    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    await db
      .update(packages)
      .set({
        itineraryPdf: null,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, parseInt(id)));

    return successResponse(res, null, "PDF Itinerary berhasil dihapus");
  } catch (error) {
    console.error("❌ DELETE PDF ERROR:", error);
    next(error);
  }
};

// =====================================================
// DELETE PACKAGE
// =====================================================
export const deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jamaahCount = await getBookedSeats(parseInt(id));
    if (jamaahCount > 0) {
      return errorResponse(
        res,
        `Tidak dapat menghapus paket karena sudah ada ${jamaahCount} jamaah terdaftar`,
        400,
      );
    }

    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(id)),
      with: {
        images: true,
      },
    });

    if (!pkg) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    // ✅ DELETE CALENDAR EVENTS
    console.log("📅 Deleting calendar events for package...");
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.packageId, parseInt(id)));

    if (pkg.itineraryPdf) {
      const pdfPath = getUploadAbsolutePath(pkg.itineraryPdf);
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    if (pkg.images && pkg.images.length > 0) {
      for (const img of pkg.images) {
        const imagePath = getUploadAbsolutePath(img.imageUrl);
        if (imagePath && fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await db
      .delete(packageImages)
      .where(eq(packageImages.packageId, parseInt(id)));

    await db.delete(packages).where(eq(packages.id, parseInt(id)));

    return successResponse(res, null, "Paket berhasil dihapus");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXPORT PACKAGES TO EXCEL
// =====================================================
export const exportPackages = async (req, res, next) => {
  try {
    const allPackages = await db.query.packages.findMany({
      orderBy: [desc(packages.departureDate)],
      with: {
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
        departureAirport: true,
      },
    });

    const packagesData = await Promise.all(
      allPackages.map(async (pkg) => {
        const bookedSeats = await getBookedSeats(pkg.id);
        const remainingSeats = pkg.totalSeats - bookedSeats;
        const daysUntilDeparture = getDaysUntilDeparture(pkg.departureDate);

        const airlineTermin1 = parseFloat(pkg.airlineTermin1Amount) || 0;
        const airlineTermin2 = parseFloat(pkg.airlineTermin2Amount) || 0;
        const airlinePaymentTotal = airlineTermin1 + airlineTermin2;

        return {
          ID: pkg.id,
          Kode: pkg.code,
          "Nama Paket": pkg.name,
          Tipe: pkg.type,
          "Tgl Berangkat": pkg.departureDate,
          "Tgl Pulang": pkg.returnDate,
          "Durasi (Hari)": pkg.duration,
          Harga: parseFloat(pkg.price),
          "Harga Diskon": pkg.discountPrice
            ? parseFloat(pkg.discountPrice)
            : "",
          "Total Seat": pkg.totalSeats,
          "Seat Terisi": bookedSeats,
          "Sisa Seat": remainingSeats,
          "H-Berangkat": daysUntilDeparture,
          Maskapai: pkg.airline?.name || "",
          "Status Maskapai": pkg.airlineStatus,
          "Tgl Issued": pkg.airlineIssuedDate || "",
          "Termin 1": airlineTermin1,
          "Tgl Termin 1": pkg.airlineTermin1Date || "",
          "Status Termin 1": pkg.airlineTermin1Status,
          "Termin 2": airlineTermin2,
          "Tgl Termin 2": pkg.airlineTermin2Date || "",
          "Status Termin 2": pkg.airlineTermin2Status,
          "Total Pembayaran Maskapai": airlinePaymentTotal,
          "Hotel Makkah": pkg.hotelMakkah?.name || "",
          "Status Hotel Makkah": pkg.hotelMakkahStatus,
          "Makkah - Double": pkg.hotelMakkahDouble,
          "Makkah - Triple": pkg.hotelMakkahTriple,
          "Makkah - Quad": pkg.hotelMakkahQuad,
          "Makkah - Quint": pkg.hotelMakkahQuint,
          "Hotel Madinah": pkg.hotelMadinah?.name || "",
          "Status Hotel Madinah": pkg.hotelMadinahStatus,
          "Madinah - Double": pkg.hotelMadinahDouble,
          "Madinah - Triple": pkg.hotelMadinahTriple,
          "Madinah - Quad": pkg.hotelMadinahQuad,
          "Madinah - Quint": pkg.hotelMadinahQuint,
          Bandara: pkg.departureAirport?.name || "",
          Fasilitas: pkg.facilities || "",
          Keterangan: pkg.notes || "",
          "Status Aktif": pkg.isActive ? "Ya" : "Tidak",
          Published: pkg.isPublished ? "Ya" : "Tidak",
        };
      }),
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(packagesData);

    XLSX.utils.book_append_sheet(wb, ws, "Packages");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=packages-${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// IMPORT PACKAGES FROM EXCEL
// =====================================================
export const importPackages = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, "File Excel harus diupload", 400);
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return errorResponse(res, "File Excel kosong", 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const row of data) {
      try {
        const code = await generatePackageCode();

        const departureDate = new Date(row["Tgl Berangkat"]);
        const returnDate = new Date(row["Tgl Pulang"]);
        const duration = Math.ceil(
          (returnDate - departureDate) / (1000 * 60 * 60 * 24),
        );

        await db.insert(packages).values({
          code,
          name: row["Nama Paket"],
          type: row["Tipe"] || "REGULER",
          departureDate: row["Tgl Berangkat"],
          returnDate: row["Tgl Pulang"],
          duration,
          price: row["Harga"] || 0,
          discountPrice: row["Harga Diskon"] || null,
          totalSeats: row["Total Seat"] || 45,
          facilities: row["Fasilitas"] || null,
          notes: row["Keterangan"] || null,
          isActive: row["Status Aktif"] === "Ya",
          isPublished: row["Published"] === "Ya",
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: row["Nama Paket"] || "Unknown",
          error: err.message,
        });
      }
    }

    return successResponse(
      res,
      results,
      `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPLOAD PACKAGE IMAGE
// =====================================================
export const uploadPackageImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.uploadedFile) {
      return errorResponse(res, "Gambar harus diupload", 400);
    }

    const existingImages = await db.query.packageImages.findMany({
      where: eq(packageImages.packageId, parseInt(id)),
    });

    const maxSortOrder =
      existingImages.length > 0
        ? Math.max(...existingImages.map((img) => img.sortOrder))
        : -1;

    const [newImage] = await db
      .insert(packageImages)
      .values({
        packageId: parseInt(id),
        imageUrl: req.uploadedFile.path,
        sortOrder: maxSortOrder + 1,
        isPrimary: existingImages.length === 0,
      })
      .$returningId();

    return createdResponse(
      res,
      {
        id: newImage.id,
        url: req.uploadedFile.path,
      },
      "Gambar berhasil diupload",
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE PACKAGE IMAGE
// =====================================================
export const deletePackageImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;

    const [image] = await db
      .select()
      .from(packageImages)
      .where(eq(packageImages.id, parseInt(imageId)))
      .limit(1);

    if (!image) {
      return errorResponse(res, "Gambar tidak ditemukan", 404);
    }

    const imagePath = getUploadAbsolutePath(image.imageUrl);
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await db
      .delete(packageImages)
      .where(eq(packageImages.id, parseInt(imageId)));

    return successResponse(res, null, "Gambar berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
