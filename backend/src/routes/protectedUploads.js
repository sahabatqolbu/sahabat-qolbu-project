import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { authenticate } from "../middlewares/authMiddleware.js";
import { UPLOAD_BASE } from "../utils/upload.js";
import { db } from "../db/index.js";
import {
  agentData,
  jamaahData,
  jamaahPayments,
  paymentInstallments,
  transactions,
} from "../db/schema.js";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import {
  errorResponse,
  notFoundResponse,
} from "../utils/response.js";

const router = express.Router();

const protectedFolders = new Set([
  "profiles",
  "jamaah",
  "agents",
  "documents",
  "payments",
]);

const ELEVATED_ROLES = new Set(["ADMIN", "STAFF", "FINANCE"]);

const getRelativeUploadPath = (folder, filename) => `/uploads/${folder}/${filename}`;

const normalizeStoredPath = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") {
    return null;
  }

  try {
    return new URL(storedPath).pathname;
  } catch {
    return storedPath;
  }
};

const matchesStoredPath = (storedPath, relativePath) => {
  const normalized = normalizeStoredPath(storedPath);
  return normalized === relativePath;
};

const hasOwnedFileAccess = async ({ folder, relativePath, userId, role }) => {
  const ownedAgent = await db.query.agentData.findFirst({
    where: eq(agentData.userId, userId),
    columns: {
      profilePhoto: true,
      landingLogo: true,
      paymentProof: true,
      ktpPhoto: true,
      certificateFile: true,
      idCardDesignFile: true,
    },
  });

  const ownedJamaahRows = await db.query.jamaahData.findMany({
    where: eq(jamaahData.userId, userId),
    columns: {
      id: true,
      fotoUrl: true,
      ktpUrl: true,
      kkUrl: true,
      pasporUrl: true,
      bukuNikahUrl: true,
      aktaLahirUrl: true,
      ijazahUrl: true,
      vaksinUrl: true,
      meningitisUrl: true,
    },
  });

  const ownedJamaahIds = ownedJamaahRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  let agentManagedJamaahRows = [];
  if (role === "AGEN") {
    const agentRow = await db.query.agentData.findFirst({
      where: eq(agentData.userId, userId),
      columns: { id: true },
    });

    const agenIds = [userId];
    if (agentRow?.id) {
      agenIds.push(Number(agentRow.id));
    }

    agentManagedJamaahRows = await db.query.jamaahData.findMany({
      where: inArray(jamaahData.agenId, agenIds),
      columns: {
        id: true,
        fotoUrl: true,
        ktpUrl: true,
        kkUrl: true,
        pasporUrl: true,
        bukuNikahUrl: true,
        aktaLahirUrl: true,
        ijazahUrl: true,
        vaksinUrl: true,
        meningitisUrl: true,
      },
    });
  }

  const combinedJamaahRows = [...ownedJamaahRows, ...agentManagedJamaahRows];
  const combinedJamaahIds = [
    ...ownedJamaahIds,
    ...agentManagedJamaahRows
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id) && id > 0),
  ];

  if (folder === "profiles") {
    if (matchesStoredPath(ownedAgent?.profilePhoto, relativePath)) {
      return true;
    }

    return combinedJamaahRows.some((row) =>
      matchesStoredPath(row.fotoUrl, relativePath),
    );
  }

  if (folder === "jamaah") {
    return combinedJamaahRows.some((row) =>
      [
        row.fotoUrl,
        row.ktpUrl,
        row.kkUrl,
        row.pasporUrl,
        row.bukuNikahUrl,
        row.aktaLahirUrl,
        row.ijazahUrl,
        row.vaksinUrl,
        row.meningitisUrl,
      ].some((path) => matchesStoredPath(path, relativePath)),
    );
  }

  if (folder === "payments") {
    if (matchesStoredPath(ownedAgent?.paymentProof, relativePath)) {
      return true;
    }

    if (combinedJamaahIds.length === 0) {
      return false;
    }

    const paymentRows = await db.query.jamaahPayments.findMany({
      where: and(
        inArray(jamaahPayments.jamaahId, combinedJamaahIds),
        isNotNull(jamaahPayments.proofUrl),
      ),
      columns: { proofUrl: true },
    });

    if (paymentRows.some((row) => matchesStoredPath(row.proofUrl, relativePath))) {
      return true;
    }

    const txRows = await db.query.transactions.findMany({
      where: and(
        inArray(transactions.jamaahId, combinedJamaahIds),
        isNotNull(transactions.paymentProof),
      ),
      columns: { id: true, paymentProof: true },
    });

    if (txRows.some((row) => matchesStoredPath(row.paymentProof, relativePath))) {
      return true;
    }

    const txIds = txRows.map((row) => Number(row.id)).filter(Boolean);
    if (txIds.length === 0) {
      return false;
    }

    const installmentRows = await db.query.paymentInstallments.findMany({
      where: and(
        inArray(paymentInstallments.transactionId, txIds),
        isNotNull(paymentInstallments.paymentProof),
      ),
      columns: { paymentProof: true },
    });

    return installmentRows.some((row) =>
      matchesStoredPath(row.paymentProof, relativePath),
    );
  }

  if (folder === "documents") {
    if (
      [
        ownedAgent?.ktpPhoto,
        ownedAgent?.certificateFile,
        ownedAgent?.idCardDesignFile,
      ].some((path) => matchesStoredPath(path, relativePath))
    ) {
      return true;
    }

    return combinedJamaahRows.some((row) =>
      [
        row.ktpUrl,
        row.kkUrl,
        row.pasporUrl,
        row.bukuNikahUrl,
        row.aktaLahirUrl,
        row.ijazahUrl,
        row.vaksinUrl,
        row.meningitisUrl,
      ].some((path) => matchesStoredPath(path, relativePath)),
    );
  }

  if (folder === "agents") {
    return [
      ownedAgent?.profilePhoto,
      ownedAgent?.landingLogo,
      ownedAgent?.certificateFile,
      ownedAgent?.idCardDesignFile,
    ].some((path) => matchesStoredPath(path, relativePath));
  }

  return false;
};

router.get("/:folder/:filename", authenticate, async (req, res) => {
  const folder = String(req.params.folder || "").toLowerCase();
  const filename = path.basename(String(req.params.filename || ""));

  if (!protectedFolders.has(folder) || !filename) {
    return errorResponse(
      res,
      "Path file tidak valid",
      400,
      null,
      "VALIDATION_FAILED"
    );
  }

  const filePath = path.join(UPLOAD_BASE, folder, filename);
  const relativePath = getRelativeUploadPath(folder, filename);

  const role = req.user?.role;
  const userId = Number(req.user?.userId);

  const canAccess = ELEVATED_ROLES.has(role)
    ? true
    : Number.isInteger(userId) &&
      (await hasOwnedFileAccess({
        folder,
        relativePath,
        userId,
        role,
      }));

  if (!canAccess) {
    return notFoundResponse(res, "File tidak ditemukan");
  }

  try {
    await fs.access(filePath);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.sendFile(filePath);
  } catch {
    return notFoundResponse(res, "File tidak ditemukan");
  }
});

export default router;
