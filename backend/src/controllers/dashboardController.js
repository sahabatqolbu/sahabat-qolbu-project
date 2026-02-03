// backend/src/controllers/dashboardController.js
import { db } from "../db/index.js";
import { users, packages, jamaahData, agentData } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { successResponse } from "../utils/response.js";

// =====================================================
// GET ADMIN DASHBOARD STATS - SIMPLIFIED VERSION
// =====================================================
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    console.log("📊 Fetching dashboard stats...");

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

    console.log(`✅ Found ${allUsers.length} users`);

    // 2. Get all packages (simple query)
    const allPackages = await db.query.packages.findMany({
      columns: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        duration: true,
        totalSeats: true,
        bookedSeats: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [desc(packages.createdAt)],
    });

    console.log(`✅ Found ${allPackages.length} packages`);

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
      console.log("⚠️ Agent data query skipped:", err.message);
    }

    // 4. Calculate user stats
    const userStats = {
      total: allUsers.length,
      jamaah: allUsers.filter((u) => u.role === "JAMAAH").length,
      agen: allUsers.filter((u) => u.role === "AGEN").length,
      admin: allUsers.filter((u) => u.role === "ADMIN").length,
      finance: allUsers.filter((u) => u.role === "FINANCE").length,
    };

    // 5. Calculate package stats
    const activePackages = allPackages.filter((p) => p.isActive);
    const totalSeats = activePackages.reduce(
      (sum, p) => sum + (p.totalSeats || 0),
      0
    );
    const bookedSeats = activePackages.reduce(
      (sum, p) => sum + (p.bookedSeats || 0),
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
    const recentPackages = allPackages.slice(0, 5).map((pkg) => ({
      ...pkg,
      remainingSeats: (pkg.totalSeats || 0) - (pkg.bookedSeats || 0),
    }));

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

    console.log("✅ Dashboard stats ready:", {
      users: stats.users.total,
      packages: stats.packages.total,
      pendingAgents: stats.agents.pending,
    });

    return successResponse(res, stats, "Dashboard stats fetched successfully");
  } catch (error) {
    console.error("❌ Dashboard Stats Error:", error);
    console.error("❌ Error Stack:", error.stack);
    next(error);
  }
};
