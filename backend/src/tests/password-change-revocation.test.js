import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { isTokenRevokedByPasswordChange } = await import("../middlewares/authMiddleware.js");

const changedAt = new Date("2026-11-13T09:00:00.500Z");
const seconds = (iso) => Math.floor(new Date(iso).getTime() / 1000);

test("token issued before a password change is revoked", () => {
  const decoded = { iat: seconds("2026-11-13T08:59:00Z") };
  assert.equal(isTokenRevokedByPasswordChange(decoded, { passwordChangedAt: changedAt }), true);
});

test("token issued in the same second or later stays valid", () => {
  assert.equal(isTokenRevokedByPasswordChange({ iat: seconds("2026-11-13T09:00:00Z") }, { passwordChangedAt: changedAt }), false);
  assert.equal(isTokenRevokedByPasswordChange({ iat: seconds("2026-11-13T09:05:00Z") }, { passwordChangedAt: changedAt }), false);
});

test("users who never changed their password are unaffected", () => {
  assert.equal(isTokenRevokedByPasswordChange({ iat: 1 }, { passwordChangedAt: null }), false);
});
