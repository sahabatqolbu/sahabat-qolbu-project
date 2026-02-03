// dashboard/src/lib/schemas/master-schema.ts
import { z } from "zod";

// =====================================================
// HOTEL SCHEMA
// =====================================================
export const createHotelSchema = z.object({
  name: z
    .string()
    .min(3, "Nama hotel minimal 3 karakter")
    .max(100, "Nama hotel maksimal 100 karakter"),

  city: z.enum(["MAKKAH", "MADINAH"]),

  address: z.string().optional(),

  rating: z
    .number()
    .int()
    .min(1, "Rating minimal 1")
    .max(5, "Rating maksimal 5")
    .default(3),

  distanceToHaram: z.string().optional(),

  facilities: z.string().optional(),

  isActive: z.boolean().default(true),
});

export type CreateHotelFormData = z.infer<typeof createHotelSchema>;

// =====================================================
// AIRLINE SCHEMA
// =====================================================
export const createAirlineSchema = z.object({
  name: z
    .string()
    .min(2, "Nama maskapai minimal 2 karakter")
    .max(100, "Nama maskapai maksimal 100 karakter"),

  code: z
    .string()
    .min(2, "Kode maskapai minimal 2 karakter")
    .max(5, "Kode maskapai maksimal 5 karakter")
    .toUpperCase(),

  logo: z.string().url().optional().nullable(),

  isActive: z.boolean().default(true),
});

export type CreateAirlineFormData = z.infer<typeof createAirlineSchema>;

// =====================================================
// AIRPORT SCHEMA
// =====================================================
export const createAirportSchema = z.object({
  name: z
    .string()
    .min(3, "Nama bandara minimal 3 karakter")
    .max(100, "Nama bandara maksimal 100 karakter"),

  code: z
    .string()
    .min(3, "Kode bandara harus 3 karakter")
    .max(4, "Kode bandara maksimal 4 karakter")
    .toUpperCase(),

  city: z.string().min(2, "Nama kota minimal 2 karakter"),

  country: z.string().default("Indonesia"),

  isActive: z.boolean().default(true),
});

export type CreateAirportFormData = z.infer<typeof createAirportSchema>;

// =====================================================
// BANK SCHEMA
// =====================================================
export const createBankSchema = z.object({
  bankName: z
    .string()
    .min(2, "Nama bank minimal 2 karakter")
    .max(50, "Nama bank maksimal 50 karakter"),

  accountNumber: z
    .string()
    .min(8, "Nomor rekening minimal 8 digit")
    .max(20, "Nomor rekening maksimal 20 digit")
    .regex(/^[0-9]+$/, "Nomor rekening hanya boleh angka"),

  accountName: z
    .string()
    .min(3, "Nama pemilik rekening minimal 3 karakter")
    .max(100, "Nama pemilik rekening maksimal 100 karakter"),

  logo: z.string().optional().nullable(),

  isActive: z.boolean().default(true),
});

export type CreateBankFormData = z.infer<typeof createBankSchema>;

// =====================================================
// COMPANY PROFILE SCHEMA
// =====================================================
export const updateCompanySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  ppiuNumber: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
});

export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
