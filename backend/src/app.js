// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

console.log("🔥 APP.JS LOADED");

// ===== MIDDLEWARE URUTAN YANG BENAR =====

// 1. Debug middleware (paling atas)
app.use((req, res, next) => {
  console.log("🔍 REQUEST:", req.method, req.path);
  next();
});

// 2. Security
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// 3. Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// 4. CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://sahabatqolbu.com",
        "https://dashboard.sahabatqolbu.com",
        "https://sahabat-qolbu-project.vercel.app",
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
      ];

      // Allow if no origin (like mobile apps or curl) or if in allowed list
      // Or if it's a Vercel preview/deployment URL
      if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        console.warn("🚫 CORS Blocked:", origin);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 5. Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 6. Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 7. Static files
const uploadsPath = path.join(__dirname, "../public/uploads");
console.log("📂 UPLOADS PATH:", path.resolve(uploadsPath));

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

// ===== 10. 404 HANDLER (DI BAWAH ROUTES) =====
app.use((req, res) => {
  console.log("❌ 404:", req.path);
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// ===== 11. ERROR HANDLER (PALING BAWAH) =====
import { errorHandler } from "./middlewares/errorHandler.js";
app.use(errorHandler);

export default app;
