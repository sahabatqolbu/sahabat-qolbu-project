// backend/src/utils/upload.js
import multer from "multer";
import { Jimp } from "jimp";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_BASE = path.join(__dirname, "../../public/uploads");

console.log("📂 [upload.js] UPLOAD_BASE:", path.resolve(UPLOAD_BASE));

// =====================================================
// MULTER STORAGE & FILTER
// =====================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|bmp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP."));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

// =====================================================
// OPTIMIZE IMAGE (SINGLE) - PAKAI JIMP
// =====================================================
export const optimizeImage = (folder) => async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    console.log("⏭️ No file to optimize, skipping...");
    return next();
  }

  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const uploadDir = path.join(UPLOAD_BASE, folder);
    const outputPath = path.join(uploadDir, filename);

    console.log("📁 Upload dir:", uploadDir);
    console.log("📄 Output path:", outputPath);

    await fs.mkdir(uploadDir, { recursive: true });

    // ✅ Pakai Jimp (Pure JS, ringan)
    const image = await Jimp.read(req.file.buffer);

    // Resize jika lebih besar dari 1000px
    if (image.getWidth() > 1000 || image.getHeight() > 1000) {
      image.scaleToFit(1000, 1000);
    }

    // Compress & save sebagai JPEG
    await image.quality(80).writeAsync(outputPath);

    req.uploadedFile = {
      filename: filename,
      path: `/uploads/${folder}/${filename}`,
      size: req.file.size,
      mimeType: "image/jpeg",
      originalName: req.file.originalname,
    };

    console.log("✅ Image optimized:", req.uploadedFile.path);
    next();
  } catch (error) {
    console.error("❌ Optimize error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to optimize image",
      error: error.message,
    });
  }
};

// =====================================================
// OPTIMIZE MULTIPLE IMAGES - PAKAI JIMP
// =====================================================
export const optimizeMultipleImages = (folder = "general") => {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
      const uploadDir = path.join(UPLOAD_BASE, folder);
      await fs.mkdir(uploadDir, { recursive: true });

      const uploadedFiles = [];

      for (const file of req.files) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomString}.jpg`;
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
          originalName: file.originalname,
        });
      }

      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// =====================================================
// PDF UPLOAD (ITINERARY) - SAMA
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
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `itinerary-${timestamp}-${randomString}.pdf`;
    cb(null, filename);
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Hanya file PDF yang diperbolehkan"));
  }
};

export const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
});

export const savePDFPath = (req, res, next) => {
  if (!req.file) return next();

  req.uploadedFile = {
    filename: req.file.filename,
    path: `/uploads/itinerary/${req.file.filename}`,
    size: req.file.size,
    originalName: req.file.originalname,
  };

  next();
};

// =====================================================
// UPLOAD DOCUMENT (IMAGE + PDF)
// =====================================================
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = /image|pdf/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Format dokumen tidak didukung."));
    }
  },
});

// =====================================================
// SAVE DOCUMENT - PAKAI JIMP
// =====================================================
export const saveDocument = (folder = "documents") => {
  return async (req, res, next) => {
    if (!req.file) {
      console.log("⚠️ saveDocument: No file received");
      return next();
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);

      const uploadDir = path.join(UPLOAD_BASE, folder);
      await fs.mkdir(uploadDir, { recursive: true });

      let filename, filepath;

      if (req.file.mimetype === "application/pdf") {
        filename = `${timestamp}-${randomString}.pdf`;
        filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, req.file.buffer);
      } else {
        filename = `${timestamp}-${randomString}.jpg`;
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
        originalName: req.file.originalname,
      };

      console.log("📤 uploadedFile:", req.uploadedFile);
      next();
    } catch (error) {
      console.error("❌ saveDocument ERROR:", error);
      next(error);
    }
  };
};

export { UPLOAD_BASE };
