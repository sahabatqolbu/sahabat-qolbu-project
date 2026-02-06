// backend/src/controllers/reportController.js
import { db } from "../db/index.js";
import { transactions, packages, users, jamaahData } from "../db/schema.js";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// ✅ GET SALES REPORT (Summary by Package)
export const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let conditions = [eq(transactions.status, "PAID")];
        if (startDate) conditions.push(gte(transactions.createdAt, new Date(startDate)));
        if (endDate) conditions.push(lte(transactions.createdAt, new Date(endDate)));

        // Total revenue and volume by package
        const stats = await db
            .select({
                packageId: transactions.packageId,
                packageName: packages.name,
                totalRevenue: sql`SUM(${transactions.paidAmount})`,
                count: sql`COUNT(${transactions.id})`,
            })
            .from(transactions)
            .leftJoin(packages, eq(transactions.packageId, packages.id))
            .where(and(...conditions))
            .groupBy(transactions.packageId, packages.name);

        // High level overview
        const [summary] = await db
            .select({
                totalRevenue: sql`SUM(${transactions.paidAmount})`,
                totalTransactions: sql`COUNT(${transactions.id})`,
            })
            .from(transactions)
            .where(and(...conditions));

        return successResponse(res, {
            summary: summary || { totalRevenue: 0, totalTransactions: 0 },
            byPackage: stats
        });
    } catch (error) {
        next(error);
    }
};

// ✅ GET GROWTH STATS (Users & Bookings over time)
export const getGrowthStats = async (req, res, next) => {
    try {
        // Current year monthly growth
        const currentYear = new Date().getFullYear();

        const userGrowth = await db
            .select({
                month: sql`MONTH(${users.createdAt})`,
                count: sql`COUNT(${users.id})`,
            })
            .from(users)
            .where(sql`YEAR(${users.createdAt}) = ${currentYear}`)
            .groupBy(sql`MONTH(${users.createdAt})`);

        const bookingGrowth = await db
            .select({
                month: sql`MONTH(${jamaahData.createdAt})`,
                count: sql`COUNT(${jamaahData.id})`,
            })
            .from(jamaahData)
            .where(sql`YEAR(${jamaahData.createdAt}) = ${currentYear}`)
            .groupBy(sql`MONTH(${jamaahData.createdAt})`);

        return successResponse(res, {
            userGrowth,
            bookingGrowth
        });
    } catch (error) {
        next(error);
    }
};
