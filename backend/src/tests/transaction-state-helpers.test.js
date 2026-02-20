import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  VALID_TRANSACTION_STATUS_TRANSITIONS,
  isReasonRequiredForStatus,
  isTransactionTransitionAllowed,
} from "../utils/transactionState.js";

describe("transaction state helpers", () => {
  it("exposes expected transition map", () => {
    assert.deepEqual(VALID_TRANSACTION_STATUS_TRANSITIONS.PENDING, [
      "PARTIAL",
      "PAID",
      "CANCELLED",
    ]);
    assert.deepEqual(VALID_TRANSACTION_STATUS_TRANSITIONS.PARTIAL, [
      "PAID",
      "CANCELLED",
    ]);
    assert.deepEqual(VALID_TRANSACTION_STATUS_TRANSITIONS.PAID, [
      "VERIFIED",
      "CANCELLED",
      "REFUNDED",
    ]);
  });

  it("evaluates allowed transitions correctly", () => {
    assert.equal(isTransactionTransitionAllowed("PENDING", "PAID"), true);
    assert.equal(isTransactionTransitionAllowed("PENDING", "VERIFIED"), false);
    assert.equal(isTransactionTransitionAllowed("CANCELLED", "PAID"), false);
  });

  it("requires reason only for cancellation and refund", () => {
    assert.equal(isReasonRequiredForStatus("CANCELLED"), true);
    assert.equal(isReasonRequiredForStatus("REFUNDED"), true);
    assert.equal(isReasonRequiredForStatus("PAID"), false);
    assert.equal(isReasonRequiredForStatus("VERIFIED"), false);
  });
});
