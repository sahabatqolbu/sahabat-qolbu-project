import { and, count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { agentData, jamaahData, users } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";

const slugify = (input = "") =>
  String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const getPublicAgentLandingBySlug = async (req, res, next) => {
  try {
    const slug = slugify(req.params.slug || "");

    if (!slug) {
      return errorResponse(res, "Slug agen tidak valid", 400);
    }

    const agents = await db.query.users.findMany({
      where: and(eq(users.role, "AGEN"), eq(users.isActive, true)),
      with: {
        agentData: {
          with: {
            currentLevel: true,
          },
        },
      },
    });

    const approvedAgents = agents.filter(
      (item) => item.agentData && item.agentData.status === "APPROVED",
    );

    const foundAgent = approvedAgents.find((item) => {
      const candidates = [
        item.agentData?.nickname,
        item.fullName,
        item.agentData?.fullNameKtp,
      ].filter(Boolean);

      return candidates.some((candidate) => slugify(candidate) === slug);
    });

    if (!foundAgent || !foundAgent.agentData) {
      return errorResponse(res, "Landing page agen tidak ditemukan", 404);
    }

    const [jamaahCount] = await db
      .select({ count: count() })
      .from(jamaahData)
      .where(eq(jamaahData.agenId, foundAgent.id));

    return successResponse(res, {
      slug,
      agent: {
        id: foundAgent.id,
        fullName: foundAgent.fullName,
        nickname: foundAgent.agentData.nickname,
        city: foundAgent.agentData.city,
        province: foundAgent.agentData.province,
        profilePhoto: foundAgent.agentData.profilePhoto,
        landingLogo: foundAgent.agentData.landingLogo,
        landingPrimaryColor: foundAgent.agentData.landingPrimaryColor,
        landingAccentColor: foundAgent.agentData.landingAccentColor,
        currentStar: foundAgent.agentData.currentStar,
        totalClosing: foundAgent.agentData.totalClosing || 0,
        totalJamaah: Number(jamaahCount?.count || 0),
        currentLevel: foundAgent.agentData.currentLevel
          ? {
              id: foundAgent.agentData.currentLevel.id,
              name: foundAgent.agentData.currentLevel.name,
            }
          : null,
      },
      cta: {
        whatsapp: null,
        email: null,
      },
      socials: {
        instagram: foundAgent.agentData.instagram || null,
        facebook: foundAgent.agentData.facebook || null,
        tiktok: foundAgent.agentData.tiktok || null,
        youtube: foundAgent.agentData.youtube || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicAgentSlugs = async (req, res, next) => {
  try {
    const agents = await db.query.users.findMany({
      where: and(eq(users.role, "AGEN"), eq(users.isActive, true)),
      with: {
        agentData: true,
      },
    });

    const slugs = agents
      .filter((item) => item.agentData && item.agentData.status === "APPROVED")
      .map((item) => {
        const source =
          item.agentData?.nickname || item.fullName || item.agentData?.fullNameKtp;
        return slugify(source);
      })
      .filter(Boolean);

    const uniqueSlugs = Array.from(new Set(slugs));

    return successResponse(res, {
      slugs: uniqueSlugs,
    });
  } catch (error) {
    next(error);
  }
};
