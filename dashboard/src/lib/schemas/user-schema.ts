// dashboard/src/lib/schemas/user-schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter"),

  email: z.string().email("Format email tidak valid").toLowerCase(),

  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(/^[0-9+]+$/, "Nomor HP hanya boleh angka dan tanda +"),

  role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH"]),

  packageId: z.number().int().positive().optional(),
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .optional(),

  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(/^[0-9+]+$/, "Nomor HP hanya boleh angka dan tanda +")
    .optional(),

  role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH"]).optional(), // ✅ TAMBAH STAFF

  isActive: z.boolean().optional(),

  packageId: z.number().int().positive().optional().nullable(), // ✅ TAMBAH .nullable()
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
