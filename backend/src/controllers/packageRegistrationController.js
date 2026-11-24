import { randomBytes } from "node:crypto";
import { and, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { packageOptions, packages, users } from "../db/schema.js";
import { errorResponse } from "../utils/response.js";
import { hashPassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";
import { issueAuthSession } from "./authController.js";
import { createJamaahDataWithRetry } from "./adminController.js";
import { issueDataLink, toWhatsAppNumber } from "./jamaahDataLinkController.js";
import { getBookedSeats, getDaysUntilDeparture, getPackageBookingState } from "./packageController.js";
import { notifyAdmins } from "./notificationController.js";

const ROOM_PRICE_FIELD = { QUAD: "priceQuad", TRIPLE: "priceTriple", DOUBLE: "priceDouble" };

export const packageRegistrationSchema = z.object({
  fullName: z.string().trim().min(3, "Nama minimal 3 huruf").max(150),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{9,20}$/, "Nomor WhatsApp tidak valid"),
  packageId: z.coerce.number().int().positive(),
  packageOptionId: z.coerce.number().int().positive().optional(),
  roomType: z.enum(["QUAD", "TRIPLE", "DOUBLE"]),
  people: z.coerce.number().int().min(1).max(10),
  memberNames: z.array(z.string().trim().max(150)).max(9).optional().default([]),
  honeypot: z.string().max(0).optional().default(""),
  formStartedAt: z.coerce.number().optional(),
});

// Accounts created without an email get a reserved address that mail is never sent to.
export const placeholderEmail = (waNumber) => `daftar-${waNumber}-${randomBytes(3).toString("hex")}@sahabatqolbu.invalid`;

const findAccountByPhone = async (waNumber) => {
  const lastDigits = waNumber.slice(-9);
  const candidates = await db.query.users.findMany({
    where: and(like(users.phone, `%${lastDigits}`), inArray(users.role, ["JAMAAH", "CALON_JAMAAH"])),
    columns: { id: true, phone: true },
  });
  return candidates.find((candidate) => toWhatsAppNumber(candidate.phone) === waNumber) || null;
};

export const registerForPackage = async (req, res, next) => {
  try {
    const parsed = packageRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, parsed.error.issues[0]?.message || "Periksa kembali isian Anda", 400);
    }
    const input = parsed.data;
    // Bots fill the hidden field or submit instantly.
    if (input.honeypot || (input.formStartedAt && Date.now() - input.formStartedAt < 3000)) {
      return errorResponse(res, "Pendaftaran tidak dapat diproses", 400);
    }

    const waNumber = toWhatsAppNumber(input.phone);
    if (!waNumber || waNumber.length < 10) return errorResponse(res, "Nomor WhatsApp tidak valid", 400);

    const pkg = await db.query.packages.findFirst({ where: eq(packages.id, input.packageId) });
    if (!pkg || !pkg.isActive || !pkg.isPublished) return errorResponse(res, "Paket tidak ditemukan", 404);
    const bookedSeats = await getBookedSeats(pkg.id);
    const state = getPackageBookingState({
      pkg,
      remainingSeats: Number(pkg.totalSeats || 0) - Number(bookedSeats || 0),
      daysUntilDeparture: getDaysUntilDeparture(pkg.departureDate),
    });
    if (!state.isBookable) return errorResponse(res, `Paket ini sedang ${state.bookingStatusLabel || "tidak menerima pendaftaran"}`, 409);

    const options = await db.query.packageOptions.findMany({
      where: and(eq(packageOptions.packageId, pkg.id), eq(packageOptions.isActive, true)),
    });
    const option = input.packageOptionId
      ? options.find((item) => item.id === input.packageOptionId)
      : options.find((item) => item.isDefault) || options[0];
    if (input.packageOptionId && !option) return errorResponse(res, "Pilihan paket tidak ditemukan", 400);
    const unitPrice = Number((option || pkg)[ROOM_PRICE_FIELD[input.roomType]] || 0);
    if (unitPrice <= 0) return errorResponse(res, "Tipe kamar ini belum tersedia untuk paket tersebut", 400);

    // Never hand out a session for an account found only by phone number.
    const existing = await findAccountByPhone(waNumber);
    if (existing) {
      await notifyAdmins({
        type: "JAMAAH_REGISTERED",
        title: "Pendaftaran ulang dari nomor terdaftar",
        message: `${input.fullName} (${input.phone}) mendaftar ${pkg.name} dengan nomor yang sudah punya akun. Hubungi lewat WhatsApp.`,
        referenceId: existing.id,
        referenceType: "USER",
      });
      return errorResponse(res, "Nomor WhatsApp ini sudah terdaftar. Tim Sahabat Qolbu akan menghubungi Anda lewat WhatsApp untuk melanjutkan.", 409, null, "PHONE_REGISTERED");
    }

    const extraNames = Array.from({ length: input.people - 1 }, (_, index) => {
      const name = input.memberNames[index]?.trim();
      return name && name.length >= 2 ? name : `Anggota ${index + 2} (${input.fullName})`;
    });
    const members = [
      { name: input.fullName, relationship: "DIRI_SENDIRI", isPrimary: true },
      ...extraNames.map((name) => ({ name, relationship: "KELUARGA", isPrimary: false })),
    ];

    const user = await db.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({
        email: placeholderEmail(waNumber),
        password: await hashPassword(randomBytes(24).toString("base64url")),
        fullName: input.fullName,
        phone: input.phone,
        role: "JAMAAH",
        isActive: true,
        isEmailVerified: false,
      }).$returningId();
      for (const member of members) {
        await createJamaahDataWithRetry((bookingNumber) => ({
          userId: created.id,
          bookingNumber,
          memberName: member.name,
          familyRelationship: member.relationship,
          isPrimaryMember: member.isPrimary,
          dateOfBooking: new Date(),
          packageId: pkg.id,
          packageOptionId: option?.id ?? null,
          roomTypeMakkah: input.roomType,
          roomTypeMadinah: input.roomType,
          hargaFinal: String(unitPrice),
          outstanding: String(unitPrice),
          registrationStatus: "DRAFT",
          isProfileComplete: false,
        }), 5, tx);
      }
      return { id: created.id, fullName: input.fullName, phone: input.phone, role: "JAMAAH" };
    });

    await notifyAdmins({
      type: "JAMAAH_REGISTERED",
      title: "Pendaftaran paket baru",
      message: `${input.fullName} mendaftar ${pkg.name} (${input.people} orang, ${input.roomType}). Konfirmasi lewat WhatsApp ${input.phone}.`,
      referenceId: user.id,
      referenceType: "USER",
    });
    logger.security("Direct package registration", { userId: user.id, packageId: pkg.id, people: input.people });

    const link = await issueDataLink(user.id, null);
    return issueAuthSession(req, res, user, "Pendaftaran diterima", 201, {
      continueUrl: link.url,
      continueUntil: link.expiresAt,
      whatsappNumber: waNumber,
      packageName: pkg.name,
    });
  } catch (error) {
    next(error);
  }
};
