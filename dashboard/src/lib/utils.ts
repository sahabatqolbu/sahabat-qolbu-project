// dashboard/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRODUCTION_SERVER_URL = "https://api.sahabatqolbu.com";
const DEVELOPMENT_SERVER_URL = "http://localhost:5000";
const SENSITIVE_UPLOAD_FOLDERS = "profiles|jamaah|agents|documents|payments";

const getServerOrigin = () => {
  const envServerUrl = process.env.NEXT_PUBLIC_SERVER_URL?.trim();

  if (envServerUrl) {
    try {
      const parsed = new URL(envServerUrl);
      const pointsToDashboard =
        parsed.hostname === "dashboard.sahabatqolbu.com";
      const pointsToApiPath = parsed.pathname
        .replace(/\/+$/, "")
        .endsWith("/api");

      if (!pointsToDashboard && !pointsToApiPath) {
        return envServerUrl.replace(/\/+$/, "");
      }
    } catch {
      // Fall through to a known-good origin.
    }
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SERVER_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return PRODUCTION_SERVER_URL;
    }
  }

  return DEVELOPMENT_SERVER_URL;
};

const normalizeSensitiveUploadUrl = (input: string, serverOrigin: string) => {
  const sensitiveUploadPattern = new RegExp(
    `^/?uploads/(${SENSITIVE_UPLOAD_FOLDERS})/(.+)$`,
    "i",
  );

  const match = input.match(sensitiveUploadPattern);
  if (!match) return input;

  const folder = match[1].toLowerCase();
  const filename = match[2].split("/").pop() || "";
  if (!filename) return input;

  return `${serverOrigin}/api/protected-uploads/${folder}/${filename}`;
};

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "https://via.placeholder.com/400x300?text=No+Image";

  const serverOrigin = getServerOrigin();
  const trimmedPath = path.trim();

  if (trimmedPath.startsWith("//")) {
    return `https:${trimmedPath}`;
  }

  if (/^https?:\/\//i.test(trimmedPath)) {
    try {
      const parsed = new URL(trimmedPath);
      const pathname = parsed.pathname.replace(/^\/api(?=\/uploads\/)/, "");
      const sensitivePath = normalizeSensitiveUploadUrl(pathname, serverOrigin);

      if (/^https?:\/\//i.test(sensitivePath)) {
        return `${sensitivePath}${parsed.search}`;
      }

      if (
        parsed.hostname === "api.sahabatqolbu.com" ||
        parsed.hostname === "dashboard.sahabatqolbu.com"
      ) {
        return `${serverOrigin}${pathname}${parsed.search}`;
      }

      return trimmedPath;
    } catch {
      return trimmedPath;
    }
  }

  const normalizedPath = trimmedPath
    .replace(/^\/+/, "")
    .replace(/^api\/uploads\//i, "uploads/");
  const sensitivePath = normalizeSensitiveUploadUrl(
    normalizedPath,
    serverOrigin,
  );

  if (/^https?:\/\//i.test(sensitivePath)) {
    return sensitivePath;
  }

  return `${serverOrigin}/${normalizedPath}`;
}

export const PACKAGE_TYPE_LABELS: Record<string, string> = {
  FULL_SERVICE: "Full Service",
  EXTREME: "Extreme",
  SEMI_MANDIRI: "Semi Mandiri",
  FLEKSIBILITAS: "Fleksibilitas",
  KONSORSIUM: "Konsorsium",
  LA: "Land Arrangement",
};

export function getTypeBadge(type: string): string {
  const badges: Record<string, string> = {
    FULL_SERVICE: "bg-blue-100 text-blue-800",
    EXTREME: "bg-red-100 text-red-800",
    SEMI_MANDIRI: "bg-orange-100 text-orange-800",
    FLEKSIBILITAS: "bg-purple-100 text-purple-800",
    KONSORSIUM: "bg-indigo-100 text-indigo-800",
    LA: "bg-green-100 text-green-800",
  };
  return badges[type] || "bg-gray-100 text-gray-800";
}
