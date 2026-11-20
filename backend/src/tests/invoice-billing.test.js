import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { invoiceBilling } = await import("../controllers/financialDocumentController.js");

const source = (previousPaid, currentPayment = 0) => ({ totalAmount: 70_000_000, previousPaid, currentPayment });

test("an invoice bills the requested amount and never records money received", () => {
  const bill = invoiceBilling(source(10_000_000), 25_000_000);
  assert.deepEqual(
    { previousPaid: bill.previousPaid, currentPayment: bill.currentPayment, amountDue: bill.amountDue, remaining: bill.remaining, status: bill.invoiceStatus },
    { previousPaid: 10_000_000, currentPayment: 0, amountDue: 25_000_000, remaining: 35_000_000, status: "CICILAN" },
  );
});

test("leaving the amount empty bills the whole outstanding balance", () => {
  const bill = invoiceBilling(source(10_000_000));
  assert.equal(bill.amountDue, 60_000_000);
  assert.equal(bill.remaining, 0);
  assert.equal(bill.invoiceStatus, "PELUNASAN");
});

test("a first partial bill is a down payment and a first full bill is full payment", () => {
  assert.equal(invoiceBilling(source(0), 10_000_000).invoiceStatus, "DOWN PAYMENT (DP)");
  assert.equal(invoiceBilling(source(0)).invoiceStatus, "PEMBAYARAN PENUH");
});

test("payments already verified on a booking count as paid, not as received now", () => {
  const bill = invoiceBilling(source(5_000_000, 5_000_000));
  assert.equal(bill.previousPaid, 10_000_000);
  assert.equal(bill.currentPayment, 0);
});

test("billing more than the outstanding balance or a settled bill is rejected", () => {
  assert.throws(() => invoiceBilling(source(10_000_000), 60_000_001), /melebihi sisa tagihan/);
  assert.throws(() => invoiceBilling(source(70_000_000)), /sudah lunas/);
});
