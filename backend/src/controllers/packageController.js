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
import { logger } from "../utils/logger.js";

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

const PACKAGE_TYPES = new Set([
  "FULL_SERVICE",
  "EXTREME",
  "SEMI_MANDIRI",
  "FLEKSIBILITAS",
  "KONSORSIUM",
  "LA",
]);

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseOptionalForeignKey = (value, fallback = null) => {
  if (value === undefined) return fallback;
  if (value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const parseDecimalString = (value, fallback = "0.00") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed.toFixed(2);
};

const parseBoolean = (value, fallback) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const normalizePackageType = (value) => {
  const candidate = String(value || "FULL_SERVICE").trim().toUpperCase();
  return PACKAGE_TYPES.has(candidate) ? candidate : null;
};

const validatePackagePayload = (data = {}, isUpdate = false) => {
  const errors = [];

  const type = data.type !== undefined ? normalizePackageType(data.type) : undefined;
  if (data.type !== undefined && !type) {
    errors.push("Tipe paket tidak valid");
  }

  if (!isUpdate && (!data.name || String(data.name).trim().length < 3)) {
    errors.push("Nama paket minimal 3 karakter");
  }

  if (!isUpdate && !data.departureDate) {
    errors.push("Tanggal berangkat wajib diisi");
  }

  if (!isUpdate && !data.returnDate) {
    errors.push("Tanggal pulang wajib diisi");
  }

  if (data.departureDate || data.returnDate) {
    const departureDate = new Date(data.departureDate);
    const returnDate = new Date(data.returnDate);
    if (Number.isNaN(departureDate.getTime()) || Number.isNaN(returnDate.getTime())) {
      errors.push("Format tanggal paket tidak valid");
    } else if (returnDate < departureDate) {
      errors.push("Tanggal pulang tidak boleh lebih awal dari tanggal berangkat");
    }
  }

  const numericFields = [
    "price",
    "discountPrice",
    "priceDouble",
    "priceTriple",
    "priceQuad",
    "priceQuint",
    "airlineTermin1Amount",
    "airlineTermin2Amount",
  ];

  for (const field of numericFields) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed)) {
        errors.push(`${field} harus berupa angka`);
      }
    }
  }

  return {
    errors,
    normalizedType: type,
  };
};

const removeFileIfExists = async (absolutePath) => {
  if (!absolutePath) return;
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      logger.warn("Failed deleting uploaded file", { path: absolutePath, error: error?.message });
    }
  }
};

const isDuplicateCodeError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return Number(error?.errno) === 1062 || message.includes("duplicate") || message.includes("unique");
};

const withGeneratedPackageCodeRetry = async (createWithCode, maxAttempts = 5) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const code = await generatePackageCode();
    try {
      return await createWithCode(code);
    } catch (error) {
      if (!isDuplicateCodeError(error) || attempt === maxAttempts) {
        throw error;
      }
      lastError = error;
      logger.warn("Package code collision detected, retrying", { attempt, code });
    }
  }

  throw lastError;
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
    const { search, type, isActive, isPublished, page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

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
    if (isPublished !== undefined) {
      conditions.push(eq(packages.isPublished, isPublished === "true"));
    }

    const allPackages = await db.query.packages.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(packages.departureDate)],
      limit: parsedLimit,
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
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
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

    const validation = validatePackagePayload(data, false);
    if (validation.errors.length > 0) {
      return errorResponse(res, validation.errors.join(", "), 400);
    }

    const departureDate = new Date(data.departureDate);
    const returnDate = new Date(data.returnDate);
    const duration = Math.ceil(
      (returnDate - departureDate) / (1000 * 60 * 60 * 24),
    );

    const itineraryPdf = req.uploadedFile ? req.uploadedFile.path : null;

    const baseInsertData = {
      name: data.name,
      description: data.description || null,
      type: validation.normalizedType || "FULL_SERVICE",
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      duration,
      price: parseDecimalString(data.price, "0.00"),
      discountPrice: parseDecimalString(data.discountPrice, null),
      priceDouble: parseDecimalString(data.priceDouble, "0.00"),
      priceTriple: parseDecimalString(data.priceTriple, "0.00"),
      priceQuad: parseDecimalString(data.priceQuad, "0.00"),
      priceQuint: parseDecimalString(data.priceQuint, "0.00"),
      totalSeats: parsePositiveInt(data.totalSeats, 45),
      facilities: data.facilities || null,
      excludedFacilities: data.excludedFacilities || null,
      notes: data.notes || null,
      itineraryPdf,
      airlineId: parseOptionalForeignKey(data.airlineId, null),
      airlineStatus: data.airlineStatus || "PLANNING",
      airlineIssuedDate: data.airlineIssuedDate || null,
      airlineTermin1Amount: parseDecimalString(data.airlineTermin1Amount, "0.00"),
      airlineTermin1Date: data.airlineTermin1Date || null,
      airlineTermin1Status: data.airlineTermin1Status || "UNPAID",
      airlineTermin2Amount: parseDecimalString(data.airlineTermin2Amount, "0.00"),
      airlineTermin2Date: data.airlineTermin2Date || null,
      airlineTermin2Status: data.airlineTermin2Status || "UNPAID",
      hotelMakkahId: parseOptionalForeignKey(data.hotelMakkahId, null),
      hotelMakkahStatus: data.hotelMakkahStatus || "PLANNING",
      hotelMakkahDouble: parsePositiveInt(data.hotelMakkahDouble, 0),
      hotelMakkahTriple: parsePositiveInt(data.hotelMakkahTriple, 0),
      hotelMakkahQuad: parsePositiveInt(data.hotelMakkahQuad, 0),
      hotelMakkahQuint: parsePositiveInt(data.hotelMakkahQuint, 0),
      hotelMadinahId: parseOptionalForeignKey(data.hotelMadinahId, null),
      hotelMadinahStatus: data.hotelMadinahStatus || "PLANNING",
      hotelMadinahDouble: parsePositiveInt(data.hotelMadinahDouble, 0),
      hotelMadinahTriple: parsePositiveInt(data.hotelMadinahTriple, 0),
      hotelMadinahQuad: parsePositiveInt(data.hotelMadinahQuad, 0),
      hotelMadinahQuint: parsePositiveInt(data.hotelMadinahQuint, 0),
      departureAirportId: parseOptionalForeignKey(data.departureAirportId, null),
      isActive: parseBoolean(data.isActive, true),
      isPublished: parseBoolean(data.isPublished, false),
    };

    logger.debug("Create package insert", { hasImages: Boolean(data.images?.length) });

    const [newPackage] = await withGeneratedPackageCodeRetry(async (code) => {
      return db
        .insert(packages)
        .values({
          ...baseInsertData,
          code,
        })
        .$returningId();
    });

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
    logger.info("Syncing new package to calendar", { packageId });
    await syncPackageEvent(createdPackage);

    return createdResponse(res, createdPackage, "Paket berhasil dibuat");
  } catch (error) {
    logger.error("Create package error", error);
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

    const validation = validatePackagePayload(data, true);
    if (validation.errors.length > 0) {
      return errorResponse(res, validation.errors.join(", "), 400);
    }

    logger.debug("Update package request", { id });

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
        await removeFileIfExists(oldPdfPath);
      }
      itineraryPdf = req.uploadedFile.path;
    }

    const updateData = {
      name: data.name ?? existingPackage.name,
      description: data.description ?? existingPackage.description,
      type:
        validation.normalizedType !== undefined
          ? validation.normalizedType
          : existingPackage.type,
      departureDate: data.departureDate ?? existingPackage.departureDate,
      returnDate: data.returnDate ?? existingPackage.returnDate,
      duration,
      price:
        data.price !== undefined
          ? parseDecimalString(data.price, existingPackage.price)
          : existingPackage.price,
      discountPrice:
        data.discountPrice !== undefined
          ? parseDecimalString(data.discountPrice, existingPackage.discountPrice)
          : existingPackage.discountPrice,
      priceDouble:
        data.priceDouble !== undefined
          ? parseDecimalString(data.priceDouble, existingPackage.priceDouble)
          : existingPackage.priceDouble,
      priceTriple:
        data.priceTriple !== undefined
          ? parseDecimalString(data.priceTriple, existingPackage.priceTriple)
          : existingPackage.priceTriple,
      priceQuad:
        data.priceQuad !== undefined
          ? parseDecimalString(data.priceQuad, existingPackage.priceQuad)
          : existingPackage.priceQuad,
      priceQuint:
        data.priceQuint !== undefined
          ? parseDecimalString(data.priceQuint, existingPackage.priceQuint)
          : existingPackage.priceQuint,
      totalSeats:
        data.totalSeats !== undefined
          ? parsePositiveInt(data.totalSeats, existingPackage.totalSeats)
          : existingPackage.totalSeats,
      facilities: data.facilities ?? existingPackage.facilities,
      excludedFacilities:
        data.excludedFacilities ?? existingPackage.excludedFacilities,
      notes: data.notes ?? existingPackage.notes,
      itineraryPdf,
      airlineId: parseOptionalForeignKey(data.airlineId, existingPackage.airlineId),
      airlineStatus: data.airlineStatus ?? existingPackage.airlineStatus,
      airlineIssuedDate:
        data.airlineIssuedDate ?? existingPackage.airlineIssuedDate,
      airlineTermin1Amount:
        data.airlineTermin1Amount !== undefined
          ? parseDecimalString(
              data.airlineTermin1Amount,
              existingPackage.airlineTermin1Amount,
            )
          : existingPackage.airlineTermin1Amount,
      airlineTermin1Date:
        data.airlineTermin1Date ?? existingPackage.airlineTermin1Date,
      airlineTermin1Status:
        data.airlineTermin1Status ?? existingPackage.airlineTermin1Status,
      airlineTermin2Amount:
        data.airlineTermin2Amount !== undefined
          ? parseDecimalString(
              data.airlineTermin2Amount,
              existingPackage.airlineTermin2Amount,
            )
          : existingPackage.airlineTermin2Amount,
      airlineTermin2Date:
        data.airlineTermin2Date ?? existingPackage.airlineTermin2Date,
      airlineTermin2Status:
        data.airlineTermin2Status ?? existingPackage.airlineTermin2Status,
      hotelMakkahId: parseOptionalForeignKey(
        data.hotelMakkahId,
        existingPackage.hotelMakkahId,
      ),
      hotelMakkahStatus:
        data.hotelMakkahStatus ?? existingPackage.hotelMakkahStatus,
      hotelMakkahDouble:
        data.hotelMakkahDouble !== undefined
          ? parsePositiveInt(
              data.hotelMakkahDouble,
              existingPackage.hotelMakkahDouble,
            )
          : existingPackage.hotelMakkahDouble,
      hotelMakkahTriple:
        data.hotelMakkahTriple !== undefined
          ? parsePositiveInt(
              data.hotelMakkahTriple,
              existingPackage.hotelMakkahTriple,
            )
          : existingPackage.hotelMakkahTriple,
      hotelMakkahQuad:
        data.hotelMakkahQuad !== undefined
          ? parsePositiveInt(
              data.hotelMakkahQuad,
              existingPackage.hotelMakkahQuad,
            )
          : existingPackage.hotelMakkahQuad,
      hotelMakkahQuint:
        data.hotelMakkahQuint !== undefined
          ? parsePositiveInt(
              data.hotelMakkahQuint,
              existingPackage.hotelMakkahQuint,
            )
          : existingPackage.hotelMakkahQuint,
      hotelMadinahId: parseOptionalForeignKey(
        data.hotelMadinahId,
        existingPackage.hotelMadinahId,
      ),
      hotelMadinahStatus:
        data.hotelMadinahStatus ?? existingPackage.hotelMadinahStatus,
      hotelMadinahDouble:
        data.hotelMadinahDouble !== undefined
          ? parsePositiveInt(
              data.hotelMadinahDouble,
              existingPackage.hotelMadinahDouble,
            )
          : existingPackage.hotelMadinahDouble,
      hotelMadinahTriple:
        data.hotelMadinahTriple !== undefined
          ? parsePositiveInt(
              data.hotelMadinahTriple,
              existingPackage.hotelMadinahTriple,
            )
          : existingPackage.hotelMadinahTriple,
      hotelMadinahQuad:
        data.hotelMadinahQuad !== undefined
          ? parsePositiveInt(
              data.hotelMadinahQuad,
              existingPackage.hotelMadinahQuad,
            )
          : existingPackage.hotelMadinahQuad,
      hotelMadinahQuint:
        data.hotelMadinahQuint !== undefined
          ? parsePositiveInt(
              data.hotelMadinahQuint,
              existingPackage.hotelMadinahQuint,
            )
          : existingPackage.hotelMadinahQuint,
      departureAirportId: parseOptionalForeignKey(
        data.departureAirportId,
        existingPackage.departureAirportId,
      ),
      isActive: parseBoolean(data.isActive, existingPackage.isActive),
      isPublished: parseBoolean(data.isPublished, existingPackage.isPublished),
      updatedAt: new Date(),
    };

    logger.debug("Executing package update", { id: parseInt(id, 10) });

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
    logger.info("Syncing updated package to calendar", { packageId: parseInt(id, 10) });
    await syncPackageEvent(updatedPackage);

    return successResponse(res, updatedPackage, "Paket berhasil diupdate");
  } catch (error) {
    logger.error("Update package error", error);
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
      await removeFileIfExists(oldPdfPath);
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
    logger.error("Upload itinerary PDF error", error);
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

    await removeFileIfExists(pdfPath);

    await db
      .update(packages)
      .set({
        itineraryPdf: null,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, parseInt(id)));

    return successResponse(res, null, "PDF Itinerary berhasil dihapus");
  } catch (error) {
    logger.error("Delete itinerary PDF error", error);
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
    logger.info("Deleting package calendar events", { packageId: parseInt(id, 10) });
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.packageId, parseInt(id)));

    if (pkg.itineraryPdf) {
      const pdfPath = getUploadAbsolutePath(pkg.itineraryPdf);
      await removeFileIfExists(pdfPath);
    }

    if (pkg.images && pkg.images.length > 0) {
      for (const img of pkg.images) {
        const imagePath = getUploadAbsolutePath(img.imageUrl);
        await removeFileIfExists(imagePath);
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
          "Tidak Termasuk": pkg.excludedFacilities || "",
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
      `attachment; filename=packages-${new Date().toISOString().split("T")[0]
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
        const departureDate = new Date(row["Tgl Berangkat"]);
        const returnDate = new Date(row["Tgl Pulang"]);
        const duration = Math.ceil(
          (returnDate - departureDate) / (1000 * 60 * 60 * 24),
        );

        await withGeneratedPackageCodeRetry(async (code) => {
          return db.insert(packages).values({
            code,
            name: row["Nama Paket"],
            type: normalizePackageType(row["Tipe"]) || "FULL_SERVICE",
            departureDate: row["Tgl Berangkat"],
            returnDate: row["Tgl Pulang"],
            duration,
            price: row["Harga"] || 0,
            discountPrice: row["Harga Diskon"] || null,
            totalSeats: row["Total Seat"] || 45,
            facilities: row["Fasilitas"] || null,
            excludedFacilities: row["Tidak Termasuk"] || null,
            notes: row["Keterangan"] || null,
            isActive: row["Status Aktif"] === "Ya",
            isPublished: row["Published"] === "Ya",
          });
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
// DELETE PACKAGE IMAGE
// =====================================================
export const deletePackageImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const parsedImageId = parseInt(imageId, 10);

    const image = await db.query.packageImages.findFirst({
      where: eq(packageImages.id, parsedImageId),
    });

    if (!image) {
      return errorResponse(res, "Gambar tidak ditemukan", 404);
    }

    const imagePath = getUploadAbsolutePath(image.imageUrl);
    await removeFileIfExists(imagePath);

    await db.delete(packageImages).where(eq(packageImages.id, parsedImageId));

    return successResponse(res, null, "Gambar berhasil dihapus");
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
// BULK UPLOAD PACKAGE IMAGES
// =====================================================
export const bulkUploadPackageImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return errorResponse(res, "Tidak ada gambar yang diupload", 400);
    }

    const existingImages = await db.query.packageImages.findMany({
      where: eq(packageImages.packageId, parseInt(id, 10)),
    });
    const maxSortOrder =
      existingImages.length > 0
        ? Math.max(...existingImages.map((img) => img.sortOrder))
        : -1;

    const imageValues = req.uploadedFiles.map((file, index) => ({
      packageId: parseInt(id, 10),
      imageUrl: file.path,
      caption: null,
      sortOrder: maxSortOrder + index + 1,
      isPrimary: existingImages.length === 0 && index === 0,
    }));

    await db.insert(packageImages).values(imageValues);

    return createdResponse(
      res,
      req.uploadedFiles.map((file) => ({
        url: file.path,
        filename: file.filename,
      })),
      `${req.uploadedFiles.length} gambar berhasil diupload`,
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PUBLIC PACKAGE ENDPOINTS
// =====================================================
export const getPublicPackages = async (req, res, next) => {
  const reqWithPublicFilters = {
    ...req,
    query: {
      ...req.query,
      isActive: "true",
    },
  };

  return getAllPackages(reqWithPublicFilters, res, next);
};

export const getPublicPackageById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const packageData = await db.query.packages.findFirst({
      where: and(eq(packages.id, id), eq(packages.isActive, true), eq(packages.isPublished, true)),
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
