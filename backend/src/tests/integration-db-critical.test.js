import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

import { eq, sql } from "drizzle-orm";

import app from "../app.js";
import { db } from "../db/index.js";
import { users, jamaahData, agentData } from "../db/schema.js";
import { hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { deriveJamaahPaymentState } from "../utils/paymentState.js";

const createSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const isDbIntegrationEnabled =
  String(process.env.ENABLE_DB_INTEGRATION_TESTS || "false").toLowerCase() ===
  "true";

describe("integration db critical path", () => {
  let server;
  let baseUrl;
  let dbReady = true;

  const createdUserIds = [];
  const createdAgentUserIds = [];
  const createdJamaahIds = [];
  const createdPaymentIds = [];

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;

    if (!isDbIntegrationEnabled) {
      dbReady = false;
      return;
    }

    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbReady = false;
    }
  });

  after(async () => {
    if (dbReady) {
      const { jamaahPayments } = await import("../db/schema.js");

      for (const id of createdPaymentIds.reverse()) {
        await db.delete(jamaahPayments).where(eq(jamaahPayments.id, id));
      }

      for (const id of createdJamaahIds.reverse()) {
        await db.delete(jamaahData).where(eq(jamaahData.id, id));
      }

      for (const userId of createdAgentUserIds.reverse()) {
        await db.delete(agentData).where(eq(agentData.userId, userId));
      }

      for (const id of createdUserIds.reverse()) {
        await db.delete(users).where(eq(users.id, id));
      }
    }

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("covers password login session lifecycle with DB", async (t) => {
    if (!dbReady) {
      t.skip(
        "DB integration tests disabled or DB not available (set ENABLE_DB_INTEGRATION_TESTS=true)"
      );
      return;
    }

    const suffix = createSuffix();
    const email = `integration.login.${suffix}@example.com`;
    const password = "Passw0rd!";
    const hashed = await hashPassword(password);

    const [userInsert] = await db
      .insert(users)
      .values({
        email,
        password: hashed,
        role: "JAMAAH",
        fullName: `Integration OTP ${suffix}`,
        isActive: true,
      })
      .$returningId();

    const userId = Number(userInsert.id);
    createdUserIds.push(userId);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginBody = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginBody.success, true);
    assert.equal(loginBody.data.user.email, email);

    const dbUserAfterLogin = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { otp: true, otpExpiry: true, lastLogin: true },
    });

    assert.equal(dbUserAfterLogin?.otp, null);
    assert.equal(dbUserAfterLogin?.otpExpiry, null);
    assert.ok(dbUserAfterLogin?.lastLogin, "lastLogin should be updated");

    const setCookie = loginRes.headers.get("set-cookie") || "";
    assert.match(setCookie, /access_token=/);
  });

  it("covers admin approval flow for jamaah and agen with DB", async (t) => {
    if (!dbReady) {
      t.skip(
        "DB integration tests disabled or DB not available (set ENABLE_DB_INTEGRATION_TESTS=true)"
      );
      return;
    }

    const suffix = createSuffix();
    const adminEmail = `integration.admin.${suffix}@example.com`;
    const jamaahEmail = `integration.jamaah.${suffix}@example.com`;
    const agenEmail = `integration.agen.${suffix}@example.com`;

    const hashed = await hashPassword("Passw0rd!");

    const [adminInsert] = await db
      .insert(users)
      .values({
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
        fullName: `Integration Admin ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const adminId = Number(adminInsert.id);
    createdUserIds.push(adminId);

    const [jamaahUserInsert] = await db
      .insert(users)
      .values({
        email: jamaahEmail,
        password: hashed,
        role: "JAMAAH",
        fullName: `Integration Jamaah ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const jamaahUserId = Number(jamaahUserInsert.id);
    createdUserIds.push(jamaahUserId);

    const bookingNumber = `SQ-INT-${suffix}`;
    const [jamaahInsert] = await db
      .insert(jamaahData)
      .values({
        userId: jamaahUserId,
        bookingNumber,
        registrationStatus: "VERIFIED",
      })
      .$returningId();
    const jamaahId = Number(jamaahInsert.id);
    createdJamaahIds.push(jamaahId);

    const [agenUserInsert] = await db
      .insert(users)
      .values({
        email: agenEmail,
        password: hashed,
        role: "AGEN",
        fullName: `Integration Agen ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const agenUserId = Number(agenUserInsert.id);
    createdUserIds.push(agenUserId);
    createdAgentUserIds.push(agenUserId);

    await db.insert(agentData).values({
      userId: agenUserId,
      status: "PENDING",
    });

    const adminToken = generateToken({
      userId: adminId,
      email: adminEmail,
      role: "ADMIN",
    });

    const commonHeaders = {
      Cookie: `access_token=${adminToken}`,
      Origin: baseUrl,
      Referer: `${baseUrl}/dashboard`,
      "Content-Type": "application/json",
    };

    const approveJamaahRes = await fetch(
      `${baseUrl}/api/jamaah/${bookingNumber}/approve`,
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({}),
      }
    );

    const approveJamaahBody = await approveJamaahRes.json();
    assert.equal(approveJamaahRes.status, 200);
    assert.equal(approveJamaahBody.success, true);
    assert.equal(approveJamaahBody.data.registrationStatus, "APPROVED");

    const jamaahAfter = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.id, jamaahId),
      columns: { registrationStatus: true, approvedBy: true },
    });
    assert.equal(jamaahAfter?.registrationStatus, "APPROVED");
    assert.equal(Number(jamaahAfter?.approvedBy), adminId);

    const approveAgenRes = await fetch(`${baseUrl}/api/agen/admin/${agenUserId}/approve`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({}),
    });

    const approveAgenBody = await approveAgenRes.json();
    assert.equal(approveAgenRes.status, 200);
    assert.equal(approveAgenBody.success, true);

    const agentAfter = await db.query.agentData.findFirst({
      where: eq(agentData.userId, agenUserId),
      columns: { status: true, approvedBy: true },
    });
    assert.equal(agentAfter?.status, "APPROVED");
    assert.equal(Number(agentAfter?.approvedBy), adminId);
  });

  it("enforces reject reason and role guard on approval endpoints", async (t) => {
    if (!dbReady) {
      t.skip(
        "DB integration tests disabled or DB not available (set ENABLE_DB_INTEGRATION_TESTS=true)"
      );
      return;
    }

    const suffix = createSuffix();
    const adminEmail = `integration.admin.guard.${suffix}@example.com`;
    const financeEmail = `integration.finance.guard.${suffix}@example.com`;
    const jamaahEmail = `integration.jamaah.guard.${suffix}@example.com`;

    const hashed = await hashPassword("Passw0rd!");

    const [adminInsert] = await db
      .insert(users)
      .values({
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
        fullName: `Integration Admin Guard ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const adminId = Number(adminInsert.id);
    createdUserIds.push(adminId);

    const [financeInsert] = await db
      .insert(users)
      .values({
        email: financeEmail,
        password: hashed,
        role: "FINANCE",
        fullName: `Integration Finance Guard ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const financeId = Number(financeInsert.id);
    createdUserIds.push(financeId);

    const [jamaahUserInsert] = await db
      .insert(users)
      .values({
        email: jamaahEmail,
        password: hashed,
        role: "JAMAAH",
        fullName: `Integration Jamaah Guard ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const jamaahUserId = Number(jamaahUserInsert.id);
    createdUserIds.push(jamaahUserId);

    const bookingNumber = `SQ-INT-REJECT-${suffix}`;
    const [jamaahInsert] = await db
      .insert(jamaahData)
      .values({
        userId: jamaahUserId,
        bookingNumber,
        registrationStatus: "VERIFIED",
      })
      .$returningId();
    const jamaahId = Number(jamaahInsert.id);
    createdJamaahIds.push(jamaahId);

    const adminToken = generateToken({
      userId: adminId,
      email: adminEmail,
      role: "ADMIN",
    });
    const financeToken = generateToken({
      userId: financeId,
      email: financeEmail,
      role: "FINANCE",
    });

    const adminHeaders = {
      Cookie: `access_token=${adminToken}`,
      Origin: baseUrl,
      Referer: `${baseUrl}/dashboard`,
      "Content-Type": "application/json",
    };

    const financeHeaders = {
      Cookie: `access_token=${financeToken}`,
      Origin: baseUrl,
      Referer: `${baseUrl}/dashboard`,
      "Content-Type": "application/json",
    };

    const rejectWithoutReasonRes = await fetch(
      `${baseUrl}/api/jamaah/${bookingNumber}/reject`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({}),
      }
    );
    const rejectWithoutReasonBody = await rejectWithoutReasonRes.json();
    assert.equal(rejectWithoutReasonRes.status, 400);
    assert.equal(rejectWithoutReasonBody.success, false);
    assert.equal(rejectWithoutReasonBody.code, "VALIDATION_FAILED");

    const rejectByFinanceRes = await fetch(
      `${baseUrl}/api/jamaah/${bookingNumber}/reject`,
      {
        method: "POST",
        headers: financeHeaders,
        body: JSON.stringify({ reason: "Dokumen belum lengkap" }),
      }
    );
    const rejectByFinanceBody = await rejectByFinanceRes.json();
    assert.equal(rejectByFinanceRes.status, 403);
    assert.equal(rejectByFinanceBody.success, false);
    assert.equal(rejectByFinanceBody.code, "AUTH_FORBIDDEN");

    const rejectByAdminRes = await fetch(
      `${baseUrl}/api/jamaah/${bookingNumber}/reject`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ reason: "Dokumen belum lengkap" }),
      }
    );
    const rejectByAdminBody = await rejectByAdminRes.json();
    assert.equal(rejectByAdminRes.status, 200);
    assert.equal(rejectByAdminBody.success, true);

    const jamaahAfterReject = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.id, jamaahId),
      columns: { registrationStatus: true, rejectedBy: true, rejectionReason: true },
    });
    assert.equal(jamaahAfterReject?.registrationStatus, "REJECTED");
    assert.equal(Number(jamaahAfterReject?.rejectedBy), adminId);
    assert.equal(jamaahAfterReject?.rejectionReason, "Dokumen belum lengkap");
  });

  it("covers payment reject -> reupload -> verify lifecycle and anti-self-verification guard", async (t) => {
    if (!dbReady) {
      t.skip(
        "DB integration tests disabled or DB not available (set ENABLE_DB_INTEGRATION_TESTS=true)"
      );
      return;
    }

    const { jamaahPayments } = await import("../db/schema.js");

    const suffix = createSuffix();
    const adminEmail = `integration.admin.payment.${suffix}@example.com`;
    const jamaahEmail = `integration.jamaah.payment.${suffix}@example.com`;
    const hashed = await hashPassword("Passw0rd!");

    const [adminInsert] = await db
      .insert(users)
      .values({
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
        fullName: `Integration Admin Payment ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const adminId = Number(adminInsert.id);
    createdUserIds.push(adminId);

    const [jamaahUserInsert] = await db
      .insert(users)
      .values({
        email: jamaahEmail,
        password: hashed,
        role: "JAMAAH",
        fullName: `Integration Jamaah Payment ${suffix}`,
        isActive: true,
      })
      .$returningId();
    const jamaahUserId = Number(jamaahUserInsert.id);
    createdUserIds.push(jamaahUserId);

    const bookingNumber = `SQ-INT-PAY-${suffix}`;
    const hargaFinal = 1000000;

    const [jamaahInsert] = await db
      .insert(jamaahData)
      .values({
        userId: jamaahUserId,
        bookingNumber,
        registrationStatus: "VERIFIED",
        hargaFinal: String(hargaFinal),
        totalPayment: "0",
        outstanding: String(hargaFinal),
        statusPayment: "BELUM_BAYAR",
      })
      .$returningId();
    const jamaahId = Number(jamaahInsert.id);
    createdJamaahIds.push(jamaahId);

    const adminToken = generateToken({
      userId: adminId,
      email: adminEmail,
      role: "ADMIN",
    });
    const jamaahToken = generateToken({
      userId: jamaahUserId,
      email: jamaahEmail,
      role: "JAMAAH",
    });

    const adminHeaders = {
      Cookie: `access_token=${adminToken}`,
      Origin: baseUrl,
      Referer: `${baseUrl}/dashboard`,
      "Content-Type": "application/json",
    };
    const jamaahHeaders = {
      Cookie: `access_token=${jamaahToken}`,
      Origin: baseUrl,
      Referer: `${baseUrl}/dashboard`,
      "Content-Type": "application/json",
    };

    const addPaymentRes = await fetch(
      `${baseUrl}/api/jamaah/admin/${bookingNumber}/payments`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          amount: 500000,
          paymentDate: new Date().toISOString(),
          proofUrl: `/uploads/payments/integration-${suffix}.jpg`,
          notes: "partial payment",
        }),
      }
    );
    const addPaymentBody = await addPaymentRes.json();
    assert.equal(addPaymentRes.status, 201);
    assert.equal(addPaymentBody.success, true);

    const firstPaymentId = Number(addPaymentBody?.data?.paymentId);
    createdPaymentIds.push(firstPaymentId);
    assert.ok(firstPaymentId > 0);

    const jamaahAfterAdd = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.id, jamaahId),
      columns: { totalPayment: true, outstanding: true, statusPayment: true },
    });

    const expectedStateAfterAdd = deriveJamaahPaymentState({
      hargaFinal,
      totalPayment: 0,
    });

    assert.equal(Number(jamaahAfterAdd?.totalPayment), expectedStateAfterAdd.totalPayment);
    assert.equal(Number(jamaahAfterAdd?.outstanding), expectedStateAfterAdd.outstanding);
    assert.equal(jamaahAfterAdd?.statusPayment, expectedStateAfterAdd.statusPayment);

    const selfVerifyRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${firstPaymentId}/verify`,
      {
        method: "PATCH",
        headers: jamaahHeaders,
      }
    );
    const selfVerifyBody = await selfVerifyRes.json();
    assert.equal(selfVerifyRes.status, 403);
    assert.equal(selfVerifyBody.success, false);
    assert.equal(selfVerifyBody.code, "PAYMENT_SELF_VERIFICATION_BLOCKED");

    const rejectWithoutReasonRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${firstPaymentId}/reject`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({}),
      }
    );
    const rejectWithoutReasonBody = await rejectWithoutReasonRes.json();
    assert.equal(rejectWithoutReasonRes.status, 400);
    assert.equal(rejectWithoutReasonBody.success, false);
    assert.equal(rejectWithoutReasonBody.code, "VALIDATION_FAILED");

    const rejectRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${firstPaymentId}/reject`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ reason: "Bukti transfer blur" }),
      }
    );
    const rejectBody = await rejectRes.json();
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectBody.success, true);

    const firstPaymentAfterReject = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.id, firstPaymentId),
      columns: {
        proofStatus: true,
        rejectedBy: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });
    assert.equal(firstPaymentAfterReject?.proofStatus, "REJECTED");
    assert.equal(Number(firstPaymentAfterReject?.rejectedBy), adminId);
    assert.ok(firstPaymentAfterReject?.rejectedAt);
    assert.equal(firstPaymentAfterReject?.rejectionReason, "Bukti transfer blur");

    const verifyRejectedRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${firstPaymentId}/verify`,
      {
        method: "PATCH",
        headers: adminHeaders,
      }
    );
    const verifyRejectedBody = await verifyRejectedRes.json();
    assert.equal(verifyRejectedRes.status, 400);
    assert.equal(verifyRejectedBody.success, false);
    assert.equal(verifyRejectedBody.code, "PAYMENT_PROOF_REJECTED");

    const addReplacementPaymentRes = await fetch(
      `${baseUrl}/api/jamaah/admin/${bookingNumber}/payments`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          amount: 500000,
          paymentDate: new Date().toISOString(),
          proofUrl: `/uploads/payments/integration-reupload-${suffix}.jpg`,
          notes: "reupload payment proof",
        }),
      }
    );
    const addReplacementPaymentBody = await addReplacementPaymentRes.json();
    assert.equal(addReplacementPaymentRes.status, 201);
    assert.equal(addReplacementPaymentBody.success, true);

    const replacementPaymentId = Number(addReplacementPaymentBody?.data?.paymentId);
    createdPaymentIds.push(replacementPaymentId);
    assert.ok(replacementPaymentId > 0);

    const adminVerifyRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${replacementPaymentId}/verify`,
      {
        method: "PATCH",
        headers: adminHeaders,
      }
    );
    const adminVerifyBody = await adminVerifyRes.json();
    assert.equal(adminVerifyRes.status, 200);
    assert.equal(adminVerifyBody.success, true);

    const paymentAfterVerify = await db.query.jamaahPayments.findFirst({
      where: eq(jamaahPayments.id, replacementPaymentId),
      columns: { verifiedBy: true, verifiedAt: true },
    });
    assert.equal(Number(paymentAfterVerify?.verifiedBy), adminId);
    assert.ok(paymentAfterVerify?.verifiedAt);

    const jamaahAfterVerify = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.id, jamaahId),
      columns: { totalPayment: true, outstanding: true, statusPayment: true },
    });

    const expectedStateAfterVerify = deriveJamaahPaymentState({
      hargaFinal,
      totalPayment: 500000,
    });

    assert.equal(Number(jamaahAfterVerify?.totalPayment), expectedStateAfterVerify.totalPayment);
    assert.equal(Number(jamaahAfterVerify?.outstanding), expectedStateAfterVerify.outstanding);
    assert.equal(jamaahAfterVerify?.statusPayment, expectedStateAfterVerify.statusPayment);

    const duplicateVerifyRes = await fetch(
      `${baseUrl}/api/jamaah/admin/payments/${replacementPaymentId}/verify`,
      {
        method: "PATCH",
        headers: adminHeaders,
      }
    );
    const duplicateVerifyBody = await duplicateVerifyRes.json();
    assert.equal(duplicateVerifyRes.status, 400);
    assert.equal(duplicateVerifyBody.success, false);
    assert.match(String(duplicateVerifyBody.message || ""), /sudah diverifikasi/i);
  });
});
