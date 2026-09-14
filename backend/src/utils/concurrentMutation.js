import { createHash } from "node:crypto";
import { errorResponse } from "./response.js";

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};

// Coalesce only identical, currently running operations in this API process.
// Completed operations are never inferred to be duplicates by amount/title/date.
export const concurrentMutation = (handler) => {
  const pending = new Map();
  return async (req, res, next) => {
    const signature = createHash("sha256").update(JSON.stringify(canonical({
      userId: req.user?.userId,
      params: req.params,
      body: req.validatedBody || req.body,
      files: req.files || req.file || req.uploadedFile,
    }))).digest("hex");
    const existing = pending.get(signature);
    if (existing) {
      const result = await existing;
      if (result) return res.status(result.status).json(result.body);
      return next(new Error("Operasi sebelumnya gagal. Silakan coba kembali."));
    }
    if (pending.size >= 256) return errorResponse(res, "Server sedang sibuk. Silakan coba kembali.", 503);
    let complete;
    const promise = new Promise((resolve) => { complete = resolve; });
    pending.set(signature, promise);
    const originalJson = res.json;
    let result = null;
    res.json = function (body) {
      result = { status: res.statusCode, body };
      return originalJson.call(this, body);
    };
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    } finally {
      res.json = originalJson;
      pending.delete(signature);
      complete(result);
    }
  };
};
