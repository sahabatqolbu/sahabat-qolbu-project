import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { db } = await import("../db/index.js");
const { exchangeDataLink, hashLinkToken, toWhatsAppNumber } = await import("../controllers/jamaahDataLinkController.js");

const fakeRes = () => {
  const res = { statusCode: 200, body: null, cookies: {} };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.cookie = (name, value) => { res.cookies[name] = value; return res; };
  return res;
};
const fakeReq = (token) => ({ body: { token }, ip: "127.0.0.1", secure: true, get: () => undefined });

const withMocks = async (mocks, fn) => {
  const saved = [];
  for (const [target, key, value] of mocks) { saved.push([target, key, target[key]]); target[key] = value; }
  try { return await fn(); } finally { for (const [target, key, value] of saved) target[key] = value; }
};

test("WhatsApp numbers are normalised to the 62 prefix", () => {
  assert.equal(toWhatsAppNumber("0812-3456-7890"), "6281234567890");
  assert.equal(toWhatsAppNumber("+62 812 3456 7890"), "6281234567890");
  assert.equal(toWhatsAppNumber("81234567890"), "6281234567890");
  assert.equal(toWhatsAppNumber(""), null);
});

test("link tokens are stored as a SHA-256 hash, not in plain text", () => {
  const hash = hashLinkToken("abc");
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, "abc");
});

test("malformed, unknown or revoked links are rejected without a session", async () => {
  const short = fakeRes();
  await exchangeDataLink(fakeReq("short"), short, assert.fail);
  assert.equal(short.statusCode, 400);

  const unknown = fakeRes();
  await withMocks([[db.query.jamaahDataLinks, "findFirst", async () => undefined]], () =>
    exchangeDataLink(fakeReq("x".repeat(43)), unknown, assert.fail));
  assert.equal(unknown.statusCode, 410);
  assert.equal(unknown.cookies.access_token, undefined);
});

test("a link for a non-jamaah account never opens a session", async () => {
  const res = fakeRes();
  await withMocks([
    [db.query.jamaahDataLinks, "findFirst", async () => ({ id: 1, userId: 9, useCount: 0 })],
    [db.query.users, "findFirst", async () => ({ id: 9, role: "ADMIN", isActive: true })],
  ], () => exchangeDataLink(fakeReq("x".repeat(43)), res, assert.fail));
  assert.equal(res.statusCode, 410);
  assert.equal(res.cookies.access_token, undefined);
});
