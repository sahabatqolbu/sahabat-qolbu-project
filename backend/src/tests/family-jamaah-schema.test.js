import test from "node:test";
import assert from "node:assert/strict";
import { adminUserSchemas } from "../validators/index.js";

const basePayload = {
  fullName: "Ahmad Kepala Keluarga",
  email: "keluarga@example.com",
  phone: "081234567890",
  role: "JAMAAH",
  packageId: 1,
};

test("admin can create one jamaah account with family members", () => {
  const result = adminUserSchemas.create.safeParse({
    ...basePayload,
    familyMembers: [
      { fullName: "Siti Pasangan", relationship: "PASANGAN" },
      { fullName: "Anak Pertama", relationship: "ANAK" },
      { fullName: "Anak Kedua", relationship: "ANAK" },
    ],
  });

  assert.equal(result.success, true);
  assert.equal(result.data.familyMembers.length, 3);
});

test("family account rejects incomplete member identity", () => {
  const result = adminUserSchemas.create.safeParse({
    ...basePayload,
    familyMembers: [{ fullName: "", relationship: "ANAK" }],
  });

  assert.equal(result.success, false);
});
