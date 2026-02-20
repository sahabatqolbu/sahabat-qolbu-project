import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { jamaahData, packages } from "../db/schema.js";
import { errorResponse, successResponse } from "../utils/response.js";
import { createNotification } from "./notificationController.js";
import { deriveJamaahPaymentState } from "../utils/paymentState.js";

export const assignJamaahToPackage = async (req, res, next) => {
  try {
    const { bookingNumber, packageId } = req.body;

    if (!bookingNumber || !packageId) {
      return errorResponse(res, "bookingNumber dan packageId wajib diisi", 400);
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return errorResponse(res, "Data jamaah tidak ditemukan", 404);
    }

    const selectedPackage = await db.query.packages.findFirst({
      where: and(eq(packages.id, parseInt(packageId)), eq(packages.isActive, true)),
    });

    if (!selectedPackage) {
      return errorResponse(res, "Paket tidak ditemukan atau tidak aktif", 404);
    }

    const price = parseFloat(selectedPackage.discountPrice || selectedPackage.price || 0);
    const totalPaid = parseFloat(jamaah.totalPayment || "0") || 0;
    const paymentState = deriveJamaahPaymentState({
      hargaFinal: price,
      totalPayment: totalPaid,
    });

    await db
      .update(jamaahData)
      .set({
        packageId: selectedPackage.id,
        hargaPaket: price.toString(),
        hargaFinal: price.toString(),
        outstanding: paymentState.outstanding.toString(),
        statusPayment: paymentState.statusPayment,
        updatedAt: new Date(),
      })
      .where(eq(jamaahData.bookingNumber, bookingNumber));

    await createNotification({
      userId: jamaah.userId,
      type: "REMINDER_GENERAL",
      title: "Paket Umrah Anda Diperbarui",
      message: `Anda telah didaftarkan ke paket ${selectedPackage.name}. Silakan cek detail paket Anda.`,
      link: `/jamaah/packages/${selectedPackage.id}`,
      referenceId: jamaah.id,
      referenceType: "JAMAAH",
    });

    return successResponse(res, null, "Jamaah berhasil didaftarkan ke paket");
  } catch (error) {
    next(error);
  }
};

export const sendJamaahNotification = async (req, res, next) => {
  try {
    const { bookingNumber, title, message } = req.body;

    if (!bookingNumber || !title || !message) {
      return errorResponse(
        res,
        "bookingNumber, title, dan message wajib diisi",
        400,
      );
    }

    const jamaah = await db.query.jamaahData.findFirst({
      where: eq(jamaahData.bookingNumber, bookingNumber),
    });

    if (!jamaah) {
      return errorResponse(res, "Data jamaah tidak ditemukan", 404);
    }

    await createNotification({
      userId: jamaah.userId,
      type: "REMINDER_GENERAL",
      title,
      message,
      link: "/jamaah",
      referenceId: jamaah.id,
      referenceType: "JAMAAH",
    });

    return successResponse(res, null, "Notifikasi berhasil dikirim ke jamaah");
  } catch (error) {
    next(error);
  }
};
