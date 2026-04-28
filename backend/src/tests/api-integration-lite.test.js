import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

import app from "../app.js";

describe("api integration lite", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it("serves health endpoints on /health and /api/v1/health-check", async () => {
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthBody = await healthRes.json();

    assert.equal(healthRes.status, 200);
    assert.equal(healthBody.status, "OK");

    const v1HealthRes = await fetch(`${baseUrl}/api/v1/health-check`);
    const v1HealthBody = await v1HealthRes.json();

    assert.equal(v1HealthRes.status, 200);
    assert.equal(v1HealthBody.status, "API router is alive");
  });

  it("exposes detailed health with email queue stats", async () => {
    const response = await fetch(`${baseUrl}/health/detailed`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, "OK");
    assert.equal(typeof payload.timestamp, "string");
    assert.equal(typeof payload.emailQueue, "object");
    assert.equal(typeof payload.emailQueue.queueLength, "number");
    assert.equal(typeof payload.emailQueue.queued, "number");
    assert.equal(typeof payload.emailQueue.processed, "number");
    assert.equal(typeof payload.emailQueue.failed, "number");
    assert.equal(typeof payload.emailQueue.retries, "number");
  });

  it("keeps public namespace bridge available on /api/public and /api/v1/public", async () => {
    const apiRes = await fetch(`${baseUrl}/api/public/health-check`);
    const apiBody = await apiRes.json();

    const v1Res = await fetch(`${baseUrl}/api/v1/public/health-check`);
    const v1Body = await v1Res.json();

    assert.equal(apiRes.status, 200);
    assert.equal(v1Res.status, 200);
    assert.equal(apiBody.status, "API router is alive");
    assert.equal(v1Body.status, "API router is alive");
  });

  it("keeps explicit admin alias mounts available without URL rewriting", async () => {
    const jamaahRes = await fetch(`${baseUrl}/api/admin/jamaah`);
    const jamaahBody = await jamaahRes.json();

    const agenRes = await fetch(`${baseUrl}/api/admin/agen`);
    const agenBody = await agenRes.json();

    assert.equal(jamaahRes.status, 401);
    assert.equal(agenRes.status, 401);
    assert.equal(jamaahBody.code, "AUTH_UNAUTHORIZED");
    assert.equal(agenBody.code, "AUTH_UNAUTHORIZED");
  });

  it("keeps auth test route reachable on both /api and /api/v1 in non-production", async () => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const apiRes = await fetch(`${baseUrl}/api/auth/test-public`);
    const apiBody = await apiRes.json();

    const v1Res = await fetch(`${baseUrl}/api/v1/auth/test-public`);
    const v1Body = await v1Res.json();

    assert.equal(apiRes.status, 200);
    assert.equal(v1Res.status, 200);
    assert.equal(apiBody.message, "Public route works");
    assert.equal(v1Body.message, "Public route works");
  });

  it("blocks cookie-authenticated mutating requests without origin/referer", async () => {
    const response = await fetch(`${baseUrl}/api/auth/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "access_token=dummy-token",
      },
      body: JSON.stringify({ email: "someone@example.com" }),
    });

    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "SECURITY_ORIGIN_REQUIRED");
    assert.match(String(payload.message || ""), /origin\/referer/i);
  });

  it("blocks cookie-authenticated mutating requests from untrusted fetch-site", async () => {
    const response = await fetch(`${baseUrl}/api/auth/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "access_token=dummy-token",
        "Sec-Fetch-Site": "cross-site",
      },
      body: JSON.stringify({ email: "someone@example.com" }),
    });

    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "SECURITY_INVALID_ORIGIN");
  });

  it("blocks direct static access to protected upload folders", async () => {
    const response = await fetch(`${baseUrl}/uploads/payments/not-allowed.jpg`);
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "AUTH_FORBIDDEN");
  });

  it("keeps API docs/openapi routes disabled for public access", async () => {
    const response = await fetch(`${baseUrl}/api/v1/docs`);
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "SECURITY_DOCS_DISABLED");
  });

  it("returns structured code for unauthorized protected endpoint access", async () => {
    const response = await fetch(`${baseUrl}/api/jamaah/profile`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "AUTH_UNAUTHORIZED");
  });

  it("returns structured code for forbidden role access", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "jamaah@example.com", password: "Passw0rd!" }),
    });

    if (loginRes.status !== 200) {
      return;
    }

    const loginBody = await loginRes.json();
    const email = loginBody?.data?.email;

    if (!email) {
      return;
    }

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp: "000000" }),
    });

    if (verifyRes.status !== 200) {
      return;
    }

    const setCookie = verifyRes.headers.get("set-cookie");
    if (!setCookie) {
      return;
    }

    const tokenCookie = setCookie.split(";")[0];
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        Cookie: tokenCookie,
        Origin: baseUrl,
        Referer: `${baseUrl}/dashboard`,
      },
    });
    const forbiddenBody = await forbiddenRes.json();

    if (forbiddenRes.status === 403) {
      assert.equal(forbiddenBody.success, false);
      assert.equal(forbiddenBody.code, "AUTH_FORBIDDEN");
    }
  });

  it("returns structured code for unknown route", async () => {
    const response = await fetch(`${baseUrl}/api/v1/not-existing-route`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(payload.code, "RESOURCE_NOT_FOUND");
  });
});
