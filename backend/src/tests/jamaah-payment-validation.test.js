import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { jamaahAdminSchemas } from "../validators/index.js";

describe("jamaah payment validation", () => {
  it("accepts payment payload with valid payment proof path", () => {
    const payload = {
      amount: 1500000,
      bankId: 1,
      paidBy: "Ahmad",
      proofUrl: "/uploads/payments/1771000000000-proof.jpg",
      notes: "DP pertama",
    };

    const result = jamaahAdminSchemas.addPayment.safeParse(payload);
    assert.equal(result.success, true);
  });

  it("rejects payment payload when proofUrl points outside payment folder", () => {
    const payload = {
      amount: 1500000,
      proofUrl: "/uploads/documents/not-proof.pdf",
    };

    const result = jamaahAdminSchemas.addPayment.safeParse(payload);
    assert.equal(result.success, false);

    const message = result.error.issues.find((issue) => issue.path[0] === "proofUrl")?.message;
    assert.match(String(message || ""), /proofUrl tidak valid/);
  });

  it("rejects payment payload when proofUrl contains traversal pattern", () => {
    const payload = {
      amount: 1500000,
      proofUrl: "/uploads/payments/../secrets.txt",
    };

    const result = jamaahAdminSchemas.addPayment.safeParse(payload);
    assert.equal(result.success, false);
  });
});
