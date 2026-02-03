import { db } from "../db/index.js";
import { masterBanks } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  createdResponse,
} from "../utils/response.js";

// =====================================================
// GET ALL BANKS
// =====================================================
export const getAllBanks = async (req, res, next) => {
  try {
    const banks = await db
      .select()
      .from(masterBanks)
      .orderBy(desc(masterBanks.createdAt));

    return successResponse(res, banks);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ACTIVE BANKS (for payment page)
// =====================================================
export const getActiveBanks = async (req, res, next) => {
  try {
    const banks = await db
      .select()
      .from(masterBanks)
      .where(eq(masterBanks.isActive, true))
      .orderBy(desc(masterBanks.createdAt));

    return successResponse(res, banks);
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE BANK
// =====================================================
export const createBank = async (req, res, next) => {
  try {
    const { bankName, accountNumber, accountName, branch } = req.body;

    const [newBank] = await db
      .insert(masterBanks)
      .values({
        bankName,
        accountNumber,
        accountName,
        branch: branch || null,
        isActive: true,
      })
      .returning();

    return createdResponse(res, newBank, "Rekening berhasil ditambahkan");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE BANK
// =====================================================
export const updateBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bankName, accountNumber, accountName, branch, isActive } = req.body;

    const updateData = { updatedAt: new Date() };
    if (bankName) updateData.bankName = bankName;
    if (accountNumber) updateData.accountNumber = accountNumber;
    if (accountName) updateData.accountName = accountName;
    if (branch !== undefined) updateData.branch = branch;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const [updatedBank] = await db
      .update(masterBanks)
      .set(updateData)
      .where(eq(masterBanks.id, parseInt(id)))
      .returning();

    if (!updatedBank) {
      return errorResponse(res, "Rekening tidak ditemukan", 404);
    }

    return successResponse(res, updatedBank, "Rekening berhasil diupdate");
  } catch (error) {
    next(error);
  }
};

// =====================================================
// TOGGLE BANK STATUS
// =====================================================
export const toggleBankStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bank = await db.query.masterBanks.findFirst({
      where: eq(masterBanks.id, parseInt(id)),
    });

    if (!bank) {
      return errorResponse(res, "Rekening tidak ditemukan", 404);
    }

    const [updated] = await db
      .update(masterBanks)
      .set({
        isActive: !bank.isActive,
        updatedAt: new Date(),
      })
      .where(eq(masterBanks.id, parseInt(id)))
      .returning();

    return successResponse(
      res,
      updated,
      `Rekening berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}`
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE BANK
// =====================================================
export const deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.delete(masterBanks).where(eq(masterBanks.id, parseInt(id)));

    return successResponse(res, null, "Rekening berhasil dihapus");
  } catch (error) {
    next(error);
  }
};
