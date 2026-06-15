// dashboard/src/lib/schemas/package-schema.ts
import * as z from "zod";

// Helper: converts NaN/empty string to undefined for optional number fields
// This is needed because react-hook-form's valueAsNumber returns NaN for empty inputs
const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  },
  z.number().min(0).optional()
);

// =====================================================
// PACKAGE FORM SCHEMA
// =====================================================
export const createPackageSchema = z.object({
  // ===== BASIC INFO =====
  name: z.string().min(3, "Nama paket minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum([
    "FULL_SERVICE",
    "EXTREME",
    "SEMI_MANDIRI",
    "FLEKSIBILITAS",
    "KONSORSIUM",
    "LA",
  ]),

  // ===== DATES =====
  departureDate: z.string().min(1, "Tanggal keberangkatan wajib diisi"),
  returnDate: z.string().min(1, "Tanggal pulang wajib diisi"),

  // ===== PRICING =====
  price: z.number().min(0, "Harga harus lebih dari 0"),
  discountPrice: z.number().min(0).optional().nullable(),

  // ===== SEATS =====
  totalSeats: z.number().min(1, "Total seat minimal 1"),

  // ===== FACILITIES =====
  facilities: z.string().optional(),
  notes: z.string().optional(),

  // ===== AIRLINE =====
  airlineId: z.number().optional().nullable(),
  airlineStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  airlineIssuedDate: z.string().optional().nullable(),

  // ===== AIRLINE PAYMENT =====
  airlineTermin1Amount: optionalNumber,
  airlineTermin1Date: z.string().optional().nullable(),
  airlineTermin1Status: z.enum(["UNPAID", "PAID"]).optional(),
  airlineTermin2Amount: optionalNumber,
  airlineTermin2Date: z.string().optional().nullable(),
  airlineTermin2Status: z.enum(["UNPAID", "PAID"]).optional(),

  // ===== HOTEL MAKKAH =====
  hotelMakkahId: z.number().optional().nullable(),
  hotelMakkahStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  hotelMakkahDouble: optionalNumber,
  hotelMakkahTriple: optionalNumber,
  hotelMakkahQuad: optionalNumber,
  hotelMakkahQuint: optionalNumber,

  // ===== HOTEL MADINAH =====
  hotelMadinahId: z.number().optional().nullable(),
  hotelMadinahStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  hotelMadinahDouble: optionalNumber,
  hotelMadinahTriple: optionalNumber,
  hotelMadinahQuad: optionalNumber,
  hotelMadinahQuint: optionalNumber,

  // ===== AIRPORT =====
  departureAirportId: z.number().optional().nullable(),

  // ===== STATUS =====
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),

  // ✅ MEDIA (tidak di form validation, karena file upload)
  // itinerary_pdf: handled separately
  // images: handled separately
});

export type CreatePackageFormData = z.infer<typeof createPackageSchema>;

// =====================================================
// UPDATE PACKAGE SCHEMA
// For update forms, we need explicit required fields without .default()
// to avoid TypeScript inference issues with react-hook-form resolver
// =====================================================
export const updatePackageSchema = z.object({
  // ===== BASIC INFO =====
  name: z.string().min(3, "Nama paket minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum([
    "FULL_SERVICE",
    "EXTREME",
    "SEMI_MANDIRI",
    "FLEKSIBILITAS",
    "KONSORSIUM",
    "LA",
  ]),

  // ===== DATES =====
  departureDate: z.string().min(1, "Tanggal keberangkatan wajib diisi"),
  returnDate: z.string().min(1, "Tanggal pulang wajib diisi"),

  // ===== PRICING =====
  price: z.number().min(0, "Harga harus lebih dari 0"),
  discountPrice: z.number().min(0).optional().nullable(),

  // ===== SEATS =====
  totalSeats: z.number().min(1, "Total seat minimal 1"),

  // ===== FACILITIES =====
  facilities: z.string().optional(),
  notes: z.string().optional(),

  // ===== AIRLINE =====
  airlineId: z.number().optional().nullable(),
  airlineStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  airlineIssuedDate: z.string().optional().nullable(),

  // ===== AIRLINE PAYMENT =====
  // ✅ optionalNumber handles NaN from valueAsNumber on empty inputs
  airlineTermin1Amount: optionalNumber,
  airlineTermin1Date: z.string().optional().nullable(),
  airlineTermin1Status: z.enum(["UNPAID", "PAID"]).optional(),
  airlineTermin2Amount: optionalNumber,
  airlineTermin2Date: z.string().optional().nullable(),
  airlineTermin2Status: z.enum(["UNPAID", "PAID"]).optional(),

  // ===== HOTEL MAKKAH =====
  hotelMakkahId: z.number().optional().nullable(),
  hotelMakkahStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  // ✅ optionalNumber handles NaN from valueAsNumber on empty inputs
  hotelMakkahDouble: optionalNumber,
  hotelMakkahTriple: optionalNumber,
  hotelMakkahQuad: optionalNumber,
  hotelMakkahQuint: optionalNumber,

  // ===== HOTEL MADINAH =====
  hotelMadinahId: z.number().optional().nullable(),
  hotelMadinahStatus: z.enum(["PLANNING", "CONFIRMED"]).optional(),
  // ✅ optionalNumber handles NaN from valueAsNumber on empty inputs
  hotelMadinahDouble: optionalNumber,
  hotelMadinahTriple: optionalNumber,
  hotelMadinahQuad: optionalNumber,
  hotelMadinahQuint: optionalNumber,

  // ===== AIRPORT =====
  departureAirportId: z.number().optional().nullable(),

  // ===== STATUS =====
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type UpdatePackageFormData = z.infer<typeof updatePackageSchema>;
