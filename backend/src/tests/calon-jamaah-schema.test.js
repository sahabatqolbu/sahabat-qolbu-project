import test from "node:test";
import assert from "node:assert/strict";
import { userSchemas } from "../validators/index.js";

test("public user create schema allows CALON_JAMAAH role internally", () => {
  const parsed = userSchemas.create.parse({
    email: "Lead@Example.com",
    password: "StrongPass1!",
    fullName: "Calon Jamaah",
    phone: "081234567890",
    role: "CALON_JAMAAH",
  });

  assert.equal(parsed.email, "lead@example.com");
  assert.equal(parsed.role, "CALON_JAMAAH");
});

test("public user create schema still rejects unknown roles", () => {
  assert.throws(() =>
    userSchemas.create.parse({
      email: "lead@example.com",
      password: "StrongPass1!",
      fullName: "Calon Jamaah",
      phone: "081234567890",
      role: "SUPERADMIN",
    }),
  );
});
