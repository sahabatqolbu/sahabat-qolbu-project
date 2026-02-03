// dashboard/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ FIX FINAL (SIMPLE & WORKS 100%)
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "https://via.placeholder.com/400x300?text=No+Image";

  // Jika sudah full URL (http/https), return langsung
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // ✅ SOLUTION: Langsung ke server root (BYPASS /api)
  // Backend serve static files di: http://localhost:5000/uploads
  // Karena baseURL axios = http://localhost:5000/api
  // Kita harus remove /api untuk static files

  const SERVER_URL = "http://localhost:5000"; // ✅ HARDCODE (paling safe)

  // Path dari DB: /uploads/hotels/xxx.webp
  // Result: http://localhost:5000/uploads/hotels/xxx.webp
  return `${SERVER_URL}${path}`;
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
