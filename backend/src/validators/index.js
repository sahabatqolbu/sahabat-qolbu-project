import z from "zod";
import { isPaymentProofPathValid } from "../utils/paymentProofPolicy.js";
import { errorResponse } from "../utils/response.js";

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

  resetPassword: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    otp: z.string().length(6, messages.otp.length),
    newPassword: z
      .string()
      .min(8, messages.password.min)
      .max(128, messages.password.max)
      .regex(patterns.password, messages.password.pattern),
  }),

  registerCalonJamaah: z.object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    phone: z.string().regex(patterns.phone, "Format nomor WhatsApp tidak valid"),
    password: z
      .string()
      .min(8, messages.password.min)
      .max(128, messages.password.max)
      .regex(patterns.password, messages.password.pattern),
    confirmPassword: z.string(),
    sourceType: z.enum(["GENERAL", "AGENT", "REFERRAL"]).optional().default("GENERAL"),
    sourceSlug: z.string().max(150).optional().nullable(),
    honeypot: z.string().max(0).optional().default(""),
    formStartedAt: z.coerce.number().optional(),
  }).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Konfirmasi password tidak sama",
      });
    }
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
    role: z
      .enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"])
      .default("JAMAAH"),
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

export const adminUserSchemas = {
  create: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
    phone: z.string().regex(patterns.phone, "Format nomor telepon tidak valid"),
    role: z.enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"]),
    packageId: z.union([z.string(), z.number()]).optional(),
  }),
  update: z.object({
    fullName: z.string().min(2).max(255).optional(),
    phone: z.string().regex(patterns.phone, "Format nomor telepon tidak valid").optional().nullable(),
    role: z
      .enum(["ADMIN", "FINANCE", "STAFF", "AGEN", "JAMAAH", "CALON_JAMAAH"])
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export const staffSchemas = {
  create: z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid)
      .transform((val) => val.toLowerCase().trim()),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(255),
    phone: z
      .string()
      .regex(patterns.phone, "Format nomor telepon tidak valid")
      .optional()
      .nullable(),
  }),
  update: z.object({
    fullName: z.string().min(2).max(255).optional(),
    phone: z
      .string()
      .regex(patterns.phone, "Format nomor telepon tidak valid")
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
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

export const jamaahAdminSchemas = {
  bookingParams: z.object({
    bookingNumber: z.string().min(3).max(50),
  }),

  paymentParams: z.object({
    paymentId: z.coerce.number().int().positive(),
  }),

  rejectPayment: z.object({
    reason: z
      .string()
      .min(3, "Alasan penolakan minimal 3 karakter")
      .max(500, "Alasan penolakan maksimal 500 karakter"),
  }),

  create: z.object({
    userId: z.union([z.string(), z.number()]).optional().nullable(),
    packageId: z.union([z.string(), z.number()]).optional().nullable(),
    namaMitra: z.string().max(255).optional().nullable(),
    notePaket: z.string().max(100).optional().nullable(),
    roomTypeMakkah: z.string().max(50).optional().nullable(),
    roomTypeMadinah: z.string().max(50).optional().nullable(),
    hargaPaket: z.union([z.string(), z.number()]).optional().nullable(),
    potonganFeeAgen: z.union([z.string(), z.number()]).optional().nullable(),
    potonganPoinAgen: z.union([z.string(), z.number()]).optional().nullable(),
    potonganCashbackKK: z
      .union([z.string(), z.number()])
      .optional()
      .nullable(),
  }),

  update: z.object({
    namaPaspor: z.string().max(255).optional().nullable(),
    nik: z.string().max(32).optional().nullable(),
    birthPlace: z.string().max(100).optional().nullable(),
    birthDate: z.union([z.string(), z.date()]).optional().nullable(),
    gender: z.enum(["PRIA", "WANITA"]).optional().nullable(),
    maritalStatus: z
      .enum(["BELUM_MENIKAH", "MENIKAH", "CERAI", "DUDA_JANDA"])
      .optional()
      .nullable(),
    address: z.string().max(500).optional().nullable(),
    province: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    district: z.string().max(100).optional().nullable(),
    postalCode: z.string().max(20).optional().nullable(),
    passportNumber: z.string().max(50).optional().nullable(),
    passportIssueDate: z.union([z.string(), z.date()]).optional().nullable(),
    passportExpiry: z.union([z.string(), z.date()]).optional().nullable(),
    passportIssuePlace: z.string().max(100).optional().nullable(),
    emergencyName: z.string().max(255).optional().nullable(),
    emergencyPhone: z.string().max(30).optional().nullable(),
    emergencyRelation: z.string().max(100).optional().nullable(),
    packageId: z.union([z.string(), z.number()]).optional().nullable(),
    agenId: z.union([z.string(), z.number()]).optional().nullable(),
    namaMitra: z.string().max(255).optional().nullable(),
    notePaket: z.string().max(100).optional().nullable(),
    roomTypeMakkah: z.string().max(50).optional().nullable(),
    roomTypeMadinah: z.string().max(50).optional().nullable(),
    hargaPaket: z.union([z.string(), z.number()]).optional().nullable(),
    potonganFeeAgen: z.union([z.string(), z.number()]).optional().nullable(),
    potonganPoinAgen: z.union([z.string(), z.number()]).optional().nullable(),
    potonganCashbackKK: z
      .union([z.string(), z.number()])
      .optional()
      .nullable(),
    registrationStatus: z
      .enum([
        "DRAFT",
        "PENDING_DOCUMENT",
        "PENDING_PAYMENT",
        "VERIFIED",
        "APPROVED",
        "REJECTED",
      ])
      .optional(),
    mahramId: z.union([z.string(), z.number()]).optional().nullable(),
    mahramRelation: z.string().max(100).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),

  addPayment: z.object({
    amount: z.coerce.number().positive("Jumlah pembayaran harus positif"),
    bankId: z.coerce.number().int().positive().optional().nullable(),
    paidBy: z.string().max(255).optional().nullable(),
    paymentDate: z.union([z.string(), z.date()]).optional().nullable(),
    proofUrl: z.string().max(500).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }).superRefine((data, ctx) => {
    if (data.proofUrl && !isPaymentProofPathValid(data.proofUrl)) {
      ctx.addIssue({
        path: ["proofUrl"],
        code: z.ZodIssueCode.custom,
        message:
          "proofUrl tidak valid. Gunakan path bukti pembayaran dari folder /uploads/payments",
      });
    }
  }),

  approveRejectRevert: z.object({
    reason: z.string().max(500).optional(),
  }).optional().default({}),
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

export const transactionSchemas = {
  verifyStatus: z.object({
    status: z.enum([
      "PENDING",
      "PARTIAL",
      "PAID",
      "VERIFIED",
      "CANCELLED",
      "REFUNDED",
    ]),
    remarks: z.string().max(500).optional(),
  }).superRefine((data, ctx) => {
    const requiresReason = ["CANCELLED", "REFUNDED"];
    if (requiresReason.includes(data.status) && (!data.remarks || data.remarks.trim() === "")) {
      ctx.addIssue({
        path: ["remarks"],
        code: z.ZodIssueCode.custom,
        message: `Alasan wajib diisi untuk status ${data.status}`,
      });
    }
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
        const zodIssues = error.issues || error.errors || [];
        const errors = zodIssues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));
        
        return errorResponse(
          res,
          "Validasi gagal. Periksa kembali input Anda.",
          400,
          errors,
          "VALIDATION_FAILED"
        );
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
        const zodIssues = error.issues || error.errors || [];
        const errors = zodIssues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        
        return errorResponse(
          res,
          "Parameter query tidak valid",
          400,
          errors,
          "VALIDATION_FAILED"
        );
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
        const zodIssues = error.issues || error.errors || [];
        const errors = zodIssues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        
        return errorResponse(
          res,
          "Parameter URL tidak valid",
          400,
          errors,
          "VALIDATION_FAILED"
        );
      }
      next(error);
    }
  };
};
