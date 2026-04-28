import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const read = (relPath) => {
  const abs = path.join(ROOT, relPath);
  return fs.readFileSync(abs, "utf8");
};

describe("security regressions", () => {
  it("protects sensitive upload folders behind auth", () => {
    const appJs = read("src/app.js");
    assert.match(appJs, /protectedFolders\s*=\s*new Set\(\[([\s\S]*?)"profiles"/);
    assert.match(appJs, /protectedFolders\s*=\s*new Set\(\[([\s\S]*?)"jamaah"/);
    assert.match(appJs, /protectedFolders\s*=\s*new Set\(\[([\s\S]*?)"agents"/);
  });

  it("enforces ownership in admin jamaah booking lookup/payment lookup", () => {
    const controller = read("src/controllers/jamaahController.js");
    assert.match(controller, /getAgenOwnershipCondition/);
    assert.match(controller, /req\.user\?\.role === "AGEN"/);
    assert.match(controller, /Data jamaah tidak ditemukan atau bukan milik Anda/);
  });

  it("avoids broad user relation expansion", () => {
    const targets = [
      "src/controllers/jamaahController.js",
      "src/controllers/transactionController.js",
      "src/controllers/agenJamaahController.js",
      "src/controllers/notificationController.js",
    ];

    for (const rel of targets) {
      const content = read(rel);
      assert.doesNotMatch(content, /user:\s*true/);
    }
  });

  it("keeps API documentation endpoints disabled from public exposure", () => {
    const appJs = read("src/app.js");
    assert.match(appJs, /SECURITY_DOCS_DISABLED/);
    assert.match(appJs, /\/api\/openapi/);
    assert.match(appJs, /\/api\/docs/);
    assert.match(appJs, /\/api\/swagger/);
    assert.match(appJs, /blockApiDocsExposure/);
  });
});

describe("jamaah self-service data integrity", () => {
  it("updates jamaah self-service row by id and uses uploadedFile path", () => {
    const controller = read("src/controllers/jamaahSelfController.js");
    assert.match(controller, /where\(eq\(jamaahData\.id, existing\.id\)\)/);
    assert.match(controller, /const fileUrl = req\.uploadedFile\?\.path/);
  });

  it("supports admin jamaah document uploads with the multipart file path", () => {
    const controller = read("src/controllers/jamaahController.js");
    const routes = read("src/routes/jamaah.js");

    assert.match(controller, /ADMIN_UPLOAD_DOCUMENT_MAP/);
    assert.match(controller, /export const uploadAdminDocument = async/);
    assert.match(controller, /const fileUrl = req\.uploadedFile\?\.path/);
    assert.match(routes, /\/admin\/:bookingNumber\/documents/);
    assert.match(routes, /uploadAdminDocument/);
  });
});

describe("api contract regressions", () => {
  it("keeps main controllers on response helpers (no raw res.json/status.json)", () => {
    const targets = [
      "src/controllers/jamaahController.js",
      "src/controllers/transactionController.js",
      "src/controllers/adminController.js",
      "src/controllers/notificationController.js",
      "src/controllers/masterController.js",
      "src/controllers/jamaahSelfController.js",
      "src/controllers/agenJamaahController.js",
    ];

    for (const rel of targets) {
      const content = read(rel);
      assert.doesNotMatch(content, /return\s+res\.json\s*\(/);
      assert.doesNotMatch(content, /return\s+res\.status\s*\([^)]*\)\.json\s*\(/);
    }
  });

  it("keeps structured error code keys in validation and global error handler", () => {
    const validators = read("src/validators/index.js");
    const errorHandler = read("src/middlewares/errorHandler.js");
    const responseHelpers = read("src/utils/response.js");

    assert.match(validators, /errorResponse\([\s\S]*"VALIDATION_FAILED"/);
    assert.match(errorHandler, /code:\s*"AUTH_INVALID_TOKEN"/);
    assert.match(responseHelpers, /\(code \? \{ code \} : \{\}\)/);
  });

  it("keeps centralized error tracking hook wired in global error handler", () => {
    const errorHandler = read("src/middlewares/errorHandler.js");
    const errorTracker = read("src/utils/errorTracker.js");

    assert.match(errorHandler, /captureErrorEvent/);
    assert.match(errorHandler, /requestId: req\.id/);
    assert.match(errorTracker, /ERROR_TRACKING_ENABLED/);
    assert.match(errorTracker, /authorization.*REDACTED/);
    assert.match(errorTracker, /cookie.*REDACTED/);
  });
});

describe("payment flow regressions", () => {
  it("guards duplicate jamaah payment verification", () => {
    const controller = read("src/controllers/jamaahController.js");
    assert.match(controller, /Pembayaran sudah diverifikasi sebelumnya/);
  });

  it("blocks self-verification for payment approval", () => {
    const controller = read("src/controllers/jamaahController.js");
    assert.match(controller, /Verifikasi pembayaran sendiri tidak diizinkan/);
    assert.match(controller, /PAYMENT_SELF_VERIFICATION_BLOCKED/);
  });

  it("requires valid payment proof path before payment verification", () => {
    const controller = read("src/controllers/jamaahController.js");
    const validators = read("src/validators/index.js");

    assert.match(controller, /Bukti pembayaran belum valid/);
    assert.match(validators, /proofUrl tidak valid/);
  });

  it("derives jamaah payment status via shared helper", () => {
    const jamaahController = read("src/controllers/jamaahController.js");
    const financePosController = read("src/controllers/financePosController.js");

    assert.match(jamaahController, /deriveJamaahPaymentState/);
    assert.match(financePosController, /deriveJamaahPaymentState/);
  });

  it("requires remarks for CANCELLED/REFUNDED transaction status", () => {
    const validators = read("src/validators/index.js");
    const transactionController = read("src/controllers/transactionController.js");
    const transactionWorkflow = read("src/utils/transactionWorkflow.js");

    assert.match(validators, /Alasan wajib diisi untuk status/);
    assert.match(transactionController, /validateTransactionStatusChange/);
    assert.match(transactionWorkflow, /isReasonRequiredForStatus/);
    assert.match(transactionWorkflow, /Alasan wajib diisi untuk status/);
  });

  it("logs transaction status transition audit details", () => {
    const transactionController = read("src/controllers/transactionController.js");

    assert.match(transactionController, /Transaction status transitioned/);
    assert.match(transactionController, /previousStatus/);
    assert.match(transactionController, /nextStatus/);
    assert.match(transactionController, /changedBy/);
  });

  it("writes payment verification audit log entry", () => {
    const controller = read("src/controllers/jamaahController.js");
    assert.match(controller, /VERIFY_PAYMENT/);
    assert.match(controller, /JAMAAH_PAYMENT/);
    assert.match(controller, /Payment verification audit log failed/);
  });

  it("does not allow direct VERIFIED from PENDING/PARTIAL", () => {
    const helpers = read("src/utils/transactionState.js");
    assert.doesNotMatch(helpers, /PENDING:\s*\[[^\]]*VERIFIED/);
    assert.doesNotMatch(helpers, /PARTIAL:\s*\[[^\]]*VERIFIED/);
  });

  it("keeps payment verifier role policy consistent across transaction and jamaah payments", () => {
    const adminRoutes = read("src/routes/admin.js");
    const jamaahRoutes = read("src/routes/jamaah.js");

    assert.match(
      adminRoutes,
      /transactions\/:id\/verify",\s*authenticate,\s*authorize\(\["ADMIN",\s*"FINANCE"\]\)/,
    );
    assert.match(
      jamaahRoutes,
      /payments\/:paymentId\/verify",\s*authenticate,\s*authorize\(\["ADMIN",\s*"FINANCE"\]\)/,
    );
    assert.match(
      jamaahRoutes,
      /payments\/:paymentId\/reject",\s*authenticate,\s*authorize\(\["ADMIN",\s*"FINANCE"\]\)/,
    );
  });
});
