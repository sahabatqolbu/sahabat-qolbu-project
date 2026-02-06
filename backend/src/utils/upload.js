// backend/src/utils/upload.js
import multer from "multer";
import { Jimp } from "jimp";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_BASE = path.join(__dirname, "../../public/uploads");

logger.info("Upload directory initialized", { path: path.resolve(UPLOAD_BASE) });

// =====================================================
// SECURITY: Generate safe filename
// =====================================================
const generateSafeFilename = (extension) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString("hex");
  return `${timestamp}-${randomBytes}${extension}`;
};

// =====================================================
// SECURITY: Sanitize filename
// =====================================================
const sanitizeFilename = (filename) => {
  // Remove path traversal attempts and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100); // Max 100 chars
};

// =====================================================
// MULTER STORAGE & FILTER
// =====================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|bmp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    logger.security("Invalid file type attempted", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      ip: req.ip,
    });
    cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP."));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 10, // Max 10 files per upload
  },
  fileFilter: fileFilter,
});

// =====================================================
// OPTIMIZE IMAGE (SINGLE) - WITH JIMP
// =====================================================
export const optimizeImage = (folder) => async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    logger.debug("No file to optimize, skipping...");
    return next();
  }

  try {
    // Validate folder name (prevent path traversal)
    const validFolders = [
      "company",
      "hotels",
      "airlines",
      "packages",
      "documents",
      "profiles",
      "payments",
      "itinerary",
      "jamaah",
      "general",
    ];

    if (!validFolders.includes(folder)) {
      logger.security("Invalid upload folder attempted", { folder, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: "Folder upload tidak valid",
      });
    }

    const filename = generateSafeFilename(".jpg");
    const uploadDir = path.join(UPLOAD_BASE, folder);
    const outputPath = path.join(uploadDir, filename);

    logger.debug("Optimizing image", { folder, filename });

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Process image with Jimp
    const image = await Jimp.read(req.file.buffer);

    // Resize if larger than 1000px
    if (image.getWidth() > 1000 || image.getHeight() > 1000) {
      image.scaleToFit(1000, 1000);
    }

    // Compress & save as JPEG
    await image.quality(80).writeAsync(outputPath);

    req.uploadedFile = {
      filename: filename,
      path: `/uploads/${folder}/${filename}`,
      size: req.file.size,
      mimeType: "image/jpeg",
      originalName: sanitizeFilename(req.file.originalname),
    };

    logger.info("Image optimized successfully", { path: req.uploadedFile.path });
    next();
  } catch (error) {
    logger.error("Image optimization error", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengoptimasi gambar",
    });
  }
};

// =====================================================
// OPTIMIZE MULTIPLE IMAGES - WITH JIMP
// =====================================================
export const optimizeMultipleImages = (folder = "general") => {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
      // Validate folder
      const validFolders = [
        "company",
        "hotels",
        "airlines",
        "packages",
        "documents",
        "profiles",
        "payments",
        "itinerary",
        "jamaah",
        "general",
      ];

      if (!validFolders.includes(folder)) {
        logger.security("Invalid upload folder attempted", {
          folder,
          ip: req.ip,
        });
        return res.status(400).json({
          success: false,
          message: "Folder upload tidak valid",
        });
      }

      const uploadDir = path.join(UPLOAD_BASE, folder);
      await fs.mkdir(uploadDir, { recursive: true });

      const uploadedFiles = [];

      for (const file of req.files) {
        const filename = generateSafeFilename(".jpg");
        const filepath = path.join(uploadDir, filename);

        const image = await Jimp.read(file.buffer);

        if (image.getWidth() > 1000 || image.getHeight() > 1000) {
          image.scaleToFit(1000, 1000);
        }

        await image.quality(80).writeAsync(filepath);

        uploadedFiles.push({
          filename: filename,
          path: `/uploads/${folder}/${filename}`,
          size: file.size,
          originalName: sanitizeFilename(file.originalname),
        });
      }

      req.uploadedFiles = uploadedFiles;
      logger.info("Multiple images optimized", { count: uploadedFiles.length });
      next();
    } catch (error) {
      logger.error("Multiple image optimization error", error);
      next(error);
    }
  };
};

// =====================================================
// PDF UPLOAD (ITINERARY) - WITH SECURITY
// =====================================================
const pdfStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(UPLOAD_BASE, "itinerary");
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const filename = generateSafeFilename(".pdf");
    cb(null, filename);
  },
});

const pdfFilter = (req, file, cb) => {
  // Strict PDF validation
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/x-pdf";
  const extname = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdf && extname) {
    cb(null, true);
  } else {
    logger.security("Invalid PDF upload attempted", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      ip: req.ip,
    });
    cb(new Error("Hanya file PDF yang diperbolehkan"));
  }
};

export const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: pdfFilter,
});

export const savePDFPath = (req, res, next) => {
  if (!req.file) return next();

  req.uploadedFile = {
    filename: req.file.filename,
    path: `/uploads/itinerary/${req.file.filename}`,
    size: req.file.size,
    originalName: sanitizeFilename(req.file.originalname),
  };

  next();
};

// =====================================================
// UPLOAD DOCUMENT (IMAGE + PDF) - WITH SECURITY
// =====================================================
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype =
      /image/.test(file.mimetype) || file.mimetype === "application/pdf";

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      logger.security("Invalid document type attempted", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        ip: req.ip,
      });
      cb(new Error("Format dokumen tidak didukung."));
    }
  },
});

// =====================================================
// SAVE DOCUMENT - WITH JIMP
// =====================================================
export const saveDocument = (folder = "documents") => {
  return async (req, res, next) => {
    if (!req.file) {
      logger.debug("No document to save, skipping...");
      return next();
    }

    try {
      // Validate folder
      const validFolders = [
        "company",
        "hotels",
        "airlines",
        "packages",
        "documents",
        "profiles",
        "payments",
        "itinerary",
        "jamaah",
      ];

      if (!validFolders.includes(folder)) {
        logger.security("Invalid document folder attempted", {
          folder,
          ip: req.ip,
        });
        return res.status(400).json({
          success: false,
          message: "Folder dokumen tidak valid",
        });
      }

      const uploadDir = path.join(UPLOAD_BASE, folder);
      await fs.mkdir(uploadDir, { recursive: true });

      let filename, filepath;

      if (req.file.mimetype === "application/pdf") {
        filename = generateSafeFilename(".pdf");
        filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, req.file.buffer);
      } else {
        filename = generateSafeFilename(".jpg");
        filepath = path.join(uploadDir, filename);

        const image = await Jimp.read(req.file.buffer);

        if (image.getWidth() > 1500 || image.getHeight() > 1500) {
          image.scaleToFit(1500, 1500);
        }

        await image.quality(85).writeAsync(filepath);
      }

      req.uploadedFile = {
        filename: filename,
        path: `/uploads/${folder}/${filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
        originalName: sanitizeFilename(req.file.originalname),
      };

      logger.info("Document saved", { path: req.uploadedFile.path });
      next();
    } catch (error) {
      logger.error("Save document error", error);
      next(error);
    }
  };
};

// =====================================================
// DELETE FILE UTILITY
// =====================================================
export const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(UPLOAD_BASE, filePath.replace("/uploads/", ""));
    await fs.unlink(fullPath);
    logger.info("File deleted", { path: filePath });
    return { success: true };
  } catch (error) {
    logger.error("File deletion error", error, { path: filePath });
    return { success: false, error: error.message };
  }
};

export { UPLOAD_BASE };
