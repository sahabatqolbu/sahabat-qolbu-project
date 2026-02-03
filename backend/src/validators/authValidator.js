import { z } from "zod";

// =====================================================
// LOGIN SCHEMA
// =====================================================
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(1, "Password wajib diisi"),
});

// =====================================================
// VERIFY OTP SCHEMA
// =====================================================
export const verifyOTPSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
  otp: z
    .string({ required_error: "OTP wajib diisi" })
    .length(6, "OTP harus 6 digit")
    .regex(/^\d+$/, "OTP harus berupa angka"),
});

// =====================================================
// REQUEST OTP SCHEMA
// =====================================================
export const requestOTPSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format email tidak valid"),
});

// =====================================================
// VALIDATION MIDDLEWARE
// =====================================================
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate body directly
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData; // Replace body with validated data
      next();
    } catch (error) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors,
      });
    }
  };
};
