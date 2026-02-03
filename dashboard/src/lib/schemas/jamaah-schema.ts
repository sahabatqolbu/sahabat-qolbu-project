// dashboard/src/lib/schemas/jamaah-schema.ts
import { z } from "zod";

export const createJamaahSchema = z.object({
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

  packageId: z
    .number()
    .int()
    .positive("Pilih paket yang valid"),

  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type CreateJamaahFormData = z.infer<typeof createJamaahSchema>;
