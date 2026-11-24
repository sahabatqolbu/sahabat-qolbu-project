import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { registerForPackage, placeholderEmail, packageRegistrationSchema } = await import("../controllers/packageRegistrationController.js");
const { sendEmail } = await import("../utils/email.js");

const fakeRes = () => {
  const res = { statusCode: 200, body: null, cookies: {} };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.cookie = (name, value) => { res.cookies[name] = value; return res; };
  return res;
};
const valid = { fullName: "Ahmad Fauzi", phone: "0812-3456-7890", packageId: 1, roomType: "QUAD", people: 2, formStartedAt: Date.now() - 60_000 };

test("the one-screen form needs only name, WhatsApp, package, room and people", () => {
  assert.equal(packageRegistrationSchema.safeParse(valid).success, true);
  assert.equal(packageRegistrationSchema.safeParse({ ...valid, roomType: "SUITE" }).success, false);
  assert.equal(packageRegistrationSchema.safeParse({ ...valid, people: 11 }).success, false);
});

test("bots filling the hidden field or submitting instantly get no account or session", async () => {
  for (const body of [{ ...valid, honeypot: "spam" }, { ...valid, formStartedAt: Date.now() }]) {
    const res = fakeRes();
    await registerForPackage({ body, ip: "127.0.0.1", get: () => undefined }, res, assert.fail);
    assert.equal(res.statusCode, 400);
    assert.equal(res.cookies.access_token, undefined);
  }
});

test("accounts without email get a reserved .invalid address that is never mailed", async () => {
  const email = placeholderEmail("6281234567890");
  assert.match(email, /^daftar-6281234567890-[0-9a-f]{6}@sahabatqolbu\.invalid$/);
  const result = await sendEmail({ to: email, subject: "x", text: "x", html: "x" });
  assert.equal(result.skipped, true);
});
