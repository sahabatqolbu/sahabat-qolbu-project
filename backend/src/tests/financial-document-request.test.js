import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { requestSchema, normalizeRequest } = await import("../controllers/financialDocumentController.js");

// What the dashboard form sends before any manual field is filled.
const formDefaults = {
  customerName: "", customerPhone: "", memberCount: 1, programName: "",
  items: [{ description: "", qty: 1, unitPrice: 0 }],
  previousPaid: 0, currentPayment: 0, paymentMethod: "Transfer bank", paidBy: "", confirmedReceived: true,
};

for (const [label, request] of [
  ["receipt from invoice", { type: "RECEIPT", sourceType: "INVOICE", sourceId: "INV/SQ/2026/11/0001" }],
  ["invoice from booking", { type: "INVOICE", sourceType: "BOOKING", sourceId: "SQ-20261009-0001", bankId: 1 }],
  ["receipt from payment", { type: "RECEIPT", sourceType: "PAYMENT", sourceId: "12", bankId: null }],
]) {
  test(`${label} passes validation with the form's blank manual fields`, () => {
    const parsed = requestSchema.safeParse(normalizeRequest({ ...formDefaults, ...request }));
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    assert.equal(parsed.data.items, undefined);
  });
}

test("manual documents still require real manual fields", () => {
  const parsed = requestSchema.safeParse(normalizeRequest({ ...formDefaults, type: "INVOICE", sourceType: "MANUAL" }));
  assert.equal(parsed.success, false);
});
