import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { concurrentMutation } from "../utils/concurrentMutation.js";
export const createPackageScheduleList = concurrentMutation(createPackageScheduleListHandler);
import { db } from "../db/index.js";
import {
  masterAirlines,
  masterAirports,
  masterHotels,
  packageScheduleItems,
  packageScheduleLists,
} from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";

const VALID_STATUSES = new Set(["CHECK_SEAT", "SOLD_OUT", "CLOSED"]);
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const boolValue = (value, fallback) =>
  value === undefined ? fallback : value === true || String(value) === "true";

const nullableId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const money = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : null;
};

const dateKey = (value) => {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return "";
};

export const getEffectiveScheduleStatus = (status, departureDate, now = new Date()) => {
  if (status !== "CHECK_SEAT") return status;
  const departure = new Date(`${dateKey(departureDate)}T00:00:00+07:00`);
  if (Number.isNaN(departure.getTime())) return status;
  const closeAt = new Date(departure);
  closeAt.setDate(closeAt.getDate() - 7);
  return now >= closeAt ? "CLOSED" : status;
};

const resolveJedAirportId = async (executor = db) => {
  const [airport] = await executor
    .select({ id: masterAirports.id })
    .from(masterAirports)
    .where(eq(masterAirports.code, "JED"))
    .limit(1);
  if (!airport) throw new Error("Master bandara JED belum tersedia");
  return airport.id;
};

const parseListPayload = async (body, existing = {}, executor = db) => {
  const name = String(body.name ?? existing.name ?? "").trim();
  const month = String(body.month ?? existing.month ?? "").trim();
  if (!name || !MONTH_PATTERN.test(month)) {
    return { error: "Nama dan bulan jadwal wajib diisi dengan benar" };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: "Minimal satu jadwal keberangkatan wajib diisi" };
  }

  const defaultAirportId = await resolveJedAirportId(executor);
  const items = [];
  for (let index = 0; index < body.items.length; index += 1) {
    const item = body.items[index] || {};
    const departureDate = dateKey(item.departureDate);
    const airlineId = nullableId(item.airlineId);
    const priceQuad = money(item.priceQuad);
    const priceTriple = money(item.priceTriple);
    const priceDouble = money(item.priceDouble);
    const hotelMakkahLabel = String(item.hotelMakkahLabel || "").trim();
    const hotelMadinahLabel = String(item.hotelMadinahLabel || "").trim();
    const status = VALID_STATUSES.has(item.status) ? item.status : "CHECK_SEAT";
    const duration = item.duration === "" || item.duration == null
      ? null
      : Number.parseInt(item.duration, 10);

    if (
      !DATE_PATTERN.test(departureDate) ||
      !airlineId ||
      !hotelMakkahLabel ||
      !hotelMadinahLabel ||
      priceQuad === null ||
      priceTriple === null ||
      priceDouble === null ||
      (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 60))
    ) {
      return { error: `Data jadwal baris ${index + 1} belum lengkap atau tidak valid` };
    }

    items.push({
      departureDate,
      duration,
      airlineId,
      arrivalAirportId: nullableId(item.arrivalAirportId) || defaultAirportId,
      returnAirportId: nullableId(item.returnAirportId) || defaultAirportId,
      hotelMakkahLabel,
      hotelMadinahLabel,
      hotelMakkahId: nullableId(item.hotelMakkahId),
      hotelMadinahId: nullableId(item.hotelMadinahId),
      priceQuad,
      priceTriple,
      priceDouble,
      note: String(item.note || "").trim() || null,
      status,
      sortOrder: Number.isInteger(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
    });
  }

  return {
    list: {
      name,
      month,
      subtitle: String(body.subtitle ?? existing.subtitle ?? "").trim() || null,
      note: String(body.note ?? existing.note ?? "").trim() || null,
      isActive: boolValue(body.isActive, existing.isActive ?? true),
      isPublished: boolValue(body.isPublished, existing.isPublished ?? false),
    },
    items,
  };
};

const hydrateLists = async (lists) => {
  if (!lists.length) return [];
  const listIds = lists.map((list) => list.id);
  const items = await db
    .select()
    .from(packageScheduleItems)
    .where(inArray(packageScheduleItems.listId, listIds))
    .orderBy(asc(packageScheduleItems.departureDate), asc(packageScheduleItems.sortOrder));

  const airlineIds = [...new Set(items.map((item) => item.airlineId))];
  const airportIds = [...new Set(items.flatMap((item) => [item.arrivalAirportId, item.returnAirportId]))];
  const hotelIds = [...new Set(items.flatMap((item) => [item.hotelMakkahId, item.hotelMadinahId]).filter(Boolean))];
  const [airlines, airports, hotels] = await Promise.all([
    airlineIds.length ? db.select().from(masterAirlines).where(inArray(masterAirlines.id, airlineIds)) : [],
    airportIds.length ? db.select().from(masterAirports).where(inArray(masterAirports.id, airportIds)) : [],
    hotelIds.length ? db.select().from(masterHotels).where(inArray(masterHotels.id, hotelIds)) : [],
  ]);
  const airlineMap = new Map(airlines.map((item) => [item.id, item]));
  const airportMap = new Map(airports.map((item) => [item.id, item]));
  const hotelMap = new Map(hotels.map((item) => [item.id, item]));

  return lists.map((list) => ({
    ...list,
    items: items
      .filter((item) => item.listId === list.id)
      .map((item) => {
        const arrivalAirport = airportMap.get(item.arrivalAirportId) || null;
        const returnAirport = airportMap.get(item.returnAirportId) || null;
        return {
          ...item,
          departureDate: dateKey(item.departureDate),
          airline: airlineMap.get(item.airlineId) || null,
          arrivalAirport,
          returnAirport,
          route: `${arrivalAirport?.code || "JED"}-${returnAirport?.code || "JED"}`,
          hotelMakkah: item.hotelMakkahId ? hotelMap.get(item.hotelMakkahId) || null : null,
          hotelMadinah: item.hotelMadinahId ? hotelMap.get(item.hotelMadinahId) || null : null,
          effectiveStatus: getEffectiveScheduleStatus(item.status, item.departureDate),
        };
      }),
  }));
};

export const getPublicPackageScheduleLists = async (req, res, next) => {
  try {
    const lists = await db
      .select()
      .from(packageScheduleLists)
      .where(and(eq(packageScheduleLists.isActive, true), eq(packageScheduleLists.isPublished, true)))
      .orderBy(asc(packageScheduleLists.month), asc(packageScheduleLists.id));
    return successResponse(res, { lists: await hydrateLists(lists) });
  } catch (error) {
    next(error);
  }
};

export const getAllPackageScheduleLists = async (req, res, next) => {
  try {
    const lists = await db.select().from(packageScheduleLists).orderBy(desc(packageScheduleLists.month), desc(packageScheduleLists.id));
    return successResponse(res, { lists: await hydrateLists(lists) });
  } catch (error) {
    next(error);
  }
};

export const getPackageScheduleListById = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const [list] = await db.select().from(packageScheduleLists).where(eq(packageScheduleLists.id, id)).limit(1);
    if (!list) return errorResponse(res, "Daftar jadwal tidak ditemukan", 404);
    const [hydrated] = await hydrateLists([list]);
    return successResponse(res, hydrated);
  } catch (error) {
    next(error);
  }
};

async function createPackageScheduleListHandler(req, res, next) {
  try {
    const parsed = await parseListPayload(req.body);
    if (parsed.error) return errorResponse(res, parsed.error, 400);


    const id = await db.transaction(async (tx) => {
      const [created] = await tx.insert(packageScheduleLists).values(parsed.list).$returningId();
      await tx.insert(packageScheduleItems).values(parsed.items.map((item) => ({ ...item, listId: created.id })));
      return created.id;
    });
    return successResponse(res, { id }, "Daftar jadwal berhasil dibuat", 201);
  } catch (error) {
    next(error);
  }
};

export const updatePackageScheduleList = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const [existing] = await db.select().from(packageScheduleLists).where(eq(packageScheduleLists.id, id)).limit(1);
    if (!existing) return errorResponse(res, "Daftar jadwal tidak ditemukan", 404);
    const parsed = await parseListPayload(req.body, existing);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    await db.transaction(async (tx) => {
      await tx.update(packageScheduleLists).set(parsed.list).where(eq(packageScheduleLists.id, id));
      await tx.delete(packageScheduleItems).where(eq(packageScheduleItems.listId, id));
      await tx.insert(packageScheduleItems).values(parsed.items.map((item) => ({ ...item, listId: id })));
    });
    return successResponse(res, { id }, "Daftar jadwal berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

export const deletePackageScheduleList = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const result = await db.delete(packageScheduleLists).where(eq(packageScheduleLists.id, id));
    if (!result[0]?.affectedRows) return errorResponse(res, "Daftar jadwal tidak ditemukan", 404);
    return successResponse(res, null, "Daftar jadwal berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
