import { db } from "../db/index.js";
import { companyProfile } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const normalizeStructuredItems = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
    }))
    .filter((item) => item.title || item.description)
    .slice(0, 6);
};

const mapPublicCompanyProfile = (profile) => ({
  ...profile,
  philosophy: normalizeStructuredItems(profile?.philosophy),
  targetMarket: normalizeStructuredItems(profile?.targetMarket),
});

// ===== GET COMPANY PROFILE =====
export const getCompanyProfile = async (req, res, next) => {
  try {
    let profile = await db.query.companyProfile.findFirst({
      where: eq(companyProfile.id, 1),
    });

    // ✅ Jika belum ada, CREATE default profile
    if (!profile) {
      await db.insert(companyProfile).values({
        id: 1,
        companyName: "Sahabat Qolbu",
        tagline: "Mitra Terpercaya Perjalanan Ibadah Anda",
      });

      // Fetch lagi setelah create
      profile = await db.query.companyProfile.findFirst({
        where: eq(companyProfile.id, 1),
      });
    }

    return successResponse(res, mapPublicCompanyProfile(profile));
  } catch (error) {
    logger.error("Get company profile error", error);
    next(error);
  }
};

// ===== UPDATE COMPANY PROFILE =====
export const updateCompanyProfile = async (req, res, next) => {
  try {
    const data = req.body;

    logger.debug("Update company profile requested", {
      fields: Object.keys(data || {}),
    });

    // Check if profile exists
    const existing = await db.query.companyProfile.findFirst({
      where: eq(companyProfile.id, 1),
    });

    logger.debug("Company profile existence checked", { exists: !!existing });

    if (!existing) {
      // ✅ CREATE NEW
      const [result] = await db.insert(companyProfile).values({
        id: 1,
        companyName: data.companyName || "Sahabat Qolbu",
        tagline: data.tagline || null,
        logo: data.logo || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postalCode: data.postalCode || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        website: data.website || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        youtube: data.youtube || null,
        tiktok: data.tiktok || null,
        npwp: data.npwp || null,
        ppiu: data.ppiu || null,
        iata: data.iata || null,
        description: data.description || null,
        vision: data.vision || null,
        mission: data.mission || null,
        philosophy: normalizeStructuredItems(data.philosophy),
        targetMarket: normalizeStructuredItems(data.targetMarket),
      });

      logger.info("Company profile created", { result });
    } else {
      const updateData = {
        companyName: data.companyName ?? existing.companyName,
        tagline: data.tagline ?? existing.tagline,
        address: data.address ?? existing.address,
        city: data.city ?? existing.city,
        province: data.province ?? existing.province,
        postalCode: data.postalCode ?? existing.postalCode,
        phone: data.phone ?? existing.phone,
        whatsapp: data.whatsapp ?? existing.whatsapp,
        email: data.email ?? existing.email,
        website: data.website ?? existing.website,
        instagram: data.instagram ?? existing.instagram,
        facebook: data.facebook ?? existing.facebook,
        youtube: data.youtube ?? existing.youtube,
        tiktok: data.tiktok ?? existing.tiktok,
        npwp: data.npwp ?? existing.npwp,
        ppiu: data.ppiu ?? existing.ppiu,
        iata: data.iata ?? existing.iata,
        description: data.description ?? existing.description,
        vision: data.vision ?? existing.vision,
        mission: data.mission ?? existing.mission,
        philosophy:
          data.philosophy !== undefined
            ? normalizeStructuredItems(data.philosophy)
            : normalizeStructuredItems(existing.philosophy),
        targetMarket:
          data.targetMarket !== undefined
            ? normalizeStructuredItems(data.targetMarket)
            : normalizeStructuredItems(existing.targetMarket),
        updatedAt: new Date(),
      };

      const result = await db
        .update(companyProfile)
        .set(updateData)
        .where(eq(companyProfile.id, 1));

      logger.info("Company profile updated", { result });
    }

    return successResponse(res, null, "Profil perusahaan berhasil diupdate");
  } catch (error) {
    logger.error("Update company profile error", error);
    next(error);
  }
};

export const getPublicCompanyProfile = async (req, res, next) => {
  try {
    const profile = await db.query.companyProfile.findFirst({
      where: eq(companyProfile.id, 1),
    });

    if (!profile) {
      return successResponse(res, {
        vision: null,
        mission: null,
        philosophy: [],
        targetMarket: [],
      });
    }

    return successResponse(res, mapPublicCompanyProfile(profile));
  } catch (error) {
    logger.error("Get public company profile error", error);
    next(error);
  }
};

// ===== UPLOAD COMPANY LOGO =====
export const uploadCompanyLogo = async (req, res, next) => {
  try {
    logger.debug("Upload company logo called", {
      hasFile: !!req.file,
      hasUploadedFile: !!req.uploadedFile,
    });

    if (!req.uploadedFile) {
      return errorResponse(res, "Logo harus diupload", 400);
    }

    // Check if profile exists
    const existing = await db.query.companyProfile.findFirst({
      where: eq(companyProfile.id, 1),
    });

    if (!existing) {
      await db.insert(companyProfile).values({
        id: 1,
        companyName: "Sahabat Qolbu",
        logo: req.uploadedFile.path,
      });
    } else {
      await db
        .update(companyProfile)
        .set({
          logo: req.uploadedFile.path,
          updatedAt: new Date(),
        })
        .where(eq(companyProfile.id, 1));
    }

    logger.info("Company logo uploaded", { logo: req.uploadedFile.path });

    return successResponse(
      res,
      { logo: req.uploadedFile.path },
      "Logo berhasil diupload"
    );
  } catch (error) {
    logger.error("Upload company logo error", error);
    next(error);
  }
};



