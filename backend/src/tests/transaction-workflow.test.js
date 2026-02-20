import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateTransactionStatusChange } from "../utils/transactionWorkflow.js";

describe("transaction workflow validation", () => {
  it("accepts unchanged status and normalizes remarks", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "PAID",
      nextStatus: "PAID",
      remarks: "  no-op  ",
    });

    assert.equal(result.ok, true);
    assert.equal(result.unchanged, true);
    assert.equal(result.normalizedRemarks, "no-op");
  });

  it("rejects invalid transition", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "CANCELLED",
      nextStatus: "PAID",
      remarks: "retry",
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_TRANSITION");
  });

  it("requires reason for refund/cancel transitions", () => {
    const refunded = validateTransactionStatusChange({
      currentStatus: "PAID",
      nextStatus: "REFUNDED",
      remarks: "",
    });

    assert.equal(refunded.ok, false);
    assert.equal(refunded.code, "REASON_REQUIRED");

    const cancelled = validateTransactionStatusChange({
      currentStatus: "PARTIAL",
      nextStatus: "CANCELLED",
      remarks: "   ",
    });

    assert.equal(cancelled.ok, false);
    assert.equal(cancelled.code, "REASON_REQUIRED");
  });

  it("accepts valid transition and trims remarks", () => {
    const result = validateTransactionStatusChange({
      currentStatus: "PAID",
      nextStatus: "VERIFIED",
      remarks: "  finance checked  ",
    });

    assert.equal(result.ok, true);
    assert.equal(result.unchanged, false);
    assert.equal(result.normalizedRemarks, "finance checked");
  });
});
