// backend/server.js
import app from "./src/app.js";
import { testConnection, ensureSchemaCompatibility } from "./src/db/index.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./src/utils/logger.js";

dotenv.config();

// Default to 5000 to match dashboard's dev config
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  const required = [
    "JWT_SECRET",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error("Missing required environment variables:", null, {
      missing,
    });
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  logger.info("✅ Environment variables validated");
};

/**
 * Ensure upload directories exist
 */
const ensureUploadDirs = () => {
  const baseUploadDir = path.join(__dirname, "public/uploads");

  const uploadDirs = [
    baseUploadDir,
    path.join(baseUploadDir, "company"),
    path.join(baseUploadDir, "hotels"),
    path.join(baseUploadDir, "airlines"),
    path.join(baseUploadDir, "packages"),
    path.join(baseUploadDir, "documents"),
    path.join(baseUploadDir, "profiles"),
    path.join(baseUploadDir, "payments"),
    path.join(baseUploadDir, "itinerary"),
    path.join(baseUploadDir, "jamaah"),
    path.join(baseUploadDir, "agents"),
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info("Created upload directory", { path: dir });
    }
  });

  logger.info("✅ Upload directories verified");
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Validate environment
    validateEnvironment();

    // Test database connection
    logger.info("Testing database connection...");
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }
    
    logger.info("✅ Database connected successfully");

    // Backward-compatible schema guard
    await ensureSchemaCompatibility();

    // Ensure upload directories
    ensureUploadDirs();

    // Start server
    app.listen(PORT, () => {
      logger.info("🚀 Server started", {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
      });
      
      if (NODE_ENV === "development") {
        logger.info(`📡 API running at http://localhost:${PORT}/api`);
        logger.info(`💊 Health check at http://localhost:${PORT}/health`);
      }
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", reason instanceof Error ? reason : new Error(String(reason)), {
    promise,
  });
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start server
startServer();
