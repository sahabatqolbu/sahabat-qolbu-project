// backend/src/utils/bookingNumber.js
// Shared booking number generation utilities

import { db } from "../db/index.js";
import { jamaahData } from "../db/schema.js";
import { like } from "drizzle-orm";
import { logger } from "./logger.js";

/**
 * Generate a unique booking number with format: SQ-YYYYMMDD-XXXX
 */
export const generateBookingNumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;
    const prefix = `SQ-${datePrefix}`;

    const lastBooking = await db.query.jamaahData.findFirst({
        where: like(jamaahData.bookingNumber, `${prefix}%`),
        orderBy: (jamaahData, { desc }) => [desc(jamaahData.bookingNumber)],
    });

    let sequence = 1;
    if (lastBooking && lastBooking.bookingNumber) {
        const lastSequence = lastBooking.bookingNumber.split("-")[2];
        sequence = parseInt(lastSequence, 10) + 1;
    }

    const bookingNumber = `${prefix}-${String(sequence).padStart(4, "0")}`;
    logger.debug("Generated booking number", { bookingNumber });
    return bookingNumber;
};

/**
 * Check if an error is a booking number duplicate constraint violation
 */
export const isBookingNumberDuplicateError = (error) => {
    const message = error?.sqlMessage || error?.message || "";
    return error?.code === "ER_DUP_ENTRY" && message.includes("booking_number");
};

/**
 * Insert jamaah data with automatic booking number retry on duplicate
 * @param {Function} buildValues - Function that receives bookingNumber and returns insert values
 * @param {number} maxRetries - Maximum retry attempts (default: 5)
 * @returns {string} The generated booking number
 */
export const createJamaahDataWithRetry = async (buildValues, maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const bookingNumber = await generateBookingNumber();

        try {
            await db.insert(jamaahData).values(buildValues(bookingNumber));
            return bookingNumber;
        } catch (error) {
            if (isBookingNumberDuplicateError(error) && attempt < maxRetries) {
                continue;
            }
            throw error;
        }
    }

    throw new Error("Gagal membuat booking number unik");
};

/**
 * Insert jamaah data with retry, returning both booking number and new record ID
 * @param {Function} buildValues - Function that receives bookingNumber and returns insert values
 * @param {number} maxRetries - Maximum retry attempts (default: 5)
 * @returns {{ bookingNumber: string, newJamaah: { id: number } }}
 */
export const createJamaahRecordWithRetry = async (buildValues, maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const bookingNumber = await generateBookingNumber();

        try {
            const [newJamaah] = await db
                .insert(jamaahData)
                .values(buildValues(bookingNumber))
                .$returningId();

            return { bookingNumber, newJamaah };
        } catch (error) {
            if (isBookingNumberDuplicateError(error) && attempt < maxRetries) {
                continue;
            }
            throw error;
        }
    }

    throw new Error("Gagal membuat booking number unik");
};
