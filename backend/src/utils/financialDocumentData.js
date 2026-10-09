import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  agentData,
  agentLevels,
  agentPaymentTransactions,
  jamaahData,
  jamaahPayments,
  masterBanks,
  packages,
  transactions,
  users,
} from "../db/schema.js";

const amount = (value) => Math.round(Number(value || 0) * 100) / 100;
const item = (description, unitPrice, qty = 1) => ({
  description,
  qty,
  unitPrice: amount(unitPrice),
  amount: amount(unitPrice * qty),
});
const groupedItems = (members, packageName) => {
  const groups = new Map();
  for (const member of members) {
    const unitPrice = amount(member.hargaFinal);
    const key = String(unitPrice);
    const current = groups.get(key) || { description: packageName, qty: 0, unitPrice };
    current.qty += 1;
    current.amount = amount(current.unitPrice * current.qty);
    groups.set(key, current);
  }
  return [...groups.values()];
};
const fail = (message, status = 422) => Object.assign(new Error(message), { status });

const customerForBooking = async (bookingNumber) => {
  const booking = await db.query.jamaahData.findFirst({ where: eq(jamaahData.bookingNumber, bookingNumber) });
  if (!booking) throw fail("Booking jamaah tidak ditemukan", 404);
  if (!booking.packageId || amount(booking.hargaFinal) <= 0) throw fail("Paket dan harga final jamaah belum lengkap");
  const members = await db.query.jamaahData.findMany({
    where: and(eq(jamaahData.userId, booking.userId), eq(jamaahData.packageId, booking.packageId)),
  });
  if (members.some((member) => amount(member.hargaFinal) <= 0)) throw fail("Harga final setiap anggota keluarga harus lengkap");
  const pkg = await db.query.packages.findFirst({ where: eq(packages.id, booking.packageId) });
  const user = await db.query.users.findFirst({ where: eq(users.id, booking.userId) });
  const memberIds = members.map((member) => member.id);
  const payments = memberIds.length ? await db.query.jamaahPayments.findMany({
    where: and(inArray(jamaahPayments.jamaahId, memberIds), eq(jamaahPayments.proofStatus, "VERIFIED"), isNotNull(jamaahPayments.verifiedAt)),
  }) : [];
  return { booking, members, pkg, user, payments };
};

const bookingBase = (data) => {
  const { booking, members, pkg, user } = data;
  const packageName = pkg?.name || "Paket Umrah";
  const items = groupedItems(members, packageName);
  return {
    customerName: booking.memberName || user?.fullName || "Jamaah",
    customerPhone: user?.phone || "-",
    memberCount: members.length,
    programName: pkg?.name || "Paket Umrah",
    departureDate: pkg?.departureDate || null,
    roomType: booking.roomTypeMakkah || booking.roomTypeMadinah || "-",
    items,
    totalAmount: amount(items.reduce((sum, line) => sum + line.amount, 0)),
  };
};

const verifiedPrior = (payments, cutoff, excludeIds = []) => amount(payments
  .filter((payment) => !excludeIds.includes(payment.id) && new Date(payment.verifiedAt).getTime() < new Date(cutoff).getTime())
  .reduce((sum, payment) => sum + amount(payment.amount), 0));

export const resolveFinancialSource = async ({ type, sourceType, sourceId, input }) => {
  if (sourceType === "MANUAL") {
    const items = input.items.map((line) => item(line.description.trim(), line.unitPrice, line.qty));
    const totalAmount = amount(items.reduce((sum, line) => sum + line.amount, 0));
    const previousPaid = amount(input.previousPaid);
    const currentPayment = amount(input.currentPayment);
    if ((type === "RECEIPT" || currentPayment > 0) && input.confirmedReceived !== true) throw fail("Konfirmasi penerimaan pembayaran wajib dicentang");
    if (previousPaid + currentPayment > totalAmount) throw fail("Pembayaran melebihi total tagihan");
    return {
      sourceType, sourceId: null,
      customerName: input.customerName.trim(), customerPhone: input.customerPhone?.trim() || "-",
      memberCount: input.memberCount || 1, programName: input.programName?.trim() || "Tagihan pelanggan",
      departureDate: input.departureDate || null, roomType: input.roomType?.trim() || "-",
      items, totalAmount, previousPaid, currentPayment,
      paidBy: input.paidBy?.trim() || input.customerName.trim(),
      paymentMethod: input.paymentMethod || "Transfer bank",
      verifiedAt: currentPayment > 0 ? new Date().toISOString() : null,
      verifierName: currentPayment > 0 ? input.actorName : null,
      paymentStatus: previousPaid + currentPayment >= totalAmount ? "Lunas" : previousPaid + currentPayment > 0 ? "Sebagian" : "Belum dibayar",
    };
  }

  if (sourceType === "BOOKING" && type === "INVOICE") {
    const data = await customerForBooking(sourceId);
    const base = bookingBase(data);
    const latestPayment = [...data.payments].sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt) || b.id - a.id)[0];
    const latestGroup = latestPayment ? data.payments.filter((payment) => latestPayment.familyPaymentGroupId
      ? payment.familyPaymentGroupId === latestPayment.familyPaymentGroupId
      : payment.id === latestPayment.id) : [];
    const latestIds = new Set(latestGroup.map((payment) => payment.id));
    const previousPaid = amount(data.payments.filter((payment) => !latestIds.has(payment.id)).reduce((sum, payment) => sum + amount(payment.amount), 0));
    const currentPayment = amount(latestGroup.reduce((sum, payment) => sum + amount(payment.amount), 0));
    const received = amount(previousPaid + currentPayment);
    if (received > base.totalAmount) throw fail("Pembayaran melebihi total tagihan; periksa data paket");
    return {
      ...base, sourceType: data.members.length > 1 ? "FAMILY_BOOKING" : sourceType,
      sourceId: data.members.length > 1 ? `${data.booking.userId}:${data.booking.packageId}` : sourceId,
      previousPaid, currentPayment,
      verifiedAt: latestPayment?.verifiedAt || null,
      paymentStatus: received >= base.totalAmount ? "Lunas" : received > 0 ? "Sebagian" : "Belum dibayar",
    };
  }

  if (sourceType === "PAYMENT" && type === "RECEIPT") {
    const paymentId = Number(sourceId);
    const payment = await db.query.jamaahPayments.findFirst({ where: eq(jamaahPayments.id, paymentId) });
    if (!payment) throw fail("Pembayaran jamaah tidak ditemukan", 404);
    const group = payment.familyPaymentGroupId
      ? await db.query.jamaahPayments.findMany({ where: eq(jamaahPayments.familyPaymentGroupId, payment.familyPaymentGroupId) })
      : [payment];
    if (group.some((row) => row.proofStatus !== "VERIFIED" || !row.verifiedAt)) throw fail("Semua pembayaran dalam grup harus terverifikasi");
    const jamaah = await db.query.jamaahData.findFirst({ where: eq(jamaahData.id, payment.jamaahId) });
    if (!jamaah) throw fail("Jamaah pembayaran tidak ditemukan", 404);
    const data = await customerForBooking(jamaah.bookingNumber);
    if (group.some((row) => !data.members.some((member) => member.id === row.jamaahId))) throw fail("Grup pembayaran tidak sesuai dengan keluarga dan paket");
    const base = bookingBase(data);
    const groupIds = group.map((row) => row.id);
    const cutoff = group.reduce((earliest, row) => new Date(row.verifiedAt) < new Date(earliest) ? row.verifiedAt : earliest, group[0].verifiedAt);
    const previousPaid = verifiedPrior(data.payments, cutoff, groupIds);
    const currentPayment = amount(group.reduce((sum, row) => sum + amount(row.amount), 0));
    if (previousPaid + currentPayment > base.totalAmount) throw fail("Pembayaran melebihi total tagihan; periksa data paket");
    const verifier = await db.query.users.findFirst({ where: eq(users.id, payment.verifiedBy) });
    return {
      ...base, sourceType: payment.familyPaymentGroupId ? "FAMILY_PAYMENT" : sourceType,
      sourceId: payment.familyPaymentGroupId || sourceId,
      previousPaid, currentPayment, paidBy: payment.paidBy || base.customerName,
      paymentMethod: payment.bankId ? "Transfer bank" : "Pembayaran diterima",
      bankId: payment.bankId, verifiedAt: payment.verifiedAt,
      verifierName: verifier?.fullName || "Admin/Finance",
      paymentStatus: previousPaid + currentPayment >= base.totalAmount ? "Lunas" : "Sebagian",
    };
  }

  if (sourceType === "TRANSACTION") {
    const transaction = await db.query.transactions.findFirst({ where: eq(transactions.id, Number(sourceId)) });
    if (!transaction) throw fail("Transaksi tidak ditemukan", 404);
    if (type === "RECEIPT" && (!transaction.verifiedAt || !["VERIFIED", "PAID"].includes(transaction.status))) {
      throw fail("Transaksi belum terverifikasi sebagai pembayaran diterima");
    }
    const jamaah = await db.query.jamaahData.findFirst({ where: eq(jamaahData.id, transaction.jamaahId) });
    const pkg = await db.query.packages.findFirst({ where: eq(packages.id, transaction.packageId) });
    const user = jamaah ? await db.query.users.findFirst({ where: eq(users.id, jamaah.userId) }) : null;
    const verifier = transaction.verifiedBy ? await db.query.users.findFirst({ where: eq(users.id, transaction.verifiedBy) }) : null;
    const totalAmount = amount(transaction.totalAmount);
    const currentPayment = type === "RECEIPT" ? amount(transaction.paidAmount) : 0;
    if (type === "RECEIPT" && currentPayment <= 0) throw fail("Transaksi belum memiliki nominal pembayaran");
    return {
      sourceType, sourceId, customerName: jamaah?.memberName || user?.fullName || "Jamaah",
      customerPhone: user?.phone || "-", memberCount: 1,
      programName: pkg?.name || "Paket Umrah", departureDate: pkg?.departureDate || null,
      roomType: jamaah?.roomTypeMakkah || "-", items: [item(pkg?.name || "Paket Umrah", totalAmount)],
      totalAmount, previousPaid: type === "INVOICE" ? amount(transaction.paidAmount) : 0,
      currentPayment, paidBy: jamaah?.memberName || user?.fullName || "Jamaah",
      paymentMethod: transaction.paymentMethod || "Transfer bank", verifiedAt: transaction.verifiedAt,
      verifierName: verifier?.fullName || null,
      paymentStatus: transaction.status,
    };
  }

  if (sourceType === "AGENT") {
    if (type !== "INVOICE") throw fail("Tagihan agen hanya bisa dibuat sebagai invoice");
    if (![1, 2].includes(Number(input.targetStar))) throw fail("Pilih level agen yang akan ditagih", 400);
    const agent = await db.query.agentData.findFirst({ where: eq(agentData.userId, Number(sourceId)) });
    if (!agent) throw fail("Agen tidak ditemukan", 404);
    const level = await db.query.agentLevels.findFirst({ where: eq(agentLevels.star, Number(input.targetStar)) });
    if (!level || amount(level.price) <= 0) throw fail("Level dan biaya agen belum tersedia");
    const user = await db.query.users.findFirst({ where: eq(users.id, agent.userId) });
    return {
      sourceType, sourceId: `${agent.userId}:${level.star}`, customerName: agent.fullNameKtp || user?.fullName || "Agen",
      customerPhone: user?.phone || "-", memberCount: 1, programName: `Biaya Agen ${level.name}`,
      departureDate: null, roomType: "-", items: [item(`Biaya Agen ${level.name}`, level.price)],
      totalAmount: amount(level.price), previousPaid: 0, currentPayment: 0, paymentStatus: "Belum dibayar",
    };
  }

  if (sourceType === "AGENT_PAYMENT" && type === "RECEIPT") {
    if (input.confirmedReceived !== true) throw fail("Konfirmasi penerimaan biaya agen wajib dicentang");
    const payment = await db.query.agentPaymentTransactions.findFirst({ where: eq(agentPaymentTransactions.id, Number(sourceId)) });
    if (!payment) throw fail("Pembayaran biaya agen tidak ditemukan", 404);
    const agent = await db.query.agentData.findFirst({ where: eq(agentData.id, payment.agentDataId) });
    const user = agent ? await db.query.users.findFirst({ where: eq(users.id, agent.userId) }) : null;
    const level = await db.query.agentLevels.findFirst({ where: eq(agentLevels.star, payment.targetStar) });
    const totalAmount = amount(level?.price || payment.amount);
    const currentPayment = amount(payment.amount);
    if (currentPayment > totalAmount) throw fail("Pembayaran melebihi biaya agen");
    return {
      sourceType, sourceId, customerName: agent?.fullNameKtp || user?.fullName || "Agen",
      customerPhone: user?.phone || "-", memberCount: 1, programName: `Biaya Agen ${level?.name || payment.targetStar}`,
      departureDate: null, roomType: "-", items: [item(`Biaya Agen ${level?.name || payment.targetStar}`, totalAmount)],
      totalAmount, previousPaid: 0, currentPayment, paidBy: agent?.fullNameKtp || user?.fullName || "Agen",
      paymentMethod: "Transfer bank", verifiedAt: new Date().toISOString(),
      verifierName: input.actorName, paymentStatus: currentPayment >= totalAmount ? "Lunas" : "Sebagian",
    };
  }

  throw fail("Jenis sumber tidak sesuai dengan dokumen", 400);
};

export const getFinancialBank = async (bankId) => {
  if (!bankId) return null;
  const bank = await db.query.masterBanks.findFirst({ where: eq(masterBanks.id, Number(bankId)) });
  if (!bank) throw fail("Rekening bank tidak ditemukan", 404);
  if (!bank.isActive) throw fail("Rekening bank sudah tidak aktif");
  return { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName };
};

export const listFinancialBanks = async () => db.query.masterBanks.findMany({ where: eq(masterBanks.isActive, true) });
