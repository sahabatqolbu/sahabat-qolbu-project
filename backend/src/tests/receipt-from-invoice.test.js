import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "ci-test-jwt-secret-0123456789abcdef";
const { db } = await import("../db/index.js");
const { resolveFinancialSource } = await import("../utils/financialDocumentData.js");

const invoiceRow = (snapshot, status = "ISSUED") => ({
  id: 7, type: "INVOICE", number: "INV/SQ/2026/11/0007", status,
  snapshot: {
    customerName: "Bapak Ahmad", customerPhone: "0812", memberCount: 2, programName: "Umroh Desember",
    departureDate: "2026-12-14", roomType: "Quad",
    items: [{ description: "Paket Quad", qty: 2, unitPrice: 35_000_000, amount: 70_000_000 }],
    totalAmount: 70_000_000, ...snapshot,
  },
});

const withInvoice = async (row, fn) => {
  const original = db.query.financialDocuments.findFirst;
  db.query.financialDocuments.findFirst = async () => row;
  try { return await fn(); } finally { db.query.financialDocuments.findFirst = original; }
};

const receipt = (input) => resolveFinancialSource({
  type: "RECEIPT", sourceType: "INVOICE", sourceId: "INV/SQ/2026/11/0007",
  input: { confirmedReceived: true, actorName: "Finance", ...input },
});

test("receipt from an invoice copies the bill and defaults to the billed amount", async () => {
  const result = await withInvoice(invoiceRow({ previousPaid: 10_000_000, currentPayment: 0, amountDue: 25_000_000 }), () => receipt({}));
  assert.equal(result.customerName, "Bapak Ahmad");
  assert.equal(result.items[0].qty, 2);
  assert.equal(result.totalAmount, 70_000_000);
  assert.equal(result.previousPaid, 10_000_000);
  assert.equal(result.currentPayment, 25_000_000);
  assert.equal(result.paymentStatus, "Sebagian");
  assert.equal(result.invoiceNumber, "INV/SQ/2026/11/0007");
});

test("the received amount can be changed but not above the invoice balance", async () => {
  const bill = invoiceRow({ previousPaid: 10_000_000, currentPayment: 0, amountDue: 25_000_000 });
  const partial = await withInvoice(bill, () => receipt({ currentPayment: 20_000_000 }));
  assert.equal(partial.currentPayment, 20_000_000);
  const full = await withInvoice(bill, () => receipt({ currentPayment: 60_000_000 }));
  assert.equal(full.paymentStatus, "Lunas");
  await assert.rejects(withInvoice(bill, () => receipt({ currentPayment: 60_000_001 })), /melebihi sisa tagihan/);
});

test("void invoices and unconfirmed payments are rejected", async () => {
  await assert.rejects(withInvoice(invoiceRow({ previousPaid: 0, amountDue: 10_000_000 }, "VOID"), () => receipt({})), /dibatalkan/);
  await assert.rejects(withInvoice(invoiceRow({ previousPaid: 0, amountDue: 10_000_000 }), () => receipt({ confirmedReceived: false })), /Konfirmasi/);
});

test("old-model invoices count their received-now amount as already paid", async () => {
  const result = await withInvoice(invoiceRow({ previousPaid: 10_000_000, currentPayment: 5_000_000 }), () => receipt({}));
  assert.equal(result.previousPaid, 15_000_000);
  assert.equal(result.currentPayment, 55_000_000);
});
