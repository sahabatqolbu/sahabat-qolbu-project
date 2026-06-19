import { cache } from "react";

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.sahabatqolbu.com/api"
    : "http://localhost:5000/api");

const normalizeApiBaseUrl = (value: string) => value.replace(/\/+$/, "");

const API_BASE_URL = normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return process.env.NODE_ENV === "production"
      ? "https://api.sahabatqolbu.com"
      : "http://localhost:5000";
  }
})();

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type BackendPagination = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

type BackendPackageImage = {
  imageUrl?: string | null;
  isPrimary?: boolean | null;
};

type BackendHotel = {
  name?: string | null;
  starRating?: number | null;
  distanceToHaram?: number | null;
  facilities?: string | null;
  imageUrl?: string | null;
};

type BackendAirline = {
  name?: string | null;
  logo?: string | null;
};

type BackendItineraryItem = {
  day?: number | null;
  dayNumber?: number | null;
  title?: string | null;
  activities?: string[] | string | null;
  description?: string | null;
};

type BackendPackage = {
  id: number;
  code?: string | null;
  name?: string | null;
  type?: string | null;
  duration?: number | null;
  departureDate?: string | null;
  returnDate?: string | null;
  price?: string | number | null;
  discountPrice?: string | number | null;
  priceDouble?: string | number | null;
  priceTriple?: string | number | null;
  priceQuad?: string | number | null;
  priceQuint?: string | number | null;
  totalSeats?: number | null;
  bookedSeats?: number | null;
  description?: string | null;
  facilities?: string | null;
  excludedFacilities?: string | null;
  notes?: string | null;
  itineraryPdf?: string | null;
  itinerary?: BackendItineraryItem[] | null;
  hotelMakkah?: BackendHotel | null;
  hotelMadinah?: BackendHotel | null;
  airline?: BackendAirline | null;
  images?: BackendPackageImage[] | null;
  isPublished?: boolean | null;
  isActive?: boolean | null;
};

type PublicPackagesPayload = {
  packages: BackendPackage[];
  pagination?: BackendPagination;
};

type BackendAgentLanding = {
  slug: string;
  agent: {
    id: number;
    fullName: string;
    nickname?: string | null;
    city?: string | null;
    province?: string | null;
    profilePhoto?: string | null;
    landingLogo?: string | null;
    landingPrimaryColor?: string | null;
    landingAccentColor?: string | null;
    currentStar?: number | null;
    totalClosing?: number | null;
    totalJamaah?: number | null;
    currentLevel?: {
      id: number;
      name: string;
    } | null;
  };
  cta?: {
    whatsapp?: string | null;
    email?: string | null;
  };
  socials?: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  };
};

export type MarketingPackageType = "UMRAH" | "UMRAH_PLUS" | "UMRAH_RAMADHAN";

export interface MarketingPackage {
  id: number;
  slug: string;
  code: string;
  name: string;
  type: MarketingPackageType;
  duration: number;
  departureDate: string;
  returnDate: string;
  airline: { name: string; logo?: string };
  hotelMakkah: {
    name: string;
    starRating: number;
    distanceToHaram?: string;
    facilities?: string[];
  };
  hotelMadinah?: {
    name: string;
    starRating: number;
    distanceToMasjid?: string;
    facilities?: string[];
  };
  priceQuad: string;
  priceTriple?: string;
  priceDouble: string;
  originalPrice?: string;
  totalSeats: number;
  bookedSeats: number;
  image?: string;
  gallery?: string[];
  featured?: boolean;
  description?: string;
  included?: string[];
  excluded?: string[];
  itinerary?: {
    day: number;
    title: string;
    activities: string[];
  }[];
  itineraryPdf?: string;
  documents?: string[];
  terms?: string[];
  backendType?: string;
}

export interface PublicAgentLanding {
  slug: string;
  agent: {
    id: number;
    fullName: string;
    nickname?: string | null;
    city?: string | null;
    province?: string | null;
    profilePhoto?: string;
    landingLogo?: string;
    landingPrimaryColor?: string | null;
    landingAccentColor?: string | null;
    currentStar: number;
    totalClosing: number;
    totalJamaah: number;
    currentLevel?: {
      id: number;
      name: string;
    } | null;
  };
  cta: {
    whatsapp?: string | null;
    email?: string | null;
  };
  socials: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  };
}

const resolveApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const slugifyPackageName = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const toNonEmptyString = (value: unknown, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toNumber = (value: unknown, fallback = 0) => {
  const normalized =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(normalized) ? normalized : fallback;
};

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
};

const parseStringList = (value?: string | string[] | null) => {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }

  const text = String(value || "").trim();
  if (!text) return undefined;

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      if (items.length) return items;
    }
  } catch {
    // Ignore non-JSON values.
  }

  const multilineItems = text
    .split(/\r?\n|•/)
    .map((item) => item.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);

  if (multilineItems.length > 1) {
    return multilineItems;
  }

  const semicolonItems = text
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  if (semicolonItems.length > 1) {
    return semicolonItems;
  }

  return [text];
};

const parseActivities = (value?: string[] | string | null, description?: string | null) => {
  const list = parseStringList(value);
  if (list?.length) return list;

  const descriptionText = toNonEmptyString(description);
  return descriptionText ? [descriptionText] : [];
};

const mapPackageType = (rawType?: string | null, packageName?: string | null): MarketingPackageType => {
  const normalizedName = String(packageName || "").toLowerCase();
  const normalizedType = String(rawType || "").toUpperCase();

  if (normalizedName.includes("ramadhan")) {
    return "UMRAH_RAMADHAN";
  }

  if (
    normalizedName.includes("plus") ||
    normalizedName.includes("turki") ||
    normalizedName.includes("dubai") ||
    normalizedType === "EXTREME" ||
    normalizedType === "LA"
  ) {
    return "UMRAH_PLUS";
  }

  return "UMRAH";
};

const formatDistance = (distance: unknown, destination: string) => {
  const meters = toNumber(distance, 0);
  return meters > 0 ? `${meters}m dari ${destination}` : undefined;
};

const mapHotel = (
  hotel: BackendHotel | null | undefined,
  destination: "Masjidil Haram" | "Masjid Nabawi",
) => {
  if (!hotel?.name) {
    return undefined;
  }

  const mapped = {
    name: hotel.name,
    starRating: toNumber(hotel.starRating, 0),
    facilities: parseStringList(hotel.facilities),
  };

  if (destination === "Masjidil Haram") {
    return {
      ...mapped,
      distanceToHaram: formatDistance(hotel.distanceToHaram, destination),
    };
  }

  return {
    ...mapped,
    distanceToMasjid: formatDistance(hotel.distanceToHaram, destination),
  };
};

const mapPackage = (pkg: BackendPackage): MarketingPackage => {
  const currentPrice = toNumber(pkg.discountPrice ?? pkg.price, 0);
  const originalPrice = toNumber(pkg.price, currentPrice);
  const quadPrice = toNumber(pkg.priceQuad, currentPrice) || currentPrice;
  const triplePrice = toNumber(pkg.priceTriple, quadPrice) || quadPrice;
  const doublePrice = toNumber(pkg.priceDouble, originalPrice) || originalPrice;
  const gallery = (pkg.images || [])
    .map((image) => resolveAssetUrl(image.imageUrl))
    .filter((value): value is string => Boolean(value));
  const primaryImage = gallery[0];
  const itinerary = Array.isArray(pkg.itinerary)
    ? pkg.itinerary
        .map((item, index) => ({
          day: toNumber(item.day ?? item.dayNumber, index + 1),
          title: toNonEmptyString(item.title, `Hari ${index + 1}`),
          activities: parseActivities(item.activities, item.description),
        }))
        .filter((item) => item.activities.length > 0 || item.title)
    : undefined;

  const name = toNonEmptyString(pkg.name, "Paket Umroh");

  return {
    id: pkg.id,
    slug: slugifyPackageName(name || `paket-${pkg.id}`),
    code: toNonEmptyString(pkg.code, `PKG-${pkg.id}`),
    name,
    type: mapPackageType(pkg.type, pkg.name),
    duration: toNumber(pkg.duration, 0),
    departureDate: toNonEmptyString(pkg.departureDate),
    returnDate: toNonEmptyString(pkg.returnDate),
    airline: {
      name: toNonEmptyString(pkg.airline?.name, "Maskapai belum tersedia"),
      logo: resolveAssetUrl(pkg.airline?.logo),
    },
    hotelMakkah:
      mapHotel(pkg.hotelMakkah, "Masjidil Haram") || {
        name: "Hotel Makkah belum tersedia",
        starRating: 0,
      },
    hotelMadinah: mapHotel(pkg.hotelMadinah, "Masjid Nabawi"),
    priceQuad: String(quadPrice),
    priceTriple: String(triplePrice),
    priceDouble: String(doublePrice),
    originalPrice: String(originalPrice),
    totalSeats: toNumber(pkg.totalSeats, 0),
    bookedSeats: toNumber(pkg.bookedSeats, 0),
    image: primaryImage,
    gallery,
    featured: false,
    description:
      toNonEmptyString(pkg.description) ||
      "Detail paket akan diinformasikan lebih lanjut oleh tim Sahabat Qolbu.",
    included: parseStringList(pkg.facilities),
    excluded: parseStringList(pkg.excludedFacilities),
    itinerary,
    itineraryPdf: resolveAssetUrl(pkg.itineraryPdf),
    documents: undefined,
    terms: parseStringList(pkg.notes),
    backendType: toNonEmptyString(pkg.type),
  };
};

const sortPackagesByDeparture = (packages: MarketingPackage[]) =>
  [...packages].sort((left, right) => {
    const leftTime = new Date(left.departureDate).getTime();
    const rightTime = new Date(right.departureDate).getTime();

    if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return 0;
    if (!Number.isFinite(leftTime)) return 1;
    if (!Number.isFinite(rightTime)) return -1;

    return leftTime - rightTime;
  });

const fetchApi = async <T>(path: string) => {
  try {
    const response = await fetch(resolveApiUrl(path), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.data;
  } catch {
    return null;
  }
};

export const getMarketingPackages = cache(async (): Promise<MarketingPackage[]> => {
  const firstPage = await fetchApi<PublicPackagesPayload>("/public/packages?page=1&limit=100");

  if (!firstPage) {
    return [];
  }

  const collectedPackages = [...(firstPage.packages || [])];
  const totalPages = Math.max(1, toNumber(firstPage.pagination?.totalPages, 1));

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await fetchApi<PublicPackagesPayload>(
      `/public/packages?page=${page}&limit=100`,
    );

    if (nextPage?.packages?.length) {
      collectedPackages.push(...nextPage.packages);
    }
  }

  const uniquePackages = Array.from(
    new Map(collectedPackages.map((pkg) => [pkg.id, pkg])).values(),
  );

  return sortPackagesByDeparture(
    uniquePackages
      .filter((pkg) => pkg.isPublished !== false)
      .map((pkg) => mapPackage(pkg)),
  );
});

export const getMarketingPackageSlugs = async (): Promise<string[]> => {
  const packages = await getMarketingPackages();
  return packages.map((pkg) => pkg.slug);
};

export const getFeaturedMarketingPackages = async (limit = 3) => {
  const packages = await getMarketingPackages();
  return packages.slice(0, limit).map((pkg) => ({ ...pkg, featured: true }));
};

export const getMarketingPackageById = async (id: number | string) => {
  const parsedId = Number.parseInt(String(id), 10);
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }

  const pkg = await fetchApi<BackendPackage>(`/public/packages/${parsedId}`);
  return pkg ? mapPackage(pkg) : null;
};

export const getMarketingPackageBySlug = async (slug: string) => {
  const normalizedSlug = slugifyPackageName(slug);
  if (!normalizedSlug) {
    return null;
  }

  const packages = await getMarketingPackages();
  return packages.find((pkg) => pkg.slug === normalizedSlug) || null;
};

export const getPublicAgentSlugs = async () => {
  const payload = await fetchApi<{ slugs?: string[] }>("/public/agents/slugs");
  return Array.isArray(payload?.slugs)
    ? payload.slugs.filter((slug): slug is string => Boolean(slug))
    : [];
};

export const getPublicAgentLanding = async (slug: string) => {
  const normalizedSlug = toNonEmptyString(slug);
  if (!normalizedSlug) {
    return null;
  }

  const landing = await fetchApi<BackendAgentLanding>(
    `/public/agents/${encodeURIComponent(normalizedSlug)}`,
  );

  if (!landing) {
    return null;
  }

  return {
    slug: landing.slug,
    agent: {
      id: landing.agent.id,
      fullName: landing.agent.fullName,
      nickname: landing.agent.nickname,
      city: landing.agent.city,
      province: landing.agent.province,
      profilePhoto: resolveAssetUrl(landing.agent.profilePhoto),
      landingLogo: resolveAssetUrl(landing.agent.landingLogo),
      landingPrimaryColor: landing.agent.landingPrimaryColor,
      landingAccentColor: landing.agent.landingAccentColor,
      currentStar: toNumber(landing.agent.currentStar, 0),
      totalClosing: toNumber(landing.agent.totalClosing, 0),
      totalJamaah: toNumber(landing.agent.totalJamaah, 0),
      currentLevel: landing.agent.currentLevel || null,
    },
    cta: {
      whatsapp: landing.cta?.whatsapp || null,
      email: landing.cta?.email || null,
    },
    socials: {
      instagram: landing.socials?.instagram || null,
      facebook: landing.socials?.facebook || null,
      tiktok: landing.socials?.tiktok || null,
      youtube: landing.socials?.youtube || null,
    },
  } satisfies PublicAgentLanding;
};
