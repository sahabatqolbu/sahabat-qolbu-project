// backend/src/db/schema.js

import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  datetime, // ✅ PASTIKAN ADA INI!
  mysqlEnum,
  decimal,
  date,
  index,
  uniqueIndex,
  json, // ✅ Opsional (kalo lu butuh)
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// =====================================================
// USERS TABLE (Multi-Role Auth)
// =====================================================
export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),

    role: mysqlEnum("role", [
      "ADMIN",
      "FINANCE",
      "STAFF",
      "AGEN",
      "JAMAAH",
      "CALON_JAMAAH",
    ])
      .notNull()
      .default("JAMAAH"),

    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    createdBy: int("created_by").references(() => users.id),

    // OTP Fields
    otp: varchar("otp", { length: 6 }),
    otpExpiry: timestamp("otp_expiry"),

    // Status
    isActive: boolean("is_active").notNull().default(true),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),

    // Metadata
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
    createdByIdx: index("created_by_idx").on(table.createdBy),
  }),
);

// =====================================================
// MASTER DATA TABLES
// =====================================================

// Master Hotel (Makkah & Madinah)
export const masterHotels = mysqlTable(
  "master_hotels",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    city: mysqlEnum("city", ["MAKKAH", "MADINAH"]).notNull(),
    address: text("address"),
    starRating: int("star_rating"), // 3, 4, 5 bintang
    distanceToHaram: int("distance_to_haram"), // dalam meter
    facilities: text("facilities"), // JSON string
    imageUrl: varchar("image_url", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    cityIdx: index("city_idx").on(table.city),
  }),
);

// Master Maskapai
export const masterAirlines = mysqlTable("master_airlines", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 10 }).notNull().unique(), // GA, SV, QZ
  name: varchar("name", { length: 255 }).notNull(),
  logo: varchar("logo", { length: 500 }),
  country: varchar("country", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Master Bandara
export const masterAirports = mysqlTable("master_airports", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 10 }).notNull().unique(), // CGK, JED, MED
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Master Dokumen Persyaratan
export const masterDocuments = mysqlTable("master_documents", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  category: mysqlEnum("category", [
    "IDENTITAS",
    "TRAVEL",
    "KESEHATAN",
    "LAINNYA",
  ]).notNull(),
  fileFormat: varchar("file_format", { length: 50 }),
  maxSizeMB: int("max_size_mb").default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Master Banks
export const masterBanks = mysqlTable("master_banks", {
  id: int("id").primaryKey().autoincrement(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  branch: varchar("branch", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

// Company Profile
export const companyProfile = mysqlTable("company_profile", {
  id: int("id").primaryKey().autoincrement(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  logo: varchar("logo", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 100 }),
  website: varchar("website", { length: 100 }),
  instagram: varchar("instagram", { length: 100 }),
  facebook: varchar("facebook", { length: 100 }),
  youtube: varchar("youtube", { length: 100 }),
  tiktok: varchar("tiktok", { length: 100 }),
  npwp: varchar("npwp", { length: 50 }),
  ppiu: varchar("ppiu", { length: 50 }),
  iata: varchar("iata", { length: 50 }),
  description: text("description"),
  vision: text("vision"),
  mission: text("mission"),
  philosophy: json("philosophy"),
  targetMarket: json("target_market"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

// =====================================================
// PACKAGES (Paket Umrah/Haji) - UPDATED
// =====================================================
export const packages = mysqlTable(
  "packages",
  {
    id: int("id").primaryKey().autoincrement(),

    // ===== BASIC INFO =====
    code: varchar("code", { length: 50 }).notNull().unique(), // UMR-2024-001
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", [
      "FULL_SERVICE", // Full Service
      "EXTREME",
      "SEMI_MANDIRI",
      "FLEKSIBILITAS",
      "KONSORSIUM",
      "LA", // Land Arrangement
    ])
      .notNull()
      .default("FULL_SERVICE"),

    // ===== DATES =====
    departureDate: date("departure_date").notNull(),
    returnDate: date("return_date").notNull(),
    duration: int("duration").notNull(), // hari (computed tapi disimpan)

    // ===== PRICING =====
    price: decimal("price", { precision: 15, scale: 2 }).notNull(),
    discountPrice: decimal("discount_price", { precision: 15, scale: 2 }),
    priceDouble: decimal("price_double", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceTriple: decimal("price_triple", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceQuad: decimal("price_quad", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    priceQuint: decimal("price_quint", { precision: 15, scale: 2 }).default(
      "0.00",
    ),

    // ===== SEAT MANAGEMENT =====
    totalSeats: int("total_seats").notNull().default(45),
    // bookedSeats akan di-compute dari jamaah_data, tidak perlu disimpan di sini

    // ===== FASILITAS & KETERANGAN =====
    facilities: text("facilities"), // bisa plain text atau JSON
    excludedFacilities: text("excluded_facilities"), // Tidak termasuk dalam paket
    notes: text("notes"), // Keterangan tambahan

    itineraryPdf: varchar("itinerary_pdf", { length: 500 }),

    // ===== AIRLINE INFO =====
    airlineId: int("airline_id"),
    airlineStatus: mysqlEnum("airline_status", [
      "PLANNING",
      "CONFIRMED",
    ]).default("PLANNING"),
    airlineIssuedDate: date("airline_issued_date"),

    // GANTI SEMUA INI (dari camelCase jadi snake_case):

    airlineTermin1Amount: decimal("airline_termin1_amount", {
      precision: 15,
      scale: 2,
    }).default("0"),
    airlineTermin1Date: date("airline_termin1_date"),
    airlineTermin1Status: mysqlEnum("airline_termin1_status", [
      "UNPAID",
      "PAID",
    ]).default("UNPAID"),

    airlineTermin2Amount: decimal("airline_termin2_amount", {
      precision: 15,
      scale: 2,
    }).default("0"),
    airlineTermin2Date: date("airline_termin2_date"),
    airlineTermin2Status: mysqlEnum("airline_termin2_status", [
      "UNPAID",
      "PAID",
    ]).default("UNPAID"),

    // ===== HOTEL MAKKAH =====
    hotelMakkahId: int("hotel_makkah_id"),
    hotelMakkahStatus: mysqlEnum("hotel_makkah_status", [
      "PLANNING",
      "CONFIRMED",
    ]).default("PLANNING"),
    hotelMakkahDouble: int("hotel_makkah_double").default(0),
    hotelMakkahTriple: int("hotel_makkah_triple").default(0),
    hotelMakkahQuad: int("hotel_makkah_quad").default(0),
    hotelMakkahQuint: int("hotel_makkah_quint").default(0),

    // ===== HOTEL MADINAH =====
    hotelMadinahId: int("hotel_madinah_id"),
    hotelMadinahStatus: mysqlEnum("hotel_madinah_status", [
      "PLANNING",
      "CONFIRMED",
    ]).default("PLANNING"),
    hotelMadinahDouble: int("hotel_madinah_double").default(0),
    hotelMadinahTriple: int("hotel_madinah_triple").default(0),
    hotelMadinahQuad: int("hotel_madinah_quad").default(0),
    hotelMadinahQuint: int("hotel_madinah_quint").default(0),

    // ===== DEPARTURE AIRPORT =====
    departureAirportId: int("departure_airport_id"),

    // ===== STATUS =====
    isActive: boolean("is_active").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(false),

    // ===== TIMESTAMPS =====
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    typeIdx: index("type_idx").on(table.type),
    departureIdx: index("departure_idx").on(table.departureDate),
    codeIdx: index("code_idx").on(table.code),
  }),
);

// =====================================================
// PACKAGE IMAGES (Multiple Brosur)
// =====================================================
export const packageImages = mysqlTable(
  "package_images",
  {
    id: int("id").primaryKey().autoincrement(),
    packageId: int("package_id").notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    caption: varchar("caption", { length: 255 }),
    sortOrder: int("sort_order").default(0),
    isPrimary: boolean("is_primary").default(false), // Gambar utama
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    packageIdx: index("package_idx").on(table.packageId),
  }),
);

// =====================================================
// PACKAGE ITINERARY (Agenda Perjalanan - Terpisah)
// =====================================================
export const packageItinerary = mysqlTable(
  "package_itinerary",
  {
    id: int("id").primaryKey().autoincrement(),
    packageId: int("package_id").notNull(),
    dayNumber: int("day_number").notNull(), // Hari ke-1, ke-2, dst
    title: varchar("title", { length: 255 }).notNull(), // "Keberangkatan Jakarta - Madinah"
    description: text("description"),
    activities: text("activities"), // JSON array: ["Kumpul di Bandara", "Check-in", ...]
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    packageIdx: index("package_idx").on(table.packageId),
    dayIdx: index("day_idx").on(table.dayNumber),
  }),
);

// =====================================================
// PROSPECT / CALON JAMAAH LEADS
// =====================================================
export const prospectJamaah = mysqlTable(
  "prospect_jamaah",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    followUpStatus: mysqlEnum("follow_up_status", [
      "BARU",
      "DIHUBUNGI",
      "TERTARIK",
      "BELUM_RESPON",
      "CONVERTED",
    ])
      .notNull()
      .default("BARU"),
    sourceType: mysqlEnum("source_type", [
      "GENERAL",
      "AGENT",
      "REFERRAL",
    ]).default("GENERAL"),
    sourceSlug: varchar("source_slug", { length: 150 }),
    sourceAgentId: int("source_agent_id").references(() => users.id),
    convertedJamaahId: int("converted_jamaah_id"),
    convertedAt: datetime("converted_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.followUpStatus),
    sourceIdx: index("source_idx").on(table.sourceType, table.sourceSlug),
  }),
);

export const prospectPackageInterests = mysqlTable(
  "prospect_package_interests",
  {
    id: int("id").primaryKey().autoincrement(),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospectJamaah.id, { onDelete: "cascade" }),
    packageId: int("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    actionType: mysqlEnum("action_type", [
      "SAVED",
      "WHATSAPP_CONSULT",
      "CONVERT_REQUEST",
    ]).notNull(),
    sourcePath: varchar("source_path", { length: 500 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prospectIdx: index("prospect_idx").on(table.prospectId),
    packageIdx: index("package_idx").on(table.packageId),
    actionIdx: index("action_idx").on(table.actionType),
  }),
);

export const prospectFollowUps = mysqlTable(
  "prospect_follow_ups",
  {
    id: int("id").primaryKey().autoincrement(),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospectJamaah.id, { onDelete: "cascade" }),
    actorUserId: int("actor_user_id")
      .notNull()
      .references(() => users.id),
    status: mysqlEnum("status", [
      "BARU",
      "DIHUBUNGI",
      "TERTARIK",
      "BELUM_RESPON",
      "CONVERTED",
    ]).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prospectIdx: index("prospect_idx").on(table.prospectId),
    actorIdx: index("actor_idx").on(table.actorUserId),
    statusIdx: index("status_idx").on(table.status),
  }),
);

// =====================================================
// TRANSACTIONS (Pembayaran Jamaah)
// =====================================================
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").primaryKey().autoincrement(),

    jamaahId: int("jamaah_id").notNull(),
    packageId: int("package_id").notNull(),

    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),

    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
    paidAmount: decimal("paid_amount", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    remainingAmount: decimal("remaining_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),

    commissionAmount: decimal("commission_amount", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    commissionStatus: mysqlEnum("commission_status", [
      "PENDING",
      "APPROVED",
      "PAID",
    ]).default("PENDING"),
    commissionPaidAt: timestamp("commission_paid_at"),

    paymentMethod: mysqlEnum("payment_method", [
      "BANK_TRANSFER",
      "CASH",
      "VIRTUAL_ACCOUNT",
      "QRIS",
    ]),
    paymentProof: varchar("payment_proof", { length: 500 }),

    status: mysqlEnum("status", [
      "PENDING",
      "PARTIAL",
      "PAID",
      "VERIFIED",
      "CANCELLED",
      "REFUNDED",
    ])
      .notNull()
      .default("PENDING"),

    verifiedBy: int("verified_by"),
    verifiedAt: timestamp("verified_at"),

    notes: text("notes"),

    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    jamaahIdx: index("jamaah_idx").on(table.jamaahId),
    statusIdx: index("status_idx").on(table.status),
    invoiceIdx: index("invoice_idx").on(table.invoiceNumber),
  }),
);

// =====================================================
// PAYMENT INSTALLMENTS (Cicilan)
// =====================================================
export const paymentInstallments = mysqlTable(
  "payment_installments",
  {
    id: int("id").primaryKey().autoincrement(),
    transactionId: int("transaction_id").notNull(),

    installmentNumber: int("installment_number").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),

    paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    paidAt: timestamp("paid_at"),

    status: mysqlEnum("status", ["PENDING", "PAID", "OVERDUE"])
      .notNull()
      .default("PENDING"),

    paymentProof: varchar("payment_proof", { length: 500 }),
    notes: text("notes"),

    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    transactionIdx: index("transaction_idx").on(table.transactionId),
  }),
);

// =====================================================
// ITIKAF PROGRAMS
// =====================================================
export const itikafPrograms = mysqlTable("itikaf_programs", {
  id: int("id").primaryKey().autoincrement(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  location: varchar("location", { length: 255 }).notNull(),
  maxParticipants: int("max_participants").notNull().default(50),
  registeredCount: int("registered_count").notNull().default(0),

  registrationFee: decimal("registration_fee", {
    precision: 12,
    scale: 2,
  }).notNull(),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// =====================================================
// ITIKAF PARTICIPANTS
// =====================================================
export const itikafParticipants = mysqlTable(
  "itikaf_participants",
  {
    id: int("id").primaryKey().autoincrement(),

    programId: int("program_id").notNull(),
    userId: int("user_id").notNull(),

    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),

    status: mysqlEnum("status", ["PENDING", "CONFIRMED", "CANCELLED"])
      .notNull()
      .default("PENDING"),

    paymentStatus: mysqlEnum("payment_status", ["UNPAID", "PAID"])
      .notNull()
      .default("UNPAID"),
    paymentProof: varchar("payment_proof", { length: 500 }),

    registeredAt: timestamp("registered_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    programIdx: index("program_idx").on(table.programId),
    userIdx: index("user_idx").on(table.userId),
  }),
);

// =====================================================
// AUDIT LOG
// =====================================================
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").primaryKey().autoincrement(),

    userId: int("user_id"),
    action: varchar("action", { length: 100 }).notNull(),
    module: varchar("module", { length: 50 }).notNull(),
    description: text("description"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    actionIdx: index("action_idx").on(table.action),
  }),
);

// =====================================================
// TESTIMONIALS
// =====================================================
export const testimonials = mysqlTable("testimonials", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }), // "Jamaah Umrah 2024"
  photo: varchar("photo", { length: 500 }),
  rating: int("rating").default(5),
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// =====================================================
// FAQ
// =====================================================
export const faqs = mysqlTable("faqs", {
  id: int("id").primaryKey().autoincrement(),
  category: mysqlEnum("category", [
    "UMRAH",
    "HAJI",
    "PAYMENT",
    "GENERAL",
  ]).default("GENERAL"),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

// =====================================================
// GALLERY/MEDIA
// =====================================================
export const gallery = mysqlTable("gallery", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  category: mysqlEnum("category", [
    "KEBERANGKATAN",
    "HOTEL",
    "MASJID",
    "KEGIATAN",
    "LAINNYA",
  ]).default("LAINNYA"),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// =====================================================
// ARTICLES / EDUCATIONAL CONTENT
// =====================================================
export const articles = mysqlTable(
  "articles",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: varchar("cover_image", { length: 500 }),
    category: mysqlEnum("category", [
      "UMRAH",
      "HOTEL",
      "MASKAPAI",
      "PANDUAN",
      "LAYANAN",
      "LAINNYA",
    ]).default("LAINNYA"),
    tags: json("tags"),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"])
      .notNull()
      .default("DRAFT"),
    relatedType: mysqlEnum("related_type", [
      "NONE",
      "HOTEL",
      "AIRLINE",
      "PACKAGE",
      "SERVICE",
    ])
      .notNull()
      .default("NONE"),
    relatedId: int("related_id"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    authorId: int("author_id").references(() => users.id),
    publishedAt: datetime("published_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
    statusIdx: index("status_idx").on(table.status),
    categoryIdx: index("category_idx").on(table.category),
    relatedIdx: index("related_idx").on(table.relatedType, table.relatedId),
  }),
);
// ===== TABEL 1: jamaah_data (BIODATA) =====
export const jamaahData = mysqlTable(
  "jamaah_data",
  {
    id: int("id").primaryKey().autoincrement(),

    // === RELATIONS ===
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    packageId: int("package_id").references(() => packages.id),
    agenId: int("agen_id").references(() => users.id),
    mahramId: int("mahram_id").references(() => jamaahData.id), // self-relation

    // === BOOKING INFO ===
    bookingNumber: varchar("booking_number", { length: 50 }).unique().notNull(),
    dateOfBooking: datetime("date_of_booking")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    namaMitra: varchar("nama_mitra", { length: 255 }),

    // === PAKET OPTIONS ===
    notePaket: mysqlEnum("note_paket", [
      "FULLSERVICE",
      "EXTREME",
      "KONSORSIUM",
      "B2B",
    ]).default("FULLSERVICE"),
    roomTypeMakkah: mysqlEnum("room_type_makkah", [
      "DOUBLE",
      "TRIPLE",
      "QUAD",
      "QUINT",
    ]),
    roomTypeMadinah: mysqlEnum("room_type_madinah", [
      "DOUBLE",
      "TRIPLE",
      "QUAD",
      "QUINT",
    ]),

    // === PRICING ===
    hargaPaket: decimal("harga_paket", { precision: 15, scale: 2 }).default(
      "0",
    ),
    potonganFeeAgen: decimal("potongan_fee_agen", {
      precision: 15,
      scale: 2,
    }).default("0"),
    potonganPoinAgen: decimal("potongan_poin_agen", {
      precision: 15,
      scale: 2,
    }).default("0"),
    potonganCashbackKK: decimal("potongan_cashback_kk", {
      precision: 15,
      scale: 2,
    }).default("0"),
    hargaFinal: decimal("harga_final", { precision: 15, scale: 2 }).default(
      "0",
    ),
    totalPayment: decimal("total_payment", { precision: 15, scale: 2 }).default(
      "0",
    ),
    outstanding: decimal("outstanding", { precision: 15, scale: 2 }).default(
      "0",
    ),

    // === PAYMENT STATUS ===
    statusPayment: mysqlEnum("status_payment", [
      "BELUM_BAYAR",
      "CICILAN",
      "LUNAS",
    ]).default("BELUM_BAYAR"),

    // === BIODATA ===
    namaPaspor: varchar("nama_paspor", { length: 255 }),
    nik: varchar("nik", { length: 20 }),
    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date"),
    gender: mysqlEnum("gender", ["PRIA", "WANITA"]),
    maritalStatus: mysqlEnum("marital_status", [
      "BELUM_MENIKAH",
      "MENIKAH",
      "CERAI",
      "DUDA_JANDA",
    ]),
    mahramRelation: mysqlEnum("mahram_relation", [
      "SUAMI",
      "ISTRI",
      "AYAH",
      "IBU",
      "ANAK",
      "SAUDARA_KANDUNG",
    ]),

    // === ALAMAT ===
    address: text("address"),
    province: varchar("province", { length: 100 }),
    city: varchar("city", { length: 100 }),
    district: varchar("district", { length: 100 }),
    postalCode: varchar("postal_code", { length: 10 }),

    // === PASPOR ===
    passportNumber: varchar("passport_number", { length: 50 }),
    passportIssueDate: date("passport_issue_date"),
    passportExpiry: date("passport_expiry"),
    passportIssuePlace: varchar("passport_issue_place", { length: 100 }),

    // === EMERGENCY CONTACT ===
    emergencyName: varchar("emergency_name", { length: 255 }),
    emergencyPhone: varchar("emergency_phone", { length: 20 }),
    emergencyRelation: varchar("emergency_relation", { length: 50 }),

    // === DOCUMENTS (URL) ===
    fotoUrl: varchar("foto_url", { length: 500 }),
    ktpUrl: varchar("ktp_url", { length: 500 }),
    kkUrl: varchar("kk_url", { length: 500 }),
    pasporUrl: varchar("paspor_url", { length: 500 }),
    bukuNikahUrl: varchar("buku_nikah_url", { length: 500 }),
    aktaLahirUrl: varchar("akta_lahir_url", { length: 500 }),
    ijazahUrl: varchar("ijazah_url", { length: 500 }),
    vaksinUrl: varchar("vaksin_url", { length: 500 }),
    meningitisUrl: varchar("meningitis_url", { length: 500 }),

    // Approval columns (tambah jika belum ada)
    approvedAt: timestamp("approved_at"),
    approvedBy: int("approved_by"),
    rejectedAt: timestamp("rejected_at"),
    rejectedBy: int("rejected_by"),
    rejectionReason: text("rejection_reason"),

    // === STATUS ===
    registrationStatus: mysqlEnum("registration_status", [
      "DRAFT",
      "PENDING_DOCUMENT",
      "PENDING_PAYMENT",
      "VERIFIED",
      "APPROVED",
      "REJECTED",
    ]).default("DRAFT"),
    isProfileComplete: boolean("is_profile_complete").default(false),

    // === NOTES & TIMESTAMPS ===
    notes: text("notes"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    bookingIdx: index("booking_idx").on(table.bookingNumber),
    nikIdx: index("nik_idx").on(table.nik),
    passportIdx: index("passport_idx").on(table.passportNumber),
    mahramIdx: index("mahram_idx").on(table.mahramId),
    packageIdx: index("package_idx").on(table.packageId),
    statusPaymentIdx: index("status_payment_idx").on(table.statusPayment),
  }),
);

// ===== TABEL 4: jamaah_payments (SUDAH ADA) =====
export const jamaahPayments = mysqlTable(
  "jamaah_payments",
  {
    id: int("id").primaryKey().autoincrement(),
    jamaahId: int("jamaah_id")
      .references(() => jamaahData.id)
      .notNull(),

    paymentNumber: int("payment_number").default(1),
    bankId: int("bank_id").references(() => masterBanks.id),
    paidBy: varchar("paid_by", { length: 255 }),
    paymentDate: datetime("payment_date"),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),

    // Verification
    proofStatus: mysqlEnum("proof_status", ["UPLOADED", "VERIFIED", "REJECTED"])
      .notNull()
      .default("UPLOADED"),
    verifiedBy: int("verified_by").references(() => users.id),
    verifiedAt: datetime("verified_at"),
    rejectedBy: int("rejected_by").references(() => users.id),
    rejectedAt: datetime("rejected_at"),
    rejectionReason: text("rejection_reason"),

    // Proof
    proofUrl: varchar("proof_url", { length: 500 }),
    notes: text("notes"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    jamaahIdx: index("jp_jamaah_idx").on(table.jamaahId),
    proofStatusIdx: index("jp_proof_status_idx").on(table.proofStatus),
    jamaahPaymentNumberUnique: uniqueIndex("jp_jamaah_payment_number_uq").on(
      table.jamaahId,
      table.paymentNumber,
    ),
  }),
);

// =====================================================
// AGEN PROFILES TABLE
// =====================================================
export const agenProfiles = mysqlTable(
  "agen_profiles",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .unique()
      .references(() => users.id),

    // === IDENTITAS ===
    namaKtp: varchar("nama_ktp", { length: 255 }),
    namaPanggilan: varchar("nama_panggilan", { length: 100 }),
    nik: varchar("nik", { length: 20 }),
    tempatLahir: varchar("tempat_lahir", { length: 100 }),
    tanggalLahir: date("tanggal_lahir"),

    // === ALAMAT ===
    alamat: text("alamat"),
    provinsi: varchar("provinsi", { length: 100 }),
    kota: varchar("kota", { length: 100 }),
    kodePos: varchar("kode_pos", { length: 10 }),

    // === SOCIAL MEDIA ===
    instagram: varchar("instagram", { length: 100 }),
    tiktok: varchar("tiktok", { length: 100 }),

    // === LEVEL & REFERRAL ===
    level: mysqlEnum("level", [
      "PRA_AGENT",
      "BASIC_AGENT",
      "SILVER_AGENT",
    ]).default("PRA_AGENT"),
    referralCode: varchar("referral_code", { length: 20 }).unique(),
    recruitedById: int("recruited_by_id").references(() => agenProfiles.id),

    // === TUJUAN BERGABUNG (JSON Array) ===
    tujuanBergabung: json("tujuan_bergabung"),

    // === DOKUMEN ===
    ktpUrl: varchar("ktp_url", { length: 500 }),
    buktiTfUrl: varchar("bukti_tf_url", { length: 500 }),

    // === BANK INFO ===
    namaRekening: varchar("nama_rekening", { length: 255 }),
    nomorRekening: varchar("nomor_rekening", { length: 50 }),
    namaBank: varchar("nama_bank", { length: 100 }),

    // === PERSYARATAN ===
    persyaratanAccepted: boolean("persyaratan_accepted").default(false),
    persyaratanAcceptedAt: datetime("persyaratan_accepted_at"),

    // === STATUS ===
    status: mysqlEnum("status", [
      "PENDING", // Baru dibuat, belum lengkap
      "PENDING_VERIFICATION", // Data lengkap, menunggu verifikasi
      "ACTIVE", // Disetujui, aktif
      "SUSPENDED", // Dinonaktifkan sementara
      "REJECTED", // Ditolak
    ]).default("PENDING"),

    // === VERIFICATION ===
    verifiedById: int("verified_by_id").references(() => users.id),
    verifiedAt: datetime("verified_at"),
    rejectionReason: text("rejection_reason"),

    // === PROFILE COMPLETENESS ===
    isProfileComplete: boolean("is_profile_complete").default(false),

    // === STATS ===
    totalJamaah: int("total_jamaah").default(0),
    totalKomisi: decimal("total_komisi", { precision: 15, scale: 2 }).default(
      "0",
    ),

    // === META ===
    notes: text("notes"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    referralCodeIdx: index("referral_code_idx").on(table.referralCode),
    statusIdx: index("status_idx").on(table.status),
    levelIdx: index("level_idx").on(table.level),
    recruitedByIdx: index("recruited_by_idx").on(table.recruitedById),
  }),
);

// =====================================================
// AGEN TRANSACTIONS TABLE (untuk komisi, dll)
// =====================================================
export const agenTransactions = mysqlTable(
  "agen_transactions",
  {
    id: int("id").primaryKey().autoincrement(),
    agenId: int("agen_id")
      .notNull()
      .references(() => agenProfiles.id),

    // === TYPE ===
    type: mysqlEnum("type", [
      "REGISTRATION_FEE", // Biaya pendaftaran (Silver/Basic)
      "KOMISI_JAMAAH", // Komisi dari jamaah
      "BONUS_REFERRAL", // Bonus dari rekrut agen
      "WITHDRAWAL", // Pencairan
    ]).notNull(),

    // === REFERENCE ===
    jamaahId: int("jamaah_id").references(() => jamaahData.id),
    referredAgenId: int("referred_agen_id").references(() => agenProfiles.id),

    // === AMOUNT ===
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    description: varchar("description", { length: 500 }),

    // === DATE & PROOF ===
    transactionDate: datetime("transaction_date").default(
      sql`CURRENT_TIMESTAMP`,
    ),
    proofUrl: varchar("proof_url", { length: 500 }),

    // === STATUS ===
    status: mysqlEnum("status", [
      "PENDING",
      "VERIFIED",
      "REJECTED",
      "PAID",
    ]).default("PENDING"),

    // === VERIFICATION ===
    verifiedById: int("verified_by_id").references(() => users.id),
    verifiedAt: datetime("verified_at"),
    notes: text("notes"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    agenIdx: index("agen_idx").on(table.agenId),
    typeIdx: index("type_idx").on(table.type),
    statusIdx: index("status_idx").on(table.status),
  }),
);

// =====================================================
// AGENT MASTER DATA - PHASE 1
// =====================================================

// ===== AGENT LEVELS (Pra-Agent, Bintang 1, Bintang 2) =====
export const agentLevels = mysqlTable(
  "agent_levels",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(), // "Pra-Agent", "Bintang 1", "Bintang 2"
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    star: int("star").notNull().unique(), // 0, 1, 2
    price: decimal("price", { precision: 15, scale: 2 }).notNull().default("0"),

    // Syarat Naik Bintang (via Closing)
    minClosing: int("min_closing"), // 1 untuk B1, 5 untuk B2
    maxPeriod: int("max_period"), // 3 untuk B1, 2 untuk B2

    // Syarat Bertahan
    maintainClosing: int("maintain_closing"), // Min 1 untuk B1
    maintainPeriod: int("maintain_period"), // 3 periode

    // Syarat Downgrade (untuk B2)
    downgradeClosing: int("downgrade_closing"), // Jika cuma 1 closing

    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    order: int("order").notNull().default(0),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
    starIdx: index("star_idx").on(table.star),
  }),
);

// ===== AGENT BENEFITS (Per Level) =====
export const agentBenefits = mysqlTable(
  "agent_benefits",
  {
    id: int("id").primaryKey().autoincrement(),
    agentLevelId: int("agent_level_id")
      .notNull()
      .references(() => agentLevels.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    order: int("order").notNull().default(0),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    levelIdx: index("level_idx").on(table.agentLevelId),
  }),
);

// ===== AGENT REQUIREMENTS (Persyaratan Wajib) =====
export const agentRequirements = mysqlTable("agent_requirements", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  order: int("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
});

// ===== AGENT PURPOSES (Tujuan Bergabung) =====
export const agentPurposes = mysqlTable(
  "agent_purposes",
  {
    id: int("id").primaryKey().autoincrement(),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    order: int("order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
  }),
);

// ===== PERIODS (Periode Closing) =====
export const periods = mysqlTable(
  "periods",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 100 }).notNull(), // "Januari 2024"
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
    duration: int("duration").notNull().default(30), // dalam hari
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    dateIdx: index("date_idx").on(table.startDate, table.endDate),
  }),
);

// ===== AGENT DATA (Extended dari agenProfiles - Data Lengkap Agen) =====
export const agentData = mysqlTable(
  "agent_data",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Data Pribadi
    fullNameKtp: varchar("full_name_ktp", { length: 255 }), // Wajib update
    nickname: varchar("nickname", { length: 100 }),
    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date"),
    nik: varchar("nik", { length: 20 }).unique(),

    // Alamat
    address: text("address"),
    province: varchar("province", { length: 100 }),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postal_code", { length: 10 }),

    // Sosial Media
    instagram: varchar("instagram", { length: 100 }),
    facebook: varchar("facebook", { length: 100 }), // ✅ TAMBAH INI
    tiktok: varchar("tiktok", { length: 100 }),
    youtube: varchar("youtube", { length: 100 }),

    // Landing Page Agen
    landingLogo: varchar("landing_logo", { length: 500 }),
    landingPrimaryColor: varchar("landing_primary_color", { length: 10 }),
    landingAccentColor: varchar("landing_accent_color", { length: 10 }),

    // Bintang & Level
    currentLevelId: int("current_level_id").references(() => agentLevels.id),
    currentStar: int("current_star").notNull().default(0), // 0, 1, 2
    starObtainedBy: mysqlEnum("star_obtained_by", ["PAYMENT", "CLOSING"]),

    // Sertifikat
    certificateNumber: varchar("certificate_number", { length: 100 }).unique(),
    certificateFile: varchar("certificate_file", { length: 500 }),
    certificateIssueDate: datetime("certificate_issue_date"),
    certificateValidFrom: datetime("certificate_valid_from"),
    certificateValidUntil: datetime("certificate_valid_until"),

    // ID Card
    idCardDesignFile: varchar("id_card_design_file", { length: 500 }),

    // Tracking Closing
    totalClosing: int("total_closing").notNull().default(0),
    lastClosingAt: datetime("last_closing_at"),

    // Referral
    referralCode: varchar("referral_code", { length: 50 }).unique(),
    recruiterCode: varchar("recruiter_code", { length: 50 }),
    recruiterName: varchar("recruiter_name", { length: 255 }),

    // Tujuan Bergabung (JSON array of IDs)
    purposes: json("purposes"), // [1, 3, 5]
    customPurpose: text("custom_purpose"),

    // Dokumen
    profilePhoto: varchar("profile_photo", { length: 500 }),
    ktpPhoto: varchar("ktp_photo", { length: 500 }),
    paymentProof: varchar("payment_proof", { length: 500 }),

    // Bank Info
    accountName: varchar("account_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 50 }),
    bankName: varchar("bank_name", { length: 100 }),

    // Status & Approval
    status: mysqlEnum("status", ["DRAFT", "PENDING", "APPROVED", "REJECTED"])
      .notNull()
      .default("DRAFT"),
    isComplete: boolean("is_complete").notNull().default(false),
    rejectionNote: text("rejection_note"),

    // Agreement (JSON array of requirement IDs)
    agreedRequirements: json("agreed_requirements"), // [1, 2, 3]
    agreedAt: datetime("agreed_at"),

    submittedAt: datetime("submitted_at"),
    approvedAt: datetime("approved_at"),
    approvedBy: int("approved_by").references(() => users.id),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    nikIdx: index("nik_idx").on(table.nik),
    statusIdx: index("status_idx").on(table.status),
    starIdx: index("star_idx").on(table.currentStar),
  }),
);

// ===== AGENT TRANSACTIONS (Pembayaran Biaya Agen) =====
export const agentPaymentTransactions = mysqlTable(
  "agent_payment_transactions",
  {
    id: int("id").primaryKey().autoincrement(),
    agentDataId: int("agent_data_id")
      .notNull()
      .references(() => agentData.id, { onDelete: "cascade" }),

    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    targetStar: int("target_star").notNull(), // 1 atau 2
    paymentDate: datetime("payment_date").notNull(),
    proof: varchar("proof", { length: 500 }),
    notes: text("notes"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    agentIdx: index("agent_idx").on(table.agentDataId),
  }),
);

// ===== AGENT CLOSING HISTORY (Track Closing Jamaah per Periode) =====
export const agentClosingHistory = mysqlTable(
  "agent_closing_history",
  {
    id: int("id").primaryKey().autoincrement(),
    agentDataId: int("agent_data_id")
      .notNull()
      .references(() => agentData.id, { onDelete: "cascade" }),

    jamaahDataId: int("jamaah_data_id")
      .notNull()
      .references(() => jamaahData.id), // Link ke jamaah_data
    periodId: int("period_id")
      .notNull()
      .references(() => periods.id),

    closingDate: datetime("closing_date")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    amount: decimal("amount", { precision: 15, scale: 2 }),
    notes: text("notes"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    agentIdx: index("agent_idx").on(table.agentDataId),
    periodIdx: index("period_idx").on(table.periodId),
    jamaahIdx: index("jamaah_idx").on(table.jamaahDataId),
  }),
);

// ===== AGENT STAR HISTORY (Track Perubahan Bintang) =====
export const agentStarHistory = mysqlTable(
  "agent_star_history",
  {
    id: int("id").primaryKey().autoincrement(),
    agentDataId: int("agent_data_id")
      .notNull()
      .references(() => agentData.id, { onDelete: "cascade" }),

    fromStar: int("from_star").notNull(), // Dari bintang berapa
    toStar: int("to_star").notNull(), // Ke bintang berapa
    reason: varchar("reason", { length: 100 }).notNull(), // "PAYMENT", "CLOSING_UPGRADE", "CLOSING_DOWNGRADE", "NO_CLOSING"
    notes: text("notes"),

    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    agentIdx: index("agent_idx").on(table.agentDataId),
  }),
);

// =====================================================
// NOTIFICATIONS TABLE
// =====================================================
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").primaryKey().autoincrement(),

    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // ✅ UPDATE TYPE ENUM
    type: mysqlEnum("type", [
      // Agent notifications
      "AGENT_REGISTERED",
      "AGENT_SUBMITTED",
      "AGENT_APPROVED",
      "AGENT_REJECTED",
      // Jamaah notifications
      "JAMAAH_REGISTERED",
      "JAMAAH_SUBMITTED",
      "JAMAAH_APPROVED",
      // Payment notifications
      "PAYMENT_CREATED",
      "PAYMENT_VERIFIED",
      "BOOKING_CREATED",
      // System
      "SYSTEM",
      // ✅ REMINDER TYPES (BARU)
      "REMINDER_DOCUMENT",
      "REMINDER_PAYMENT",
      "REMINDER_PROFILE",
      "REMINDER_GENERAL",
      "AGENT_KTP_REUPLOAD",
      "AGENT_DOCS_REQUEST",
    ]).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 500 }),
    referenceId: int("reference_id"),
    referenceType: varchar("reference_type", { length: 50 }),

    isRead: boolean("is_read").notNull().default(false),
    readAt: datetime("read_at"),

    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    typeIdx: index("type_idx").on(table.type),
    isReadIdx: index("is_read_idx").on(table.isRead),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  }),
);

// =====================================================
// CALENDAR EVENTS TABLE
// =====================================================
export const calendarEvents = mysqlTable(
  "calendar_events",
  {
    id: int("id").primaryKey().autoincrement(),

    // Basic Info
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 255 }),

    // Type
    type: mysqlEnum("type", [
      "PACKAGE", // Auto: range paket (departure-return)
      "ITINERARY", // Manual: jadwal detail dalam paket (per hari)
      "DEADLINE", // Manual: deadline pengumpulan/pelunasan
      "MANASIK", // Manual: acara manasik
      "MEETING", // Manual: meeting internal
      "EVENT", // Manual: event umum
      "ANNOUNCEMENT", // Manual: pengumuman
      "OTHER", // Manual: lainnya
    ])
      .notNull()
      .default("EVENT"),

    // Date & Time
    startDate: date("start_date").notNull(),
    endDate: date("end_date"), // null = single day, untuk PACKAGE = return date
    startTime: varchar("start_time", { length: 10 }), // "09:00"
    endTime: varchar("end_time", { length: 10 }), // "17:00"
    isAllDay: boolean("is_all_day").default(true),

    // Day number dalam paket (untuk ITINERARY)
    dayNumber: int("day_number"), // Day 1, Day 2, dst

    // Lokasi detail (untuk ITINERARY)
    city: mysqlEnum("city", [
      "JAKARTA",
      "MADINAH",
      "MAKKAH",
      "JEDDAH",
      "OTHER",
    ]),

    // Relation to Package
    packageId: int("package_id").references(() => packages.id, {
      onDelete: "cascade",
    }),

    // Icon/Emoji untuk display
    icon: varchar("icon", { length: 10 }).default("📅"),

    // Visibility
    visibility: mysqlEnum("visibility", [
      "ALL", // Semua (Admin, Agen, Jamaah)
      "ADMIN_AGEN", // Admin & Agen saja
      "ADMIN_ONLY", // Admin saja
      "PACKAGE_MEMBERS", // Jamaah & Agen paket terkait saja
    ]).default("ALL"),

    // Styling
    color: varchar("color", { length: 20 }).default("blue"),

    // Reminder (H-berapa kirim notifikasi, null = no reminder)
    reminderDays: int("reminder_days"),
    reminderSent: boolean("reminder_sent").default(false),

    // Sorting
    sortOrder: int("sort_order").default(0),

    // Meta
    createdBy: int("created_by").references(() => users.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    startDateIdx: index("start_date_idx").on(table.startDate),
    endDateIdx: index("end_date_idx").on(table.endDate),
    typeIdx: index("type_idx").on(table.type),
    packageIdx: index("package_idx").on(table.packageId),
    dayNumberIdx: index("day_number_idx").on(table.dayNumber),
  }),
);
