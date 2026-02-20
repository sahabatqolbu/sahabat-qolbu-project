// backend/src/controllers/transactionController.js
import { db } from "../db/index.js";
import { transactions, jamaahData, packages, paymentInstallments, users } from "../db/schema.js";
import { eq, and, like, desc, count } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { validateTransactionStatusChange } from "../utils/transactionWorkflow.js";

const SAFE_USER_COLUMNS = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    isActive: true,
    isEmailVerified: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
};

// ✅ GET ALL TRANSACTIONS (Admin)
export const getAllTransactions = async (req, res, next) => {
    try {
        const { search, status, packageId, page = "1", limit = "50" } = req.query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const parsedPackageId = packageId ? Number.parseInt(packageId, 10) : null;

        const conditions = [];
        if (status && status !== "all") {
            conditions.push(eq(transactions.status, status));
        }
        if (packageId) {
            if (!Number.isInteger(parsedPackageId) || parsedPackageId <= 0) {
                return errorResponse(res, "packageId tidak valid", 400, null, "VALIDATION_FAILED");
            }
            conditions.push(eq(transactions.packageId, parsedPackageId));
        }
        if (search && String(search).trim() !== "") {
            conditions.push(like(transactions.invoiceNumber, `%${String(search).trim()}%`));
        }

        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(transactions)
            .where(whereCondition);

        // Joint query with jamaah and package info
        const allTransactions = await db.query.transactions.findMany({
            where: whereCondition,
            with: {
                jamaah: {
                    with: {
                        user: {
                            columns: SAFE_USER_COLUMNS,
                        },
                    }
                },
                package: true
            },
            orderBy: [desc(transactions.createdAt)],
            limit: limitNumber,
            offset: (pageNumber - 1) * limitNumber,
        });

        return paginatedResponse(res, allTransactions, {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
        });
    } catch (error) {
        next(error);
    }
};

// ✅ GET TRANSACTION BY ID
export const getTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = Number.parseInt(id, 10);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return errorResponse(res, "ID transaksi tidak valid", 400, null, "VALIDATION_FAILED");
        }

        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, parsedId),
            with: {
                jamaah: {
                    with: {
                        user: {
                            columns: SAFE_USER_COLUMNS,
                        },
                    }
                },
                package: true,
                installments: true
            }
        });

        if (!transaction) {
            return notFoundResponse(res, "Transaksi tidak ditemukan");
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
        const parsedId = Number.parseInt(id, 10);

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return errorResponse(res, "ID transaksi tidak valid", 400, null, "VALIDATION_FAILED");
        }

        const transaction = await db.query.transactions.findFirst({
            where: eq(transactions.id, parsedId),
        });

        if (!transaction) {
            return notFoundResponse(res, "Transaksi tidak ditemukan");
        }

        const currentStatus = transaction.status;

        const workflowValidation = validateTransactionStatusChange({
            currentStatus,
            nextStatus: status,
            remarks,
        });

        if (workflowValidation.ok && workflowValidation.unchanged) {
            return successResponse(res, null, "Status transaksi tidak berubah");
        }

        if (!workflowValidation.ok) {
            return errorResponse(res, workflowValidation.message, 400, null, workflowValidation.code || "VALIDATION_FAILED");
        }

        const nextNotes =
            workflowValidation.normalizedRemarks && workflowValidation.normalizedRemarks !== ""
                ? workflowValidation.normalizedRemarks
                : transaction.notes;

        await db.update(transactions)
            .set({
                status,
                notes: nextNotes,
                verifiedBy: adminId,
                verifiedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(transactions.id, parsedId));

        logger.security("Transaction status transitioned", {
            transactionId: parsedId,
            invoiceNumber: transaction.invoiceNumber,
            previousStatus: currentStatus,
            nextStatus: status,
            previousNotes: transaction.notes || null,
            nextNotes: nextNotes || null,
            reasonProvided: Boolean(nextNotes),
            changedBy: adminId,
            changedAt: new Date().toISOString(),
        });

        return successResponse(res, null, "Transaksi berhasil diperbarui");
    } catch (error) {
        next(error);
    }
};
