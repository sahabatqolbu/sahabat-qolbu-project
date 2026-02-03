// backend/server.js
import app from "./src/app.js";
import { testConnection } from "./src/db/index.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories
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
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  });
};

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Database connection failed");
      process.exit(1);
    }

    ensureUploadDirs();

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
};

startServer();
