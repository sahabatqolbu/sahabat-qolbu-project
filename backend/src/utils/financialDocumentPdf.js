import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb } from "pdf-lib";

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, "../assets/financial-documents");
const fontFile = path.join(assets, "NotoSans.ttf");
const A4 = [595.28, 841.89];
const sourceWidth = 1414;
const sourceHeight = 2000;
const navy = rgb(0.04, 0.13, 0.24);
const gold = rgb(0.98, 0.76, 0.28);
const x = (value) => (value / sourceWidth) * A4[0];
const y = (value) => A4[1] - (value / sourceHeight) * A4[1];
const pt = (value) => (value / sourceWidth) * A4[0];
const rupiah = (value) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
const nominal = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));
const dateText = (value) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "-";

const put = (page, font, value, px, py, size = 18, maxWidth = 300, color = navy) => {
  const text = String(value ?? "-").replace(/\s+/g, " ").trim() || "-";
  const width = pt(maxWidth);
  let display = text;
  while (display.length > 1 && font.widthOfTextAtSize(display, pt(size)) > width) {
    display = `${display.slice(0, -2)}…`;
  }
  page.drawText(display, { x: x(px), y: y(py), size: pt(size), font, color });
};

const drawSignature = async (pdf, page, snapshot, px, py) => {
  if (snapshot.signaturePng) {
    const signature = await pdf.embedPng(Buffer.from(snapshot.signaturePng, "base64"));
    const scale = Math.min(x(210) / signature.width, pt(65) / signature.height);
    page.drawImage(signature, { x: x(px), y: y(py + 65), width: signature.width * scale, height: signature.height * scale });
  }
  if (snapshot.stampPng) {
    const stamp = await pdf.embedPng(Buffer.from(snapshot.stampPng, "base64"));
    const scale = Math.min(x(105) / stamp.width, pt(92) / stamp.height);
    page.drawImage(stamp, { x: x(px + 155), y: y(py + 75), width: stamp.width * scale, height: stamp.height * scale });
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
    put(page, font, snapshot.number.replace(/^INV\/SQ\//, ""), 304, 608, 18, 165);
    put(page, font, dateText(snapshot.issuedAt), 225, 646, 18, 245);
    put(page, font, snapshot.paymentStatus, 225, 684, 18, 245);
    put(page, font, snapshot.customerName, 672, 608, 18, 213);
    put(page, font, snapshot.customerPhone, 672, 646, 18, 213);
    put(page, font, snapshot.memberCount, 672, 684, 18, 213);
    put(page, font, snapshot.programName, 1146, 608, 17, 220);
    put(page, font, dateText(snapshot.departureDate), 1146, 646, 17, 220);
    put(page, font, snapshot.roomType, 1146, 684, 17, 220);
    for (const [index, item] of snapshot.items.slice(0, 4).entries()) {
      const rowY = 921 + index * 54;
      put(page, font, item.description, 150, rowY, 17, 460);
      put(page, font, item.qty, 670, rowY, 17, 100);
      put(page, font, index === 0 ? nominal(item.unitPrice) : rupiah(item.unitPrice), index === 0 ? 875 : 790, rowY, 17, 230);
      put(page, font, index === 0 ? nominal(item.amount) : rupiah(item.amount), index === 0 ? 1165 : 1080, rowY, 17, 210);
    }
    put(page, font, nominal(snapshot.totalAmount), 415, 1232, 20, 255);
    put(page, font, nominal(snapshot.previousPaid), 415, 1274, 20, 255);
    put(page, font, nominal(snapshot.currentPayment || 0), 415, 1316, 20, 255);
    put(page, font, nominal(snapshot.remaining), 415, 1358, 20, 255);
    put(page, font, nominal(snapshot.previousPaid + (snapshot.currentPayment || 0)), 435, 1465, 24, 230, gold);
    put(page, font, snapshot.bank?.bankName, 925, 1320, 17, 420);
    put(page, font, snapshot.bank?.accountNumber, 925, 1355, 17, 420);
    put(page, font, snapshot.createdByName, 320, 1664, 17, 450);
    put(page, font, snapshot.verifierName || "Belum ada", 320, 1706, 17, 450);
    put(page, font, dateText(snapshot.verifiedAt), 320, 1748, 17, 450);
    await drawSignature(pdf, page, snapshot, 330, 1810);
  } else {
    put(page, font, snapshot.number.replace(/^KWT\/SQ\//, ""), 900, 479, 20, 420);
    put(page, font, dateText(snapshot.issuedAt), 765, 515, 20, 560);
    put(page, font, snapshot.paymentMethod, 765, 554, 20, 560);
    put(page, font, snapshot.paidBy || snapshot.customerName, 765, 690, 20, 560);
    put(page, font, snapshot.programName, 765, 727, 20, 560);
    put(page, font, snapshot.memberCount, 765, 765, 20, 560);
    put(page, font, dateText(snapshot.departureDate), 765, 803, 20, 560);
    put(page, font, nominal(snapshot.currentPayment), 430, 991, 52, 600);
    put(page, font, snapshot.amountWords, 485, 1065, 18, 610);
    const paymentRows = [
      [snapshot.totalAmount, 1215, rgb(0.99, 0.99, 0.99)],
      [snapshot.previousPaid, 1268, rgb(0.99, 0.99, 0.99)],
      [snapshot.currentPayment, 1320, rgb(0.99, 0.99, 0.99)],
      [snapshot.previousPaid + snapshot.currentPayment, 1372, rgb(0.98, 0.94, 0.83)],
      [snapshot.remaining, 1427, rgb(0.87, 0.92, 0.95)],
    ];
    for (const [value, rowY, background] of paymentRows) {
      page.drawRectangle({ x: x(790), y: y(rowY + 8), width: x(550), height: pt(31), color: background });
      put(page, font, rupiah(value), 810, rowY, 20, 470);
    }
    put(page, font, snapshot.createdByName, 505, 1680, 18, 300);
    put(page, font, snapshot.signerName || snapshot.createdByName, 970, 1705, 17, 330);
    await drawSignature(pdf, page, snapshot, 990, 1690);
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
