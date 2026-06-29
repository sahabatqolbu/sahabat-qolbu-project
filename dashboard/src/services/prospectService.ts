import api from "@/lib/axios";

export type ProspectAction = "SAVED" | "WHATSAPP_CONSULT" | "CONVERT_REQUEST";

export interface PublicPackage {
  id: number;
  code?: string;
  name: string;
  type?: string;
  description?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  duration?: number | null;
  price?: string | number;
  discountPrice?: string | number | null;
  priceDouble?: string | number | null;
  priceTriple?: string | number | null;
  priceQuad?: string | number | null;
  priceQuint?: string | number | null;
  totalSeats?: number;
  remainingSeats?: number;
  bookedSeats?: number;
  facilities?: string | null;
  excludedFacilities?: string | null;
  notes?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  images?: Array<{ id: number; imageUrl: string; isPrimary?: boolean; caption?: string | null }>;
  hotelMakkah?: { name?: string; starRating?: number } | null;
  hotelMadinah?: { name?: string; starRating?: number } | null;
  airline?: { name?: string; logo?: string | null } | null;
  departureAirport?: { code?: string; name?: string; city?: string } | null;
}

export interface ProspectInterest {
  id: number;
  actionType: ProspectAction;
  sourcePath?: string | null;
  createdAt?: string;
  packageId: number;
  packageName: string;
  packageCode?: string;
  packageType?: string;
  departureDate?: string;
  returnDate?: string;
  price?: string | number;
  discountPrice?: string | number | null;
}

export interface AdminProspect {
  id: number;
  followUpStatus: string;
  sourceType?: string | null;
  sourceSlug?: string | null;
  convertedJamaahId?: number | null;
  convertedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  isEmailVerified?: boolean;
  latestInterest?: ProspectInterest | null;
}

export interface ProspectFollowUp {
  id: number;
  status: string;
  note?: string | null;
  createdAt?: string;
  actorUserId?: number;
  actorName?: string;
  actorRole?: string;
}

export const packageSlug = (pkg: Pick<PublicPackage, "id" | "name">) => {
  const slug = String(pkg.name || "paket")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${pkg.id}-${slug || "paket"}`;
};

const slugToPackageId = (slug: string) => {
  const match = slug.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
};

const normalizePackages = (payload: any): PublicPackage[] => {
  const packages = payload?.data?.packages || payload?.data || payload?.packages || [];
  return Array.isArray(packages)
    ? packages.filter((pkg) => pkg?.isActive !== false && pkg?.isPublished !== false)
    : [];
};

export const prospectService = {
  getSummary: async () => {
    const response = await api.get("/prospects/me");
    return response.data;
  },

  getInterests: async () => {
    const response = await api.get("/prospects/me/interests");
    return response.data;
  },

  saveInterest: async (
    packageId: number,
    actionType: ProspectAction,
    sourcePath?: string,
  ) => {
    const response = await api.post("/prospects/me/interests", {
      packageId,
      actionType,
      sourcePath,
    });
    return response.data;
  },

  convert: async (packageId: number, sourcePath?: string) => {
    const response = await api.post("/prospects/me/convert", {
      packageId,
      actionType: "CONVERT_REQUEST",
      sourcePath,
    });
    return response.data;
  },

  getPublicPackages: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get("/public/packages", {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 100,
        search: params?.search || undefined,
      },
    });
    return {
      ...response.data,
      data: {
        ...(response.data?.data || {}),
        packages: normalizePackages(response.data),
      },
    };
  },

  getPublicPackageBySlug: async (slug: string) => {
    const id = slugToPackageId(slug);
    if (id) {
      const response = await api.get(`/public/packages/${id}`);
      return response.data;
    }

    const listResponse = await prospectService.getPublicPackages({ search: slug, limit: 100 });
    const packages: PublicPackage[] = listResponse.data.packages;
    const match = packages.find((pkg) => packageSlug(pkg) === slug || pkg.code === slug);
    return {
      success: Boolean(match),
      data: match || null,
    };
  },

  getAdminProspects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get("/prospects/admin", { params });
    return response.data;
  },

  getAdminProspectDetail: async (id: number | string) => {
    const response = await api.get(`/prospects/admin/${id}`);
    return response.data;
  },

  addFollowUp: async (
    id: number | string,
    data: { status: string; note?: string | null },
  ) => {
    const response = await api.post(`/prospects/admin/${id}/follow-ups`, data);
    return response.data;
  },

  adminConvert: async (id: number | string, packageId: number) => {
    const response = await api.post(`/prospects/admin/${id}/convert`, {
      packageId,
      actionType: "CONVERT_REQUEST",
    });
    return response.data;
  },
};
