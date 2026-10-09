import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { renderFinancialDocument } from "../utils/financialDocumentPdf.js";

const base = {
  number: "INV/SQ/202610/ABC12345", issuedAt: "2026-10-09T00:00:00.000Z",
  customerName: "Keluarga Darmawan", customerPhone: "081234567890", memberCount: 4,
  programName: "Umroh Keluarga November", departureDate: "2026-11-06", roomType: "QUAD",
  totalAmount: 110000000, previousPaid: 10000000, currentPayment: 5000000, remaining: 95000000,
  paymentStatus: "Sebagian", paidBy: "Darmawan", paymentMethod: "Transfer bank",
  amountWords: "lima juta rupiah", createdByName: "Admin", verifierName: "Finance",
  bank: { bankName: "BSI", accountNumber: "123456789", accountName: "PT Sahabat Qolbu Cahaya Baitullah" },
  items: Array.from({ length: 5 }, (_, index) => ({ description: `Paket Umrah - Anggota ${index + 1}`, qty: 1, unitPrice: 22000000, amount: 22000000 })),
};

test("invoice A4 with continuation keeps source template and remains a valid PDF", async () => {
  const bytes = await renderFinancialDocument({ ...base, type: "INVOICE" });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);
  for (const page of pdf.getPages()) {
    assert.ok(Math.abs(page.getWidth() - 595.28) < 0.1);
    assert.ok(Math.abs(page.getHeight() - 841.89) < 0.1);
  }
});

test("kwitansi A4 renders a verified payment", async () => {
  const bytes = await renderFinancialDocument({ ...base, type: "RECEIPT", number: "KWT/SQ/202610/ABC12345" });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
});

test("voided document remains printable with cancellation mark", async () => {
  const regular = await renderFinancialDocument({ ...base, type: "RECEIPT", number: "KWT/SQ/202610/ABC12345" });
  const voided = await renderFinancialDocument({ ...base, type: "RECEIPT", number: "KWT/SQ/202610/ABC12345" }, { voided: true });
  assert.equal((await PDFDocument.load(voided)).getPageCount(), 1);
  assert.ok(voided.length > regular.length);
});
