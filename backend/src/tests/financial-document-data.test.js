import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../db/index.js";
import { resolveFinancialSource } from "../utils/financialDocumentData.js";

const manualInput = {
  customerName: "Test Customer", items: [{ description: "Paket", qty: 1, unitPrice: 15000000 }],
  previousPaid: 0, currentPayment: 15000000, confirmedReceived: true, actorName: "Finance",
};

test("manual invoice preserves received payment and computes a fully paid balance", async () => {
  const result = await resolveFinancialSource({ type: "INVOICE", sourceType: "MANUAL", input: manualInput });
  assert.equal(result.previousPaid, 0);
  assert.equal(result.currentPayment, 15000000);
  assert.equal(result.totalAmount - result.previousPaid - result.currentPayment, 0);
  assert.equal(result.paymentStatus, "Lunas");
  assert.equal(result.verifierName, "Finance");
});

test("manual invoice requires confirmation and rejects payments above the package total", async () => {
  await assert.rejects(resolveFinancialSource({ type: "INVOICE", sourceType: "MANUAL", input: { ...manualInput, confirmedReceived: false } }), /Konfirmasi/);
  await assert.rejects(resolveFinancialSource({ type: "INVOICE", sourceType: "MANUAL", input: { ...manualInput, previousPaid: 1 } }), /melebihi/);
});

test("booking invoice splits the latest family payment from previous receipts", async () => {
  const saved = [];
  const mock = (query, method, value) => {
    saved.push([query, method, query[method]]);
    query[method] = async () => value;
  };
  try {
    const member = { id: 1, userId: 2, packageId: 3, hargaFinal: 49600000, bookingNumber: "TEST", memberName: "Test" };
    mock(db.query.jamaahData, "findFirst", member);
    mock(db.query.jamaahData, "findMany", [member, { ...member, id: 2 }, { ...member, id: 3 }, { ...member, id: 4 }]);
    mock(db.query.packages, "findFirst", { name: "Umroh Plus Turki" });
    mock(db.query.users, "findFirst", { fullName: "Test" });
    mock(db.query.jamaahPayments, "findMany", [
      { id: 1, amount: 28000000, verifiedAt: "2026-09-01", familyPaymentGroupId: null },
      ...[2, 3, 4, 5].map((id) => ({ id, amount: 42600000, verifiedAt: "2026-09-18", familyPaymentGroupId: "family-final" })),
    ]);
    const result = await resolveFinancialSource({ type: "INVOICE", sourceType: "BOOKING", sourceId: "TEST", input: {} });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].qty, 4);
    assert.equal(result.totalAmount, 198400000);
    assert.equal(result.previousPaid, 28000000);
    assert.equal(result.currentPayment, 170400000);
    assert.equal(result.paymentStatus, "Lunas");
  } finally {
    for (const [query, method, original] of saved) query[method] = original;
  }
});
