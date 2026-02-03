// backend/src/controllers/calendarController.js

import { db } from "../db/index.js";
import { calendarEvents, packages, jamaahData, users } from "../db/schema.js";
import { eq, and, gte, lte, or, desc, asc, inArray } from "drizzle-orm";
import { successResponse, errorResponse } from "../utils/response.js";

// =====================================================
// HELPER: Sync Single Package Event
// =====================================================
export const syncPackageEvent = async (packageData) => {
  try {
    // Delete existing event for this package
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.packageId, packageData.id),
          eq(calendarEvents.type, "PACKAGE"),
        ),
      );

    // Only create if package is active and has dates
    if (
      packageData.isActive &&
      packageData.departureDate &&
      packageData.returnDate
    ) {
      await db.insert(calendarEvents).values({
        title: packageData.name,
        description: `${packageData.type || 'UMRAH'} - ${packageData.duration || 9} hari`,
        type: "PACKAGE",
        startDate: packageData.departureDate,
        endDate: packageData.returnDate,
        isAllDay: true,
        packageId: packageData.id,
        visibility: "ALL",
        color: "green",
        icon: "🕋",
        isActive: true,
      });

      console.log(`📅 Synced: ${packageData.name}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Sync package event error:", error);
    return false;
  }
};

// =====================================================
// HELPER: Auto-Sync Missing Packages
// =====================================================
const autoSyncMissingPackages = async () => {
  try {
    // Get all active packages
    const activePackages = await db.query.packages.findMany({
      where: eq(packages.isActive, true),
    });

    if (activePackages.length === 0) return;

    // Get all package IDs that already have calendar events
    const existingEvents = await db
      .select({ packageId: calendarEvents.packageId })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.type, "PACKAGE"),
          eq(calendarEvents.isActive, true)
        )
      );

    const syncedPackageIds = new Set(
      existingEvents.map((e) => e.packageId).filter(Boolean)
    );

    // Find packages not yet synced
    const missingPackages = activePackages.filter(
      (p) => !syncedPackageIds.has(p.id)
    );

    if (missingPackages.length > 0) {
      console.log(`📅 Auto-syncing ${missingPackages.length} missing packages...`);
      
      for (const pkg of missingPackages) {
        await syncPackageEvent(pkg);
      }
      
      console.log(`✅ Auto-sync complete: ${missingPackages.length} packages synced`);
    }
  } catch (error) {
    console.error("❌ Auto-sync error:", error);
  }
};

// =====================================================
// HELPER: Get package info for events
// =====================================================
const enrichEventsWithPackage = async (events) => {
  const packageIds = [
    ...new Set(events.filter((e) => e.packageId).map((e) => e.packageId)),
  ];

  if (packageIds.length === 0) return events;

  const packageList = await db.query.packages.findMany({
    where: inArray(packages.id, packageIds),
    columns: {
      id: true,
      name: true,
      code: true,
      type: true,
      duration: true,
      price: true,
      departureDate: true,
      returnDate: true,
      totalSeats: true,
    },
  });

  const packageMap = new Map(packageList.map((p) => [p.id, p]));

  return events.map((event) => ({
    ...event,
    package: event.packageId ? packageMap.get(event.packageId) || null : null,
  }));
};

// =====================================================
// GET EVENTS BY DATE RANGE (All roles) - FIXED
// =====================================================
export const getEventsByRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!startDate || !endDate) {
      return errorResponse(res, "startDate dan endDate wajib diisi", 400);
    }

    // ❌ HAPUS INI - Jangan auto-sync setiap request
    // await autoSyncMissingPackages();

    // Base query conditions
    let conditions = [
      eq(calendarEvents.isActive, true),
      or(
        and(
          gte(calendarEvents.startDate, startDate),
          lte(calendarEvents.startDate, endDate),
        ),
        and(
          lte(calendarEvents.startDate, endDate),
          gte(calendarEvents.endDate, startDate),
        ),
      ),
    ];

    // Visibility filter based on role
    if (userRole === "AGEN") {
      const agenJamaah = await db.query.jamaahData.findMany({
        where: eq(jamaahData.agenId, userId),
        columns: { packageId: true },
      });
      const agenPackageIds = [
        ...new Set(agenJamaah.map((j) => j.packageId).filter(Boolean)),
      ];

      conditions.push(
        or(
          eq(calendarEvents.visibility, "ALL"),
          eq(calendarEvents.visibility, "ADMIN_AGEN"),
          and(
            eq(calendarEvents.visibility, "PACKAGE_MEMBERS"),
            agenPackageIds.length > 0
              ? inArray(calendarEvents.packageId, agenPackageIds)
              : eq(calendarEvents.packageId, 0),
          ),
        ),
      );
    } else if (userRole === "JAMAAH") {
      const jamaah = await db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, userId),
        columns: { packageId: true },
      });
      const jamaahPackageId = jamaah?.packageId || 0;

      conditions.push(
        or(
          eq(calendarEvents.visibility, "ALL"),
          and(
            eq(calendarEvents.visibility, "PACKAGE_MEMBERS"),
            eq(calendarEvents.packageId, jamaahPackageId),
          ),
        ),
      );
    }

    const events = await db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(asc(calendarEvents.startDate), asc(calendarEvents.sortOrder));

    const enrichedEvents = await enrichEventsWithPackage(events);

    return successResponse(res, enrichedEvents);
  } catch (error) {
    console.error("❌ GET EVENTS BY RANGE ERROR:", error);
    next(error);
  }
};

// =====================================================
// GET EVENTS BY PACKAGE (Itinerary)
// =====================================================
export const getEventsByPackage = async (req, res, next) => {
  try {
    const { packageId } = req.params;

    const events = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.packageId, parseInt(packageId)),
          eq(calendarEvents.isActive, true),
        ),
      )
      .orderBy(
        asc(calendarEvents.startDate),
        asc(calendarEvents.dayNumber),
        asc(calendarEvents.sortOrder),
      );

    const packageEvent = events.find((e) => e.type === "PACKAGE");
    const itinerary = events.filter((e) => e.type === "ITINERARY");
    const deadlines = events.filter((e) => e.type === "DEADLINE");
    const otherEvents = events.filter(
      (e) => !["PACKAGE", "ITINERARY", "DEADLINE"].includes(e.type),
    );

    return successResponse(res, {
      package: packageEvent,
      itinerary,
      deadlines,
      events: otherEvents,
    });
  } catch (error) {
    console.error("❌ GET EVENTS BY PACKAGE ERROR:", error);
    next(error);
  }
};

// =====================================================
// CREATE EVENT (Admin only)
// =====================================================
export const createEvent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      location,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      dayNumber,
      city,
      packageId,
      icon,
      visibility,
      color,
      reminderDays,
      sortOrder,
    } = req.body;

    if (!title || !startDate || !type) {
      return errorResponse(res, "title, startDate, dan type wajib diisi", 400);
    }

    if (type === "ITINERARY" && !packageId) {
      return errorResponse(
        res,
        "packageId wajib diisi untuk type ITINERARY",
        400,
      );
    }

    let calculatedDayNumber = dayNumber;
    if (type === "ITINERARY" && packageId && !dayNumber) {
      const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, parseInt(packageId)),
      });
      if (pkg?.departureDate) {
        const depDate = new Date(pkg.departureDate);
        const eventDate = new Date(startDate);
        calculatedDayNumber =
          Math.floor((eventDate - depDate) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    const [newEvent] = await db
      .insert(calendarEvents)
      .values({
        title,
        description: description || null,
        location: location || null,
        type,
        startDate,
        endDate: endDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        isAllDay: isAllDay !== false,
        dayNumber: calculatedDayNumber || null,
        city: city || null,
        packageId: packageId ? parseInt(packageId) : null,
        icon: icon || "📅",
        visibility: visibility || "ALL",
        color: color || "blue",
        reminderDays: reminderDays || null,
        sortOrder: sortOrder || 0,
        createdBy: userId,
        isActive: true,
      })
      .$returningId();

    // Fetch created event
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, newEvent.id));

    const [enrichedEvent] = await enrichEventsWithPackage([event]);

    console.log(`📅 Event created: ${title}`);

    return successResponse(res, enrichedEvent, "Event berhasil dibuat", 201);
  } catch (error) {
    console.error("❌ CREATE EVENT ERROR:", error);
    next(error);
  }
};

// =====================================================
// UPDATE EVENT (Admin only)
// =====================================================
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      dayNumber,
      city,
      packageId,
      icon,
      visibility,
      color,
      reminderDays,
      sortOrder,
      isActive,
    } = req.body;

    const [existingEvent] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)));

    if (!existingEvent) {
      return errorResponse(res, "Event tidak ditemukan", 404);
    }

    if (existingEvent.type === "PACKAGE") {
      return errorResponse(
        res,
        "Event PACKAGE tidak bisa diedit langsung. Edit dari data paket.",
        400,
      );
    }

    await db
      .update(calendarEvents)
      .set({
        title,
        description,
        location,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        isAllDay,
        dayNumber,
        city,
        packageId: packageId ? parseInt(packageId) : null,
        icon,
        visibility,
        color,
        reminderDays,
        sortOrder,
        isActive,
      })
      .where(eq(calendarEvents.id, parseInt(id)));

    const [updatedEvent] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)));

    const [enrichedEvent] = await enrichEventsWithPackage([updatedEvent]);

    console.log(`📅 Event updated: ${title || existingEvent.title}`);

    return successResponse(res, enrichedEvent, "Event berhasil diupdate");
  } catch (error) {
    console.error("❌ UPDATE EVENT ERROR:", error);
    next(error);
  }
};

// =====================================================
// DELETE EVENT (Admin only)
// =====================================================
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existingEvent] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, parseInt(id)));

    if (!existingEvent) {
      return errorResponse(res, "Event tidak ditemukan", 404);
    }

    if (existingEvent.type === "PACKAGE") {
      return errorResponse(
        res,
        "Event PACKAGE tidak bisa dihapus langsung. Nonaktifkan paket jika perlu.",
        400,
      );
    }

    await db.delete(calendarEvents).where(eq(calendarEvents.id, parseInt(id)));

    console.log(`📅 Event deleted: ${existingEvent.title}`);

    return successResponse(res, null, "Event berhasil dihapus");
  } catch (error) {
    console.error("❌ DELETE EVENT ERROR:", error);
    next(error);
  }
};

// =====================================================
// BULK CREATE ITINERARY (For a package)
// =====================================================
export const bulkCreateItinerary = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { packageId, itineraries } = req.body;

    if (!packageId || !itineraries || !Array.isArray(itineraries)) {
      return errorResponse(res, "packageId dan itineraries wajib diisi", 400);
    }

    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, parseInt(packageId)),
    });

    if (!pkg) {
      return errorResponse(res, "Paket tidak ditemukan", 404);
    }

    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.packageId, parseInt(packageId)),
          eq(calendarEvents.type, "ITINERARY"),
        ),
      );

    const departureDate = new Date(pkg.departureDate);

    const itineraryValues = itineraries.map((item, index) => {
      const eventDate = new Date(departureDate);
      eventDate.setDate(eventDate.getDate() + (item.dayNumber - 1));

      return {
        title: item.title,
        description: item.description || null,
        location: item.location || null,
        type: "ITINERARY",
        startDate: eventDate.toISOString().split("T")[0],
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        isAllDay: !item.startTime,
        dayNumber: item.dayNumber,
        city: item.city || null,
        packageId: parseInt(packageId),
        icon: item.icon || "📅",
        visibility: "PACKAGE_MEMBERS",
        color: item.color || "blue",
        sortOrder: item.sortOrder || index,
        createdBy: userId,
        isActive: true,
      };
    });

    if (itineraryValues.length > 0) {
      await db.insert(calendarEvents).values(itineraryValues);
    }

    console.log(
      `📅 Bulk itinerary created for package ${packageId}: ${itineraryValues.length} items`,
    );

    return successResponse(
      res,
      { count: itineraryValues.length },
      `${itineraryValues.length} jadwal berhasil dibuat`,
    );
  } catch (error) {
    console.error("❌ BULK CREATE ITINERARY ERROR:", error);
    next(error);
  }
};

// =====================================================
// GET UPCOMING EVENTS (For dashboard widgets)
// =====================================================
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { limit = 5 } = req.query;

    const today = new Date().toISOString().split("T")[0];

    let conditions = [
      eq(calendarEvents.isActive, true),
      gte(calendarEvents.startDate, today),
    ];

    if (userRole === "JAMAAH") {
      const jamaah = await db.query.jamaahData.findFirst({
        where: eq(jamaahData.userId, userId),
        columns: { packageId: true },
      });
      const jamaahPackageId = jamaah?.packageId || 0;

      conditions.push(
        or(
          eq(calendarEvents.visibility, "ALL"),
          and(
            eq(calendarEvents.visibility, "PACKAGE_MEMBERS"),
            eq(calendarEvents.packageId, jamaahPackageId),
          ),
        ),
      );
    } else if (userRole === "AGEN") {
      const agenJamaah = await db.query.jamaahData.findMany({
        where: eq(jamaahData.agenId, userId),
        columns: { packageId: true },
      });
      const agenPackageIds = [
        ...new Set(agenJamaah.map((j) => j.packageId).filter(Boolean)),
      ];

      conditions.push(
        or(
          eq(calendarEvents.visibility, "ALL"),
          eq(calendarEvents.visibility, "ADMIN_AGEN"),
          and(
            eq(calendarEvents.visibility, "PACKAGE_MEMBERS"),
            agenPackageIds.length > 0
              ? inArray(calendarEvents.packageId, agenPackageIds)
              : eq(calendarEvents.packageId, 0),
          ),
        ),
      );
    }

    const events = await db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(asc(calendarEvents.startDate))
      .limit(parseInt(limit));

    const enrichedEvents = await enrichEventsWithPackage(events);

    return successResponse(res, enrichedEvents);
  } catch (error) {
    console.error("❌ GET UPCOMING EVENTS ERROR:", error);
    next(error);
  }
};


// =====================================================
// SYNC ALL PACKAGES TO CALENDAR (Manual trigger)
// =====================================================
export const syncAllPackages = async (req, res, next) => {
  try {
    // Get all active packages
    const allPackages = await db.query.packages.findMany({
      where: eq(packages.isActive, true),
    });

    let synced = 0;
    let failed = 0;

    for (const pkg of allPackages) {
      try {
        // Delete existing PACKAGE event
        await db
          .delete(calendarEvents)
          .where(
            and(
              eq(calendarEvents.packageId, pkg.id),
              eq(calendarEvents.type, "PACKAGE")
            )
          );

        // Create new PACKAGE event if has departure & return date
        if (pkg.departureDate && pkg.returnDate) {
          await db.insert(calendarEvents).values({
            title: pkg.name,
            description: `${pkg.type || 'UMRAH'} - ${pkg.duration || 9} hari`,
            type: "PACKAGE",
            startDate: pkg.departureDate,
            endDate: pkg.returnDate,
            isAllDay: true,
            packageId: pkg.id,
            visibility: "ALL",
            color: "green",
            icon: "🕋",
            isActive: true,
          });
          synced++;
          console.log(`📅 Synced: ${pkg.name}`);
        }
      } catch (err) {
        failed++;
        console.error(`❌ Failed to sync package ${pkg.id}:`, err.message);
      }
    }

    console.log(`📅 Sync complete: ${synced} synced, ${failed} failed`);

    return successResponse(res, {
      total: allPackages.length,
      synced,
      failed,
    }, `${synced} paket berhasil disinkronkan ke kalender`);
  } catch (error) {
    console.error("❌ SYNC ALL PACKAGES ERROR:", error);
    next(error);
  }
};