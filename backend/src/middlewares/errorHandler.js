import { logger } from "../utils/logger.js";
import { z } from "zod";
import { captureErrorEvent } from "../utils/errorTracker.js";

/**
 * Global Error Handler Middleware
 * Handles all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // Log error with context
  logger.error("Request error", err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
    requestId: req.id,
    statusCode,
  });

  captureErrorEvent({
    error: err,
    requestId: req.id,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
    code: err.code,
    status: statusCode,
  });

  // Validation errors (Zod)
  if (err instanceof z.ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message: "Validasi gagal",
      errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      code: "AUTH_INVALID_TOKEN",
      message: "Token tidak valid",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "AUTH_INVALID_TOKEN",
      message: "Token sudah kedaluwarsa. Silakan login kembali.",
    });
  }

  // Multer errors
  if (err.name === "MulterError") {
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Ukuran file terlalu besar. Maksimal 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Field file tidak sesuai.";
    }
    return res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message,
    });
  }

  // Syntax/JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message: "Format JSON tidak valid",
    });
  }

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      code: "RESOURCE_CONFLICT",
      message: "Data sudah ada",
    });
  }

  if (err.code === "ER_NO_REFERENCED_ROW") {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message: "Data referensi tidak ditemukan",
    });
  }

  // Default error response
  const message = err.message || "Terjadi kesalahan pada server";
  const safeMessage =
    statusCode >= 500
      ? "Terjadi gangguan pada server. Silakan coba lagi beberapa saat."
      : message;

  res.status(statusCode).json({
    success: false,
    ...(err.code ? { code: err.code } : {}),
    message: safeMessage,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      code: err.code,
    }),
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    code: "RESOURCE_NOT_FOUND",
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
  });
};

/**
 * Async handler wrapper
 * Automatically catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
