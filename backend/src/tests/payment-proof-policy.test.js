import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isPaymentProofPathValid,
  normalizeProofPath,
} from "../utils/paymentProofPolicy.js";

describe("payment proof policy", () => {
  it("normalizes absolute URL to pathname", () => {
    const normalized = normalizeProofPath(
      "https://api.example.com/uploads/payments/proof-1.jpg",
    );
    assert.equal(normalized, "/uploads/payments/proof-1.jpg");
  });

  it("accepts valid payment proof paths", () => {
    assert.equal(
      isPaymentProofPathValid("/uploads/payments/1771000000000-abc.jpg"),
      true,
    );
    assert.equal(
      isPaymentProofPathValid(
        "https://api.example.com/api/protected-uploads/payments/proof-a.webp",
      ),
      true,
    );
  });

  it("rejects invalid or unsafe paths", () => {
    assert.equal(isPaymentProofPathValid("/uploads/profiles/avatar.jpg"), false);
    assert.equal(isPaymentProofPathValid("/uploads/payments/../secrets.txt"), false);
    assert.equal(isPaymentProofPathValid(""), false);
    assert.equal(isPaymentProofPathValid(null), false);
  });
});
