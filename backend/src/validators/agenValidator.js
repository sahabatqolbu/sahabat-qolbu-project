import { z } from "zod";

// =====================================================
// CREATE JAMAAH ACCOUNT SCHEMA
// =====================================================
export const createJamaahSchema = z.object({
  fullName: z
    .string({ required_error: "Nama lengkap wajib diisi" })
    .min(3, "Nama minimal 3 karakter")
    .max(255, "Nama maksimal 255 karakter"),

  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),

  phone: z
    .string({ required_error: "Nomor HP wajib diisi" })
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor HP tidak valid"),

  packageId: z
    .number({ required_error: "Paket wajib dipilih" })
    .int("Paket ID harus integer")
    .positive("Paket ID harus positif"),

  roomType: z
    .enum(["QUAD", "TRIPLE", "DOUBLE"], {
      errorMap: () => ({ message: "Tipe kamar tidak valid" }),
    })
    .optional(),
});
