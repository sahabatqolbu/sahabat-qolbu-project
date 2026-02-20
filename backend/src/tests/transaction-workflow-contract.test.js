import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateTransactionStatusChange } from "../utils/transactionWorkflow.js";

describe("transaction workflow contract", () => {
  it("returns INVALID_TRANSITION code for forbidden transition", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "PENDING",
      nextStatus: "VERIFIED",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_TRANSITION");
  });

  it("returns REASON_REQUIRED code when remarks missing for cancel/refund", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "PAID",
      nextStatus: "CANCELLED",
      remarks: "   ",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "REASON_REQUIRED");
  });

  it("returns INVALID_STATUS code when status input missing", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "PAID",
      nextStatus: null,
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_STATUS");
  });
});
