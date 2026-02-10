// backend/src/controllers/transactionController.js
import { db } from "../db/index.js";
import { transactions, jamaahData, packages, paymentInstallments, users } from "../db/schema.js";
import { eq, and, like, desc, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

const VALID_STATUS_TRANSITIONS = {
    PENDING: ["PARTIAL", "PAID", "VERIFIED", "CANCELLED"],
    PARTIAL: ["PAID", "VERIFIED", "CANCELLED"],
    PAID: ["VERIFIED", "CANCELLED", "REFUNDED"],
    VERIFIED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: [],
};

// ✅ GET ALL TRANSACTIONS (Admin)
export const getAllTransactions = async (req, res, next) => {
    try {
        const { search, status, packageId } = req.query;

        const conditions = [];
        if (status && status !== "all") {
            conditions.push(eq(transactions.status, status));
        }
        if (packageId) {
            conditions.push(eq(transactions.packageId, parseInt(packageId)));
        }

        // Joint query with jamaah and package info
        const allTransactions = await db.query.transactions.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                jamaah: {
                    with: {
                        user: true
                    }
                },
                package: true
            },
            orderBy: [desc(transactions.createdAt)],
        });

        // Manual search filtering if needed (Drizzle-orm like on relations is a bit tricky sometimes)
        let filtered = allTransactions;
        if (search) {
            const s = search.toLowerCase();
            filtered = allTransactions.filter(t =>
                (t.invoiceNumber || "").toLowerCase().includes(s) ||
                (t.jamaah?.user?.fullName || "").toLowerCase().includes(s)
            );
        }

        return successResponse(res, filtered);
    } catch (error) {
        next(error);
    }
};

// ✅ GET TRANSACTION BY ID
export const getTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, parseInt(id)),
            with: {
                jamaah: {
                    with: {
                        user: true
                    }
                },
                package: true,
                installments: true
            }
        });

        if (!transaction) {
            return errorResponse(res, "Transaksi tidak ditemukan", 404);
        }

        return successResponse(res, transaction);
    } catch (error) {
        next(error);
    }
};

// ✅ VERIFY TRANSACTION
export const verifyTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.validatedBody || req.body; // status: PAID, VERIFIED, CANCELLED
        const adminId = req.user.userId;

        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, parseInt(id)),
        });

        if (!transaction) {
            return errorResponse(res, "Transaksi tidak ditemukan", 404);
        }

        const currentStatus = transaction.status;
        const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

        if (currentStatus === status) {
            return successResponse(res, null, "Status transaksi tidak berubah");
        }

        if (!allowedTransitions.includes(status)) {
            return errorResponse(
                res,
                `Perubahan status dari ${currentStatus} ke ${status} tidak diizinkan`,
                400
            );
        }

        await db.update(transactions)
            .set({
                status,
                notes: remarks || transaction.notes,
                verifiedBy: adminId,
                verifiedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(transactions.id, parseInt(id)));

        return successResponse(res, null, "Transaksi berhasil diperbarui");
    } catch (error) {
        next(error);
    }
};
