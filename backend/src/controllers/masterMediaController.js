import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  masterAirlineImages,
  masterAirlines,
  masterHotelImages,
  masterHotels,
} from "../db/schema.js";
import { deleteFile } from "../utils/upload.js";
import { createdResponse, errorResponse, successResponse } from "../utils/response.js";

const MAX_IMAGES_PER_MASTER = 20;

const mediaConfig = {
  hotel: {
    masterTable: masterHotels,
    imageTable: masterHotelImages,
    foreignKey: masterHotelImages.hotelId,
    masterField: "hotelId",
    label: "Hotel",
  },
  airline: {
    masterTable: masterAirlines,
    imageTable: masterAirlineImages,
    foreignKey: masterAirlineImages.airlineId,
    masterField: "airlineId",
    label: "Maskapai",
  },
};

const parsePositiveId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const uploadMasterImages = (kind) => async (req, res, next) => {
  try {
    const config = mediaConfig[kind];
    const masterId = parsePositiveId(req.params.id);
    if (!config || !masterId) return errorResponse(res, "ID data master tidak valid", 400);

    const [master] = await db
      .select({ id: config.masterTable.id })
      .from(config.masterTable)
      .where(eq(config.masterTable.id, masterId))
      .limit(1);
    if (!master) return errorResponse(res, `${config.label} tidak ditemukan`, 404);

    const files = req.uploadedFiles || [];
    if (!files.length) return errorResponse(res, "Pilih minimal satu gambar", 400);

    const current = await db
      .select({ id: config.imageTable.id })
      .from(config.imageTable)
      .where(eq(config.foreignKey, masterId));
    if (current.length + files.length > MAX_IMAGES_PER_MASTER) {
      await Promise.all(files.map((file) => deleteFile(file.path)));
      return errorResponse(
        res,
        `Maksimal ${MAX_IMAGES_PER_MASTER} gambar untuk setiap ${config.label.toLowerCase()}`,
        400,
      );
    }

    await db.insert(config.imageTable).values(
      files.map((file, index) => ({
        [config.masterField]: masterId,
        imageUrl: file.path,
        sortOrder: current.length + index,
      })),
    );

    const images = await db
      .select()
      .from(config.imageTable)
      .where(eq(config.foreignKey, masterId))
      .orderBy(asc(config.imageTable.sortOrder), asc(config.imageTable.id));
    return createdResponse(res, images, "Galeri gambar berhasil ditambahkan");
  } catch (error) {
    await Promise.all((req.uploadedFiles || []).map((file) => deleteFile(file.path)));
    next(error);
  }
};

export const deleteMasterImage = (kind) => async (req, res, next) => {
  try {
    const config = mediaConfig[kind];
    const imageId = parsePositiveId(req.params.imageId);
    if (!config || !imageId) return errorResponse(res, "ID gambar tidak valid", 400);

    const [image] = await db
      .select()
      .from(config.imageTable)
      .where(eq(config.imageTable.id, imageId))
      .limit(1);
    if (!image) return errorResponse(res, "Gambar tidak ditemukan", 404);

    await db.delete(config.imageTable).where(eq(config.imageTable.id, imageId));
    await deleteFile(image.imageUrl);
    return successResponse(res, null, "Gambar berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
