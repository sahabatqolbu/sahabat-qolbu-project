// backend/src/app.js
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";
import { corsOptions, helmetOptions, requestId } from "./config/security.js";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middlewares/rateLimiter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

logger.info("🚀 Application starting...");

// ===== SECURITY MIDDLEWARE =====

// 1. Request ID for tracing
app.use(requestId);

// 2. Helmet security headers
app.use(helmet(helmetOptions));

// 3. CORS configuration
app.use(cors(corsOptions));

// 4. General rate limiting
app.use("/api/", apiLimiter);

// 5. Body parsers with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 6. Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 7. Static files
const uploadsPath = path.join(__dirname, "../public/uploads");
logger.info("Static files path configured", { path: path.resolve(uploadsPath) });

// ✅ Serve untuk /uploads (tanpa /api)
app.use(
  "/uploads",
  express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
  })
);

// ✅ JUGA serve untuk /api/uploads
app.use(
  "/api/uploads",
  express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
  })
);

// 8. Health check
app.get("/health", (req, res) => res.json({ status: "OK" }));
app.get("/api", (req, res) => res.json({ message: "Sahabat Qolbu API" }));

// ===== 9. API ROUTES (INI YANG PENTING!) =====
import apiRoutes from "./routes/api.js";
app.use("/api", apiRoutes);

// ===== 10. 404 HANDLER =====
app.use((req, res) => {
  logger.info("404 - Endpoint not found", { 
    method: req.method, 
    path: req.path,
    requestId: req.id 
  });
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
  });
});

// ===== 11. ERROR HANDLER (MUST BE LAST) =====
import { errorHandler } from "./middlewares/errorHandler.js";
app.use(errorHandler);

logger.info("✅ Application middleware configured successfully");

export default app;
