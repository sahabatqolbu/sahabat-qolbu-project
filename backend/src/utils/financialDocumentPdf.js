import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb } from "pdf-lib";

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, "../assets/financial-documents");
const fontFile = path.join(assets, "NotoSerif.ttf");
const A4 = [595.28, 841.89];
const navy = rgb(0.04, 0.13, 0.24);
const gold = rgb(0.98, 0.76, 0.28);
const rupiah = (value) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
const nominal = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));
const dateText = (value) => value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value)).toUpperCase() : "-";
const shortDate = (value) => value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "-";

const put = (page, font, value, left, top, size, maxWidth, color = navy) => {
  let display = String(value ?? "-").replace(/\s+/g, " ").trim() || "-";
  let fittedSize = size;
  while (fittedSize > Math.max(6, size - 2) && font.widthOfTextAtSize(display, fittedSize) > maxWidth) fittedSize -= 0.25;
  while (display.length > 1 && font.widthOfTextAtSize(display, fittedSize) > maxWidth) display = `${display.slice(0, -2)}…`;
  page.drawText(display, { x: left, y: A4[1] - top - fittedSize * 0.8, size: fittedSize, font, color });
};

const whiteout = (page, left, top, width, height, color = rgb(1, 1, 1)) => {
  page.drawRectangle({ x: left, y: A4[1] - top - height, width, height, color });
};

const drawSignature = async (pdf, page, snapshot, left, top, width, height) => {
  if (snapshot.signaturePng) {
    const signature = await pdf.embedPng(Buffer.from(snapshot.signaturePng, "base64"));
    const scale = Math.min(width / signature.width, height / signature.height);
    page.drawImage(signature, { x: left + (width - signature.width * scale) / 2, y: A4[1] - top - height, width: signature.width * scale, height: signature.height * scale });
  }
  if (snapshot.stampPng) {
    const stamp = await pdf.embedPng(Buffer.from(snapshot.stampPng, "base64"));
    const stampSize = Math.min(height + 8, 50);
    const scale = Math.min(stampSize / stamp.width, stampSize / stamp.height);
    page.drawImage(stamp, { x: left + width - stamp.width * scale, y: A4[1] - top - height, width: stamp.width * scale, height: stamp.height * scale });
  }
};

const continuation = (pdf, font, snapshot, items, startIndex = 0) => {
  const page = pdf.addPage(A4);
  page.drawText(`${snapshot.type === "INVOICE" ? "Rincian Invoice" : "Rincian Kwitansi"} ${snapshot.number}`, {
    x: 42, y: 790, size: 16, font, color: navy,
  });
  let cursor = 760;
  for (const [index, item] of items.entries()) {
    if (cursor < 65) {
      cursor = 760;
      const next = pdf.addPage(A4);
      next.drawText(`${snapshot.number} - lanjutan`, { x: 42, y: 790, size: 12, font, color: navy });
      // The next page is populated by the next iteration through `activePage`.
    }
    const activePage = pdf.getPages().at(-1);
    const description = String(item.description || "-");
    const chunks = description.match(/.{1,90}(?:\s|$)|.{1,90}/g) || [description];
    activePage.drawText(`${index + startIndex + 1}. ${chunks[0]}`.slice(0, 100), { x: 42, y: cursor, size: 10, font, color: navy });
    cursor -= 16;
    for (const chunk of chunks.slice(1)) {
      activePage.drawText(chunk.trim(), { x: 55, y: cursor, size: 10, font, color: navy });
      cursor -= 16;
    }
    activePage.drawText(`${item.qty} x ${rupiah(item.unitPrice)} = ${rupiah(item.amount)}`, { x: 55, y: cursor, size: 10, font, color: navy });
    cursor -= 28;
  }
};

export const renderFinancialDocument = async (snapshot, { voided = false } = {}) => {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await readFile(fontFile));
  const image = await pdf.embedPng(await readFile(path.join(assets, snapshot.type === "INVOICE" ? "invoice.png" : "receipt.png")));
  const page = pdf.addPage(A4);
  page.drawImage(image, { x: 0, y: 0, width: A4[0], height: A4[1] });

  if (snapshot.type === "INVOICE") {
    whiteout(page, 98, 248, 97, 15);
    put(page, font, snapshot.number, 99.8, 250.1, snapshot.number.length > 20 ? 7.5 : 9, 96);
    put(page, font, dateText(snapshot.issuedAt), 99.8, 265.6, 9, 96);
    put(page, font, snapshot.paymentStatus === "Sebagian" ? "DOWN PAYMENT (DP)" : snapshot.paymentStatus, 99.8, 280.9, 8, 96);
    put(page, font, snapshot.customerName, 294.2, 250.3, 8.5, 85);
    put(page, font, snapshot.customerPhone, 294.2, 266.4, 8.5, 85);
    put(page, font, `${snapshot.memberCount} PAX`, 294.2, 281.7, 9, 85);
    put(page, font, snapshot.programName, 488.2, 251.3, 6.8, 94);
    put(page, font, dateText(snapshot.departureDate), 488.2, 265.6, 8, 94);
    put(page, font, snapshot.roomType, 488.2, 280.9, 9, 94);
    for (const [index, item] of snapshot.items.slice(0, 4).entries()) {
      const rowTop = 380 + index * 22.6;
      whiteout(page, 331, rowTop - 4, 117, 18);
      whiteout(page, 453, rowTop - 4, 118, 18);
      put(page, font, item.description, 69.8, rowTop, 9, 195);
      put(page, font, item.qty, 293.1, rowTop, 9, 25);
      put(page, font, rupiah(item.unitPrice), 352.5, rowTop, 9, 96);
      put(page, font, rupiah(item.amount), 480, rowTop, 9, 90);
    }
    put(page, font, nominal(snapshot.totalAmount), 173.6, 508.8, 9.5, 105);
    put(page, font, nominal(snapshot.previousPaid), 173.6, 526.7, 9.5, 105);
    put(page, font, nominal(snapshot.currentPayment || 0), 173.6, 544.5, 9.5, 105);
    put(page, font, nominal(snapshot.remaining), 173.6, 562.2, 9.5, 105);
    put(page, font, nominal(snapshot.previousPaid + (snapshot.currentPayment || 0)), 186.1, 595.2, 16, 93, gold);
    put(page, font, snapshot.bank?.bankName, 397.2, 546.4, 9.5, 145);
    put(page, font, snapshot.bank?.accountNumber, 397.2, 562.2, 9.5, 145);
    put(page, font, snapshot.createdByName, 133.5, 682, 9.5, 132);
    put(page, font, snapshot.verifierName || "Belum ada", 133.5, 697.3, 9.5, 132);
    put(page, font, shortDate(snapshot.verifiedAt), 133.5, 712.5, 9.5, 132);
    await drawSignature(pdf, page, snapshot, 193, 713, 77, 34);
  } else {
    whiteout(page, 331, 190, 185, 17);
    put(page, font, snapshot.number, 332.6, 191.3, 10.5, 190);
    put(page, font, dateText(snapshot.issuedAt), 332.6, 207.5, 10.5, 190);
    put(page, font, snapshot.paymentMethod?.toUpperCase(), 332.6, 223.7, 10.5, 190);
    put(page, font, snapshot.paidBy || snapshot.customerName, 332.6, 277.4, 10.5, 190);
    put(page, font, snapshot.programName, 332.6, 295, 10.5, 190);
    put(page, font, `${snapshot.memberCount} PAX`, 332.6, 311.6, 10.5, 190);
    put(page, font, dateText(snapshot.departureDate), 332.6, 327.5, 10.5, 190);
    whiteout(page, 120, 382, 54, 43, rgb(0.992, 0.989, 0.982));
    const amountText = rupiah(snapshot.currentPayment);
    const amountSize = 32;
    put(page, font, amountText, (A4[0] - font.widthOfTextAtSize(amountText, amountSize)) / 2, 386.6, amountSize, 410);
    whiteout(page, 143, 430, 316, 21, rgb(0.98, 0.94, 0.83));
    put(page, font, `TERBILANG: ${snapshot.amountWords?.toUpperCase()}`, 147.2, 436, 9, 305);
    const paymentRows = [
      [snapshot.totalAmount, 502.4, rgb(0.99, 0.99, 0.99)],
      [snapshot.previousPaid, 526.3, rgb(0.99, 0.99, 0.99)],
      [snapshot.currentPayment, 547.8, rgb(0.99, 0.99, 0.99)],
      [snapshot.previousPaid + snapshot.currentPayment, 569, rgb(0.98, 0.94, 0.83)],
      [snapshot.remaining, 591.4, rgb(0.87, 0.92, 0.95)],
    ];
    for (const [value, rowTop, background] of paymentRows) {
      whiteout(page, 351, rowTop - 2, 25, 16, background);
      put(page, font, nominal(value), 358, rowTop, 10, 192);
    }
    put(page, font, snapshot.createdByName, 223.2, 688.1, 9.5, 130);
    await drawSignature(pdf, page, snapshot, 420, 675, 115, 60);
  }

  if (snapshot.type === "INVOICE" && (snapshot.items.length > 4 || snapshot.items.some((line) => String(line.description).length > 42))) {
    continuation(pdf, font, snapshot, snapshot.items);
  }
  if (voided) {
    for (const sheet of pdf.getPages()) {
      sheet.drawText("DIBATALKAN", { x: 95, y: 360, size: 66, font, color: rgb(0.7, 0.08, 0.08), opacity: 0.3, rotate: degrees(35) });
    }
  }
  pdf.setTitle(`${snapshot.type === "INVOICE" ? "Invoice" : "Kwitansi"} ${snapshot.number}`);
  pdf.setAuthor("PT Sahabat Qolbu Cahaya Baitullah");
  return Buffer.from(await pdf.save());
};
