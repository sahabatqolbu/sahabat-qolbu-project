import z from "zod";

// Re-export z for use in other files
export { z };

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[0-9+\-\s()]{8,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

// Error messages
const messages = {
  email: {
    invalid: "Format email tidak valid",
    required: "Email wajib diisi",
  },
  password: {
    min: "Password minimal 8 karakter",
    max: "Password maksimal 128 karakter",
    pattern: "Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus",
    required: "Password wajib diisi",
  },
  otp: {
    length: "OTP harus 6 digit",
    required: "OTP wajib diisi",
    format: "OTP hanya boleh berisi angka",
  },
  required: (field) => `${field} wajib diisi`,
};

/**
 * Auth validation schemas
 */
export const authSchemas = {
  login: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    password: z.string().min(1, messages.password.required),
  }),

  verifyOTP: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    otp: z
      .string()
      .length(6, messages.otp.length)
      .regex(/^\d+$/, messages.otp.format),
  }),

  requestOTP: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
  }),

  changePassword: z.object({
    otp: z.string().length(6, messages.otp.length),
    newPassword: z
      .string()
      .min(8, messages.password.min)
      .max(128, messages.password.max)
      .regex(patterns.password, messages.password.pattern),
  }),

  changeEmail: z.object({
    otp: z.string().length(6, messages.otp.length),
    newEmail: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
  }),

  forgotPassword: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
  }),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  create: z.object({
    email: z
      .string()
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, messages.password.min)
      .max(128, messages.password.max)
      .regex(patterns.password, messages.password.pattern),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
    phone: z.string().regex(patterns.phone, "Format nomor telepon tidak valid").optional().nullable(),
    role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH"]).default("JAMAAH"),
  }),

  update: z.object({
    fullName: z.string().min(2).max(255).optional(),
    phone: z.string().regex(patterns.phone, "Format nomor telepon tidak valid").optional().nullable(),
    isActive: z.boolean().optional(),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2, "Nama minimal 2 karakter").max(255).optional(),
    phone: z.string().regex(patterns.phone, "Format telepon tidak valid").optional().nullable(),
  }),
};

/**
 * Jamaah validation schemas
 */
export const jamaahSchemas = {
  create: z.object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
    email: z
      .string()
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    phone: z.string().regex(patterns.phone, "Format telepon tidak valid"),
    packageId: z.number().int().positive("Package ID harus valid"),
  }),

  update: z.object({
    fullName: z.string().min(2).max(255).optional(),
    phone: z.string().regex(patterns.phone, "Format telepon tidak valid").optional(),
    packageId: z.number().int().positive().optional(),
  }),

  addPayment: z.object({
    amount: z.number().positive("Jumlah harus positif"),
    method: z.enum(["TRANSFER", "CASH", "DEBIT", "CREDIT"]),
    notes: z.string().max(500).optional(),
  }),
};

/**
 * Package validation schemas
 */
export const packageSchemas = {
  create: z.object({
    name: z.string().min(3, "Nama paket minimal 3 karakter").max(255),
    description: z.string().max(2000).optional(),
    price: z.number().positive("Harga harus positif"),
    quota: z.number().int().positive("Kuota harus positif"),
    departureDate: z.string().datetime(),
    returnDate: z.string().datetime(),
  }),

  update: z.object({
    name: z.string().min(3).max(255).optional(),
    description: z.string().max(2000).optional(),
    price: z.number().positive().optional(),
    quota: z.number().int().positive().optional(),
  }),
};

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Validation middleware factory
 * Usage: router.post('/route', validate(schema), controller)
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate request body
      const validatedData = schema.parse(req.body);
      
      // Store validated data
      req.validatedBody = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));
        
        return res.status(400).json({
          success: false,
          message: "Validasi gagal. Periksa kembali input Anda.",
          errors,
        });
      }
      
      // Unexpected error
      next(error);
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: "Parameter query tidak valid",
          errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params);
      req.validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: "Parameter URL tidak valid",
          errors,
        });
      }
      next(error);
    }
  };
};
