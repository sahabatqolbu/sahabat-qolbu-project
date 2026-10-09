import assert from "node:assert/strict";
import test from "node:test";
import { financialNumberPrefix, nextFinancialNumber } from "../utils/financialDocumentNumber.js";

test("financial document numbers use Jakarta issue date and daily sequence", () => {
  const date = new Date("2026-10-08T18:00:00.000Z");
  const invoice = financialNumberPrefix("INVOICE", date);
  const receipt = financialNumberPrefix("RECEIPT", date);
  assert.equal(invoice, "INV/SQ/2026/0910");
  assert.equal(receipt, "KWT/SQ/2026/0910");
  assert.equal(nextFinancialNumber(invoice, []), "INV/SQ/2026/091001");
  assert.equal(nextFinancialNumber(invoice, ["INV/SQ/2026/091001", "INV/SQ/2026/091099"]), "INV/SQ/2026/0910100");
});
