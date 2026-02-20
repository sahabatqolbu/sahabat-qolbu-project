// backend/src/controllers/dashboardController.js
import { db } from "../db/index.js";
import { users, packages, jamaahData, agentData } from "../db/schema.js";
import { and, desc, eq, inArray, or, sql, count } from "drizzle-orm";
import { successResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";

const getBookedSeatsByPackageIds = async (packageIds = []) => {
  if (!packageIds.length) {
    return new Map();
  }

  const rows = await db
    .select({
      packageId: jamaahData.packageId,
      count: count(),
    })
    .from(jamaahData)
    .where(
      and(
        inArray(jamaahData.packageId, packageIds),
        or(
          eq(jamaahData.registrationStatus, "CONFIRMED"),
          eq(jamaahData.registrationStatus, "PENDING_PAYMENT"),
        ),
      ),
    )
    .groupBy(jamaahData.packageId);

  const bookedSeatsByPackageId = new Map();
  for (const row of rows) {
    if (row.packageId != null) {
      bookedSeatsByPackageId.set(Number(row.packageId), Number(row.count || 0));
    }
  }

  return bookedSeatsByPackageId;
};

// =====================================================
// GET ADMIN DASHBOARD STATS - SIMPLIFIED VERSION
// =====================================================
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    logger.debug("Fetching dashboard stats");

    // 1. Get all users (simple query)
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    logger.debug("Users fetched", { count: allUsers.length });

    // 2. Get all packages (simple query)
    const allPackages = await db.query.packages.findMany({
      columns: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        duration: true,
        totalSeats: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [desc(packages.createdAt)],
    });

    logger.debug("Packages fetched", { count: allPackages.length });

    // 3. Get agent data for pending count
    let pendingAgentsCount = 0;
    let approvedAgentsCount = 0;
    let pendingAgentsList = [];

    try {
      const allAgentData = await db.query.agentData.findMany();
      pendingAgentsCount = allAgentData.filter(
        (a) => a.status === "PENDING"
      ).length;
      approvedAgentsCount = allAgentData.filter(
        (a) => a.status === "APPROVED"
      ).length;

      // Get pending agents with user info
      const agenUsers = allUsers.filter((u) => u.role === "AGEN");
      const pendingAgentIds = allAgentData
        .filter((a) => a.status === "PENDING")
        .map((a) => a.userId);

      pendingAgentsList = agenUsers
        .filter((u) => pendingAgentIds.includes(u.id))
        .slice(0, 5)
        .map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
        }));
    } catch (err) {
      logger.warn("Agent data query skipped", { message: err?.message });
    }

    // 4. Calculate user stats
    const userStats = {
      total: allUsers.length,
      jamaah: allUsers.filter((u) => u.role === "JAMAAH").length,
      agen: allUsers.filter((u) => u.role === "AGEN").length,
      admin: allUsers.filter((u) => u.role === "ADMIN").length,
      finance: allUsers.filter((u) => u.role === "FINANCE").length,
    };

    const allPackageIds = allPackages.map((pkg) => pkg.id);
    const bookedSeatsByPackageId = await getBookedSeatsByPackageIds(allPackageIds);

    // 5. Calculate package stats
    const activePackages = allPackages.filter((p) => p.isActive);
    const totalSeats = activePackages.reduce(
      (sum, p) => sum + (p.totalSeats || 0),
      0
    );
    const bookedSeats = activePackages.reduce(
      (sum, p) => sum + (bookedSeatsByPackageId.get(p.id) || 0),
      0
    );

    const packageStats = {
      total: allPackages.length,
      active: activePackages.length,
      totalSeats,
      bookedSeats,
      availableSeats: totalSeats - bookedSeats,
    };

    // 6. Recent data
    const recentUsers = allUsers.slice(0, 5);
    const recentPackages = allPackages.slice(0, 5).map((pkg) => {
      const pkgBookedSeats = bookedSeatsByPackageId.get(pkg.id) || 0;
      return {
        ...pkg,
        bookedSeats: pkgBookedSeats,
        remainingSeats: (pkg.totalSeats || 0) - pkgBookedSeats,
      };
    });

    const stats = {
      users: userStats,
      packages: packageStats,
      agents: {
        pending: pendingAgentsCount,
        approved: approvedAgentsCount,
      },
      recent: {
        users: recentUsers,
        packages: recentPackages,
        pendingAgents: pendingAgentsList,
      },
    };

    logger.info("Dashboard stats ready", {
      users: stats.users.total,
      packages: stats.packages.total,
      pendingAgents: stats.agents.pending,
    });

    return successResponse(res, stats, "Dashboard stats fetched successfully");
  } catch (error) {
    logger.error("Dashboard stats error", error);
    next(error);
  }
};
