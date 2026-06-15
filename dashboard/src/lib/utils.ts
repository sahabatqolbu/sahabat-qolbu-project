// dashboard/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ FIX FINAL (SIMPLE & WORKS 100%)
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "https://via.placeholder.com/400x300?text=No+Image";

  const getFallbackServerUrl = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return "https://api.sahabatqolbu.com";
      }
    }
    return "http://localhost:5000";
  };

  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || getFallbackServerUrl();

  const normalizeSensitivePath = (input: string): string => {
    try {
      const parsed = new URL(input);
      const pathname = parsed.pathname || "";
      const sensitiveMatch = pathname.match(/^\/uploads\/(profiles|jamaah|agents|documents|payments)\/(.+)$/i);
      if (!sensitiveMatch) return input;

      const folder = sensitiveMatch[1].toLowerCase();
      const filename = sensitiveMatch[2].split("/").pop() || "";
      if (!filename) return input;

      const query = parsed.search || "";
      return `${SERVER_URL}/api/protected-uploads/${folder}/${filename}${query}`;
    } catch {
      const sensitiveMatch = input.match(/^\/uploads\/(profiles|jamaah|agents|documents|payments)\/(.+)$/i);
      if (!sensitiveMatch) return input;

      const folder = sensitiveMatch[1].toLowerCase();
      const filename = sensitiveMatch[2].split("/").pop() || "";
      if (!filename) return input;

      return `${SERVER_URL}/api/protected-uploads/${folder}/${filename}`;
    }
  };

  // Jika sudah full URL (http/https), return langsung
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const maybeSensitive = normalizeSensitivePath(path);

    try {
      const url = new URL(maybeSensitive);
      const isLegacyProductionApi = url.hostname === "api.sahabatqolbu.com";

      if (isLegacyProductionApi) {
        return `${SERVER_URL}${url.pathname}${url.search}`;
      }
    } catch {
      return maybeSensitive;
    }

    return maybeSensitive;
  }

  // ✅ SOLUTION: Langsung ke server root (BYPASS /api)
  // Backend serve static files di: http://localhost:5000/uploads
  // Karena baseURL axios = http://localhost:5000/api
  // Kita harus remove /api untuk static files

  // Path dari DB: /uploads/hotels/xxx.webp
  // Result: http://localhost:5000/uploads/hotels/xxx.webp
  const normalizedPath = normalizeSensitivePath(path);
  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  return `${SERVER_URL}${normalizedPath}`;
}

// ✅ MAPPING TIPE PAKET (sudah bener, ga usah diubah)
export const PACKAGE_TYPE_LABELS: Record<string, string> = {
  FULL_SERVICE: "Full Service",
  EXTREME: "Extreme",
  SEMI_MANDIRI: "Semi Mandiri",
  FLEKSIBILITAS: "Fleksibilitas",
  KONSORSIUM: "Konsorsium",
  LA: "Land Arrangement",
};

// ✅ HELPER UNTUK BADGE COLOR (sudah bener, ga usah diubah)
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
