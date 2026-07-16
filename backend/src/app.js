// backend/src/app.js
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";
import {
  corsOptions,
  helmetOptions,
  requestId,
  isTrustedOrigin,
} from "./config/security.js";
import cors from "cors";
import helmet from "helmet";
import {
  authenticatedApiLimiter,
  publicReadLimiter,
} from "./middlewares/rateLimiter.js";
import {
  forbiddenResponse,
  notFoundResponse,
} from "./utils/response.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Ensure req.ip uses X-Forwarded-For behind a proxy (nginx/vercel/etc.)
// Configure via env TRUST_PROXY ("true", "false", or a number like "1").
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv === "true") {
  app.set("trust proxy", true);
} else if (trustProxyEnv === "false") {
  app.set("trust proxy", false);
} else if (trustProxyEnv) {
  const hopCount = Number.parseInt(trustProxyEnv, 10);
  if (Number.isFinite(hopCount)) {
    app.set("trust proxy", hopCount);
  }
} else if (process.env.NODE_ENV === "production") {
  // Sensible default for typical single reverse-proxy setups.
  app.set("trust proxy", 1);
}

logger.info("🚀 Application starting...");

// ===== SECURITY MIDDLEWARE =====

// 1. Request ID for tracing
app.use(requestId);

// 2. Helmet security headers
app.use(helmet(helmetOptions));

// 3. CORS configuration
app.use(cors(corsOptions));

// 4. Body parsers with safer defaults
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());

// 5. Rate limiting
const PUBLIC_API_PREFIXES = ["/public", "/packages", "/agents", "/health-check"];

const isPublicApiPath = (pathname) =>
  PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const applyApiRateLimit = (req, res, next) => {
  const normalizedPath = String(req.path || "/").replace(/^\/v1(?=\/|$)/, "") || "/";

  if (normalizedPath === "/auth" || normalizedPath.startsWith("/auth/")) {
    return next();
  }

  if (isPublicApiPath(normalizedPath)) {
    return publicReadLimiter(req, res, next);
  }

  return authenticatedApiLimiter(req, res, next);
};

app.use("/api", applyApiRateLimit);

// 6. Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 7. Static files
const uploadsPath = path.join(__dirname, "../public/uploads");
logger.info("Static files path configured", { path: path.resolve(uploadsPath) });

const csrfProtectedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const csrfProtection = (req, res, next) => {
  if (!csrfProtectedMethods.has(req.method)) {
    return next();
  }

  const hasAuthCookie = Boolean(req.cookies?.access_token);
  if (!hasAuthCookie) {
    return next();
  }

  const origin = req.get("origin");
  const referer = req.get("referer");
  const fetchSite = req.get("sec-fetch-site");

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return forbiddenResponse(
      res,
      "Permintaan ditolak karena sumber request tidak valid",
      "SECURITY_INVALID_ORIGIN"
    );
  }

  if (!origin && !referer) {
    return forbiddenResponse(
      res,
      "Permintaan ditolak karena origin/referer tidak tersedia",
      "SECURITY_ORIGIN_REQUIRED"
    );
  }

  if (isTrustedOrigin(origin) || isTrustedOrigin(referer)) {
    return next();
  }

  return forbiddenResponse(
    res,
    "Permintaan ditolak karena validasi keamanan origin gagal",
    "SECURITY_INVALID_ORIGIN"
  );
};

app.use(csrfProtection);

const blockApiDocsExposure = (req, res, next) => {
  const lowerPath = String(req.path || "").toLowerCase();
  const blockedPrefixes = [
    "/api/openapi",
    "/api/docs",
    "/api/swagger",
    "/api/v1/openapi",
    "/api/v1/docs",
    "/api/v1/swagger",
  ];

  if (blockedPrefixes.some((prefix) => lowerPath.startsWith(prefix))) {
    return forbiddenResponse(
      res,
      "Dokumentasi API publik dinonaktifkan",
      "SECURITY_DOCS_DISABLED"
    );
  }

  return next();
};

app.use(blockApiDocsExposure);

const publicUploadsOnly = (req, res, next) => {
  // Restrict static access to public asset folders only.
  // Sensitive folders (agents/jamaah/documents/payments/profiles) must be served
  // via authenticated endpoints.
  const normalizedPath = String(req.path || "/").replace(/^\/+/, "");
  const folder = normalizedPath.split("/")[0].toLowerCase();

  // Route prefix differences:
  // - /uploads/*  -> req.path starts with "folder/..."
  // - /api/uploads/* -> req.path may start with "uploads/folder/..."
  const effectiveFolder =
    folder === "uploads"
      ? normalizedPath.split("/")[1]?.toLowerCase() || ""
      : folder;

  const publicFolders = new Set([
    "company",
    "hotels",
    "airlines",
    "packages",
    "itinerary",
    "general",
    "gallery",
    "articles",
  ]);

  const protectedFolders = new Set([
    "profiles",
    "jamaah",
    "agents",
    "documents",
    "payments",
  ]);

  if (!effectiveFolder || publicFolders.has(effectiveFolder)) {
    return next();
  }

  if (protectedFolders.has(effectiveFolder)) {
    return forbiddenResponse(
      res,
      "Akses file sensitif wajib melalui endpoint terproteksi"
    );
  }

  return forbiddenResponse(res, "Akses folder upload tidak diizinkan");
};

// ✅ Serve untuk /uploads (tanpa /api)
app.use(
  "/uploads",
  publicUploadsOnly,
  express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
  })
);

// ✅ JUGA serve untuk /api/uploads
app.use(
  "/api/uploads",
  publicUploadsOnly,
  express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
  })
);

// 8. Health check
import { getEmailStats } from "./utils/email.js";

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.get("/health/detailed", async (req, res) => {
  const emailQueueStats = await getEmailStats();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    emailQueue: emailQueueStats,
  });
});

app.get("/api", (req, res) => res.json({ message: "Sahabat Qolbu API" }));

// ===== 9. API ROUTES (INI YANG PENTING!) =====
import apiRoutes from "./routes/api.js";
import protectedUploadsRoutes from "./routes/protectedUploads.js";
app.use("/api", apiRoutes);
app.use("/api/protected-uploads", protectedUploadsRoutes);
app.use("/api/v1", apiRoutes);
app.use("/api/v1/protected-uploads", protectedUploadsRoutes);

// ===== 10. 404 HANDLER =====
app.use((req, res) => {
  logger.info("404 - Endpoint not found", { 
    method: req.method, 
    path: req.path,
    requestId: req.id 
  });
  return notFoundResponse(res, `Endpoint ${req.method} ${req.path} tidak ditemukan`);
});

// ===== 11. ERROR HANDLER (MUST BE LAST) =====
import { errorHandler } from "./middlewares/errorHandler.js";
app.use(errorHandler);

logger.info("✅ Application middleware configured successfully");

export default app;

