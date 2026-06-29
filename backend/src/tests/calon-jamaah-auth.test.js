import test from "node:test";
import assert from "node:assert/strict";
import { authSchemas } from "../validators/index.js";

test("calon jamaah registration rejects mismatched password confirmation", () => {
  assert.throws(() =>
    authSchemas.registerCalonJamaah.parse({
      fullName: "Calon Jamaah",
      email: "lead@example.com",
      phone: "081234567890",
      password: "StrongPass1!",
      confirmPassword: "StrongPass2!",
      honeypot: "",
      formStartedAt: Date.now() - 3000,
    }),
  );
});

test("calon jamaah registration accepts valid payload and normalizes email", () => {
  const parsed = authSchemas.registerCalonJamaah.parse({
    fullName: "Calon Jamaah",
    email: "Lead@Example.com",
    phone: "081234567890",
    password: "StrongPass1!",
    confirmPassword: "StrongPass1!",
    honeypot: "",
    formStartedAt: Date.now() - 3000,
  });

  assert.equal(parsed.email, "lead@example.com");
  assert.equal(parsed.sourceType, "GENERAL");
});
