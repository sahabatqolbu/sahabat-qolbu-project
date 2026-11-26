import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { heroSlides, packages } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { getBookedSeatsByPackageIds } from "./packageController.js";

const KINDS = ["PROMO", "BANNER"];
const BACKGROUNDS = ["HARAM", "CLOCK", "FLYER"];

const toBoolean = (value, fallback = true) =>
  value === undefined || value === null || value === ""
    ? fallback
    : value === true || String(value).toLowerCase() === "true";

const text = (value, max) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

// Link CTA hanya boleh https atau path internal, supaya admin tidak bisa
// menyisipkan javascript: atau protokol lain ke halaman publik.
export const safeCtaUrl = (value) => {
  const url = text(value, 500);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  if (/^https:\/\/wa\.me\//i.test(url)) return url;
  return undefined;
};

export const parseHeroPayload = (body, existing = {}) => {
  const parsedOrder = Number.parseInt(body.sortOrder, 10);
  const parsedPackage = Number.parseInt(body.packageId, 10);
  const kind = String(body.kind || existing.kind || "PROMO").toUpperCase();
  const background = String(
    body.background || existing.background || "HARAM",
  ).toUpperCase();
  const ctaUrl = safeCtaUrl(body.ctaUrl);
  return {
    title: text(body.title, 255),
    altText: text(body.altText, 255),
    kind: KINDS.includes(kind) ? kind : null,
    packageId:
      Number.isInteger(parsedPackage) && parsedPackage > 0 ? parsedPackage : null,
    tag: text(body.tag, 60),
    headline: text(body.headline, 160),
    note: text(body.note, 255),
    priceLabel: text(body.priceLabel, 60),
    oldPriceLabel: text(body.oldPriceLabel, 60),
    ctaLabel: text(body.ctaLabel, 60),
    ctaUrl,
    background: BACKGROUNDS.includes(background) ? background : null,
    isActive: toBoolean(body.isActive, existing.isActive ?? true),
    sortOrder: Number.isFinite(parsedOrder)
      ? Math.min(Math.max(parsedOrder, 0), 999)
      : (existing.sortOrder ?? 0),
  };
};

const validate = (payload, imageUrl) => {
  if (!payload.kind) return "Jenis slide tidak valid";
  if (!payload.background) return "Latar slide tidak valid";
  if (payload.ctaUrl === undefined)
    return "Link tombol harus diawali https:// atau / (halaman di website)";
  if (payload.kind === "BANNER" && !imageUrl)
    return "Slide banner wajib memakai gambar";
  if (payload.kind === "PROMO" && !imageUrl && !payload.packageId)
    return "Slide promo butuh gambar flyer atau paket yang dipromosikan";
  return null;
};

const packageExists = async (id) => {
  if (!id) return true;
  const found = await db.query.packages.findFirst({
    where: eq(packages.id, id),
    columns: { id: true },
  });
  return Boolean(found);
};

/* Ringkasan paket untuk slide promo: nama, tanggal, durasi, maskapai, harga, sisa seat. */
const attachPackages = async (slides) => {
  const ids = [...new Set(slides.map((s) => s.packageId).filter(Boolean))];
  if (!ids.length) return slides.map((s) => ({ ...s, package: null }));
  const rows = await db.query.packages.findMany({
    where: inArray(packages.id, ids),
    with: { airline: true, images: true },
  });
  const booked = await getBookedSeatsByPackageIds(ids);
  const byId = new Map(
    rows.map((p) => {
      const taken = booked.get(p.id) ?? 0;
      const primary =
        (p.images || []).find((img) => img.isPrimary) || (p.images || [])[0];
      return [
        p.id,
        {
          id: p.id,
          name: p.name,
          departureDate: p.departureDate,
          returnDate: p.returnDate,
          duration: p.duration,
          airline: p.airline?.name || null,
          price: p.price,
          discountPrice: p.discountPrice,
          priceQuad: p.priceQuad,
          remainingSeats: Math.max((p.totalSeats || 0) - taken, 0),
          image: primary?.imageUrl || null,
          isPublished: p.isPublished !== false,
        },
      ];
    }),
  );
  return slides.map((s) => ({
    ...s,
    package: s.packageId ? byId.get(s.packageId) || null : null,
  }));
};

export const getPublicHeroSlides = async (req, res, next) => {
  try {
    const slides = await db.query.heroSlides.findMany({
      where: eq(heroSlides.isActive, true),
      orderBy: [asc(heroSlides.sortOrder), asc(heroSlides.id)],
    });
    const withPackages = await attachPackages(slides);
    // Paket yang disembunyikan dari website tidak boleh bocor lewat slide.
    const visible = withPackages.map((s) =>
      s.package && !s.package.isPublished ? { ...s, package: null } : s,
    );
    return successResponse(res, { slides: visible });
  } catch (error) {
    next(error);
  }
};

export const getAllHeroSlides = async (req, res, next) => {
  try {
    const slides = await db.query.heroSlides.findMany({
      orderBy: [asc(heroSlides.sortOrder), asc(heroSlides.id)],
    });
    return successResponse(res, await attachPackages(slides));
  } catch (error) {
    next(error);
  }
};

export const createHeroSlide = async (req, res, next) => {
  try {
    const payload = parseHeroPayload(req.body);
    const imageUrl = req.uploadedFile?.path || null;
    const problem = validate(payload, imageUrl);
    if (problem) return errorResponse(res, problem, 400);
    if (!(await packageExists(payload.packageId))) {
      return errorResponse(res, "Paket yang dipilih tidak ditemukan", 400);
    }

    const [created] = await db
      .insert(heroSlides)
      .values({ ...payload, imageUrl })
      .$returningId();

    return successResponse(
      res,
      { id: created.id },
      "Slide hero berhasil dibuat",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updateHeroSlide = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await db.query.heroSlides.findFirst({
      where: eq(heroSlides.id, id),
    });
    if (!existing) return errorResponse(res, "Slide hero tidak ditemukan", 404);

    const payload = parseHeroPayload(req.body, existing);
    const removeImage = toBoolean(req.body.removeImage, false);
    const imageUrl =
      req.uploadedFile?.path || (removeImage ? null : existing.imageUrl);
    const problem = validate(payload, imageUrl);
    if (problem) return errorResponse(res, problem, 400);
    if (!(await packageExists(payload.packageId))) {
      return errorResponse(res, "Paket yang dipilih tidak ditemukan", 400);
    }

    await db
      .update(heroSlides)
      .set({ ...payload, imageUrl })
      .where(eq(heroSlides.id, id));

    return successResponse(res, null, "Slide hero berhasil diperbarui");
  } catch (error) {
    next(error);
  }
};

export const deleteHeroSlide = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const existing = await db.query.heroSlides.findFirst({
      where: eq(heroSlides.id, id),
    });
    if (!existing) return errorResponse(res, "Slide hero tidak ditemukan", 404);

    await db.delete(heroSlides).where(eq(heroSlides.id, id));
    return successResponse(res, null, "Slide hero berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
