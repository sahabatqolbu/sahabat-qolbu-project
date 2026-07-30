import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  jamaahData,
  packages,
  packageOptions,
  prospectFollowUps,
  prospectJamaah,
  prospectPackageInterests,
  users,
} from "../db/schema.js";
import { createJamaahRecordWithRetry } from "../utils/bookingNumber.js";
import {
  errorResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";

const PROSPECT_STATUSES = new Set([
  "BARU",
  "DIHUBUNGI",
  "TERTARIK",
  "BELUM_RESPON",
  "CONVERTED",
]);

const getCurrentProspect = async (userId) => {
  return db.query.prospectJamaah.findFirst({
    where: eq(prospectJamaah.userId, userId),
  });
};

const getPublishedPackage = async (packageId) => {
  return db.query.packages.findFirst({
    where: and(
      eq(packages.id, packageId),
      eq(packages.isActive, true),
      eq(packages.isPublished, true),
    ),
    with: {
      options: {
        with: {
          hotelMakkah: true,
          hotelMadinah: true,
          images: true,
        },
        orderBy: (options, { asc }) => [
          asc(options.sortOrder),
          asc(options.id),
        ],
      },
    },
  });
};

const resolvePackageOption = (packageData, packageOptionId) => {
  const activeOptions = (packageData.options || []).filter(
    (option) => option.isActive !== false,
  );
  if (activeOptions.length === 0) return { option: null };

  const requestedId = Number(packageOptionId || 0);
  const option = requestedId
    ? activeOptions.find((item) => item.id === requestedId)
    : activeOptions.find((item) => item.isDefault) || activeOptions[0];

  return option
    ? { option }
    : { error: "Pilihan paket tidak valid atau sudah tidak aktif" };
};

const PACKAGE_CLOSE_DAYS_BEFORE_DEPARTURE = 7;

const getDaysUntilDeparture = (departureDate) => {
  if (!departureDate) {
    return 9999;
  }

  const today = new Date();
  const departure = new Date(departureDate);
  if (Number.isNaN(departure.getTime())) {
    return 9999;
  }

  return Math.ceil((departure - today) / (1000 * 60 * 60 * 24));
};

const hasPositivePrice = (packageData = {}) =>
  [
    packageData.discountPrice,
    packageData.priceQuad,
    packageData.priceQuint,
    packageData.priceTriple,
    packageData.priceDouble,
    packageData.price,
  ].some((value) => Number.parseFloat(value || 0) > 0);

const hasReadyPackageOption = (packageData = {}) =>
  (packageData.options || []).some(
    (option) =>
      option.isActive !== false &&
      option.hotelMakkahId &&
      option.hotelMadinahId &&
      hasPositivePrice(option),
  );

const isPackageComingSoon = (packageData = {}) => {
  const departureDate = new Date(packageData.departureDate);
  const returnDate = new Date(packageData.returnDate);
  const hasValidDates =
    !Number.isNaN(departureDate.getTime()) &&
    !Number.isNaN(returnDate.getTime()) &&
    returnDate >= departureDate;
  const hasCoreInventory = Number(packageData.totalSeats || 0) > 0;
  const hasCoreVendors = Boolean(
    packageData.airlineId &&
    ((packageData.hotelMakkahId && packageData.hotelMadinahId) ||
      hasReadyPackageOption(packageData)),
  );
  const hasConfirmedVendors =
    String(packageData.airlineStatus || "").toUpperCase() === "CONFIRMED" &&
    (hasReadyPackageOption(packageData) ||
      (String(packageData.hotelMakkahStatus || "").toUpperCase() ===
        "CONFIRMED" &&
        String(packageData.hotelMadinahStatus || "").toUpperCase() ===
          "CONFIRMED"));

  return (
    !hasValidDates ||
    !hasPositivePrice(packageData) ||
    !hasCoreInventory ||
    !hasCoreVendors ||
    !hasConfirmedVendors
  );
};

const getBookedSeats = async (packageId) => {
  const [result] = await db
    .select({ count: count() })
    .from(jamaahData)
    .where(
      and(
        eq(jamaahData.packageId, packageId),
        sql`${jamaahData.registrationStatus} IN ('DRAFT','PENDING_DOCUMENT','PENDING_PAYMENT','VERIFIED','APPROVED')`,
      ),
    );

  return Number(result?.count || 0);
};

const getPackageClosedReason = async (packageData) => {
  if (isPackageComingSoon(packageData)) {
    return "Paket masih Coming Soon";
  }

  const bookedSeats = await getBookedSeats(packageData.id);
  const remainingSeats = Number(packageData.totalSeats || 0) - bookedSeats;

  if (remainingSeats <= 0) {
    return "Kursi paket sudah penuh";
  }

  if (
    getDaysUntilDeparture(packageData.departureDate) <=
    PACKAGE_CLOSE_DAYS_BEFORE_DEPARTURE
  ) {
    return "Pendaftaran paket sudah ditutup";
  }

  return null;
};

const getProspectInterests = async (prospectId, limit = 20) => {
  return db
    .select({
      id: prospectPackageInterests.id,
      actionType: prospectPackageInterests.actionType,
      sourcePath: prospectPackageInterests.sourcePath,
      createdAt: prospectPackageInterests.createdAt,
      packageId: packages.id,
      packageOptionId: packageOptions.id,
      packageOptionName: packageOptions.name,
      packageName: packages.name,
      packageCode: packages.code,
      packageType: packages.type,
      departureDate: packages.departureDate,
      returnDate: packages.returnDate,
      price: packages.price,
      discountPrice: packages.discountPrice,
    })
    .from(prospectPackageInterests)
    .leftJoin(packages, eq(prospectPackageInterests.packageId, packages.id))
    .leftJoin(
      packageOptions,
      eq(prospectPackageInterests.packageOptionId, packageOptions.id),
    )
    .where(eq(prospectPackageInterests.prospectId, prospectId))
    .orderBy(
      desc(prospectPackageInterests.createdAt),
      desc(prospectPackageInterests.id),
    )
    .limit(limit);
};

const getFollowUps = async (prospectId) => {
  return db
    .select({
      id: prospectFollowUps.id,
      status: prospectFollowUps.status,
      note: prospectFollowUps.note,
      createdAt: prospectFollowUps.createdAt,
      actorUserId: users.id,
      actorName: users.fullName,
      actorRole: users.role,
    })
    .from(prospectFollowUps)
    .leftJoin(users, eq(prospectFollowUps.actorUserId, users.id))
    .where(eq(prospectFollowUps.prospectId, prospectId))
    .orderBy(desc(prospectFollowUps.createdAt), desc(prospectFollowUps.id));
};

const insertInterest = async ({
  prospectId,
  packageId,
  packageOptionId,
  actionType,
  sourcePath,
}) => {
  const [inserted] = await db
    .insert(prospectPackageInterests)
    .values({
      prospectId,
      packageId,
      packageOptionId: packageOptionId || null,
      actionType,
      sourcePath: sourcePath || null,
    })
    .$returningId();

  return inserted;
};

const buildInitialJamaahValues = ({
  userId,
  packageData,
  packageOption,
  bookingNumber,
}) => {
  const optionPrice = [
    packageOption?.priceQuad,
    packageOption?.priceTriple,
    packageOption?.priceDouble,
    packageOption?.priceQuint,
  ].find((value) => Number.parseFloat(value || 0) > 0);
  const price = String(
    optionPrice || packageData.discountPrice || packageData.price || "0",
  );

  return {
    userId,
    packageId: packageData.id,
    packageOptionId: packageOption?.id || null,
    bookingNumber,
    dateOfBooking: new Date(),
    registrationStatus: "DRAFT",
    statusPayment: "BELUM_BAYAR",
    isProfileComplete: false,
    notePaket: "FULLSERVICE",
    hargaPaket: price,
    potonganFeeAgen: "0",
    potonganPoinAgen: "0",
    potonganCashbackKK: "0",
    hargaFinal: price,
    totalPayment: "0",
    outstanding: price,
  };
};

const convertProspect = async ({
  prospect,
  packageId,
  packageOptionId,
  sourcePath,
  actorUserId,
}) => {
  const packageData = await getPublishedPackage(packageId);
  if (!packageData) {
    return {
      error: "Paket tidak ditemukan atau belum dipublikasikan",
      statusCode: 404,
    };
  }

  const optionResult = resolvePackageOption(packageData, packageOptionId);
  if (optionResult.error) {
    return { error: optionResult.error, statusCode: 400 };
  }
  const packageOption = optionResult.option;

  const closedReason = await getPackageClosedReason(packageData);
  if (closedReason) {
    return { error: closedReason, statusCode: 400 };
  }

  await insertInterest({
    prospectId: prospect.id,
    packageId,
    packageOptionId: packageOption?.id || null,
    actionType: "CONVERT_REQUEST",
    sourcePath,
  });

  const existingJamaah = await db.query.jamaahData.findFirst({
    where: eq(jamaahData.userId, prospect.userId),
    orderBy: [desc(jamaahData.updatedAt), desc(jamaahData.id)],
  });

  if (existingJamaah) {
    await db
      .update(users)
      .set({ role: "JAMAAH" })
      .where(eq(users.id, prospect.userId));
    await db
      .update(prospectJamaah)
      .set({
        followUpStatus: "CONVERTED",
        convertedJamaahId: existingJamaah.id,
        convertedAt: new Date(),
      })
      .where(eq(prospectJamaah.id, prospect.id));

    await db.insert(prospectFollowUps).values({
      prospectId: prospect.id,
      actorUserId: actorUserId || prospect.userId,
      status: "CONVERTED",
      note: `Prospect sudah memiliki data jamaah ${existingJamaah.bookingNumber}.`,
    });

    return {
      jamaah: existingJamaah,
      packageData,
      packageOption,
      created: false,
    };
  }

  const { bookingNumber, newJamaah } = await createJamaahRecordWithRetry(
    (generatedBookingNumber) =>
      buildInitialJamaahValues({
        userId: prospect.userId,
        packageData,
        packageOption,
        bookingNumber: generatedBookingNumber,
      }),
  );

  await db
    .update(users)
    .set({ role: "JAMAAH" })
    .where(eq(users.id, prospect.userId));
  await db
    .update(prospectJamaah)
    .set({
      followUpStatus: "CONVERTED",
      convertedJamaahId: Number(newJamaah.id),
      convertedAt: new Date(),
    })
    .where(eq(prospectJamaah.id, prospect.id));

  await db.insert(prospectFollowUps).values({
    prospectId: prospect.id,
    actorUserId: actorUserId || prospect.userId,
    status: "CONVERTED",
    note: `Prospect dikonversi ke jamaah dengan booking ${bookingNumber}.`,
  });

  const convertedJamaah = await db.query.jamaahData.findFirst({
    where: eq(jamaahData.id, Number(newJamaah.id)),
  });

  return {
    jamaah: convertedJamaah,
    packageData,
    packageOption,
    created: true,
  };
};

export const getMyProspectSummary = async (req, res, next) => {
  try {
    const prospect = await getCurrentProspect(req.user.userId);
    if (!prospect) {
      return notFoundResponse(res, "Data calon jamaah tidak ditemukan");
    }

    const interests = await getProspectInterests(prospect.id, 5);

    return successResponse(res, {
      prospect,
      user: {
        id: req.user.userId,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
      },
      recentInterests: interests,
    });
  } catch (error) {
    logger.error("Get prospect summary error", error, {
      userId: req.user?.userId,
    });
    next(error);
  }
};

export const saveMyPackageInterest = async (req, res, next) => {
  try {
    const prospect = await getCurrentProspect(req.user.userId);
    if (!prospect) {
      return notFoundResponse(res, "Data calon jamaah tidak ditemukan");
    }

    const { packageId, packageOptionId, actionType, sourcePath } =
      req.validatedBody;
    const packageData = await getPublishedPackage(packageId);
    if (!packageData) {
      return notFoundResponse(
        res,
        "Paket tidak ditemukan atau belum dipublikasikan",
      );
    }

    const optionResult = resolvePackageOption(packageData, packageOptionId);
    if (optionResult.error) {
      return errorResponse(res, optionResult.error, 400);
    }
    const packageOption = optionResult.option;

    if (actionType !== "WHATSAPP_CONSULT") {
      const closedReason = await getPackageClosedReason(packageData);
      if (closedReason) {
        return errorResponse(res, closedReason, 400);
      }
    }

    const inserted = await insertInterest({
      prospectId: prospect.id,
      packageId,
      packageOptionId: packageOption?.id || null,
      actionType,
      sourcePath,
    });

    if (
      actionType === "WHATSAPP_CONSULT" &&
      prospect.followUpStatus === "BARU"
    ) {
      await db
        .update(prospectJamaah)
        .set({ followUpStatus: "TERTARIK" })
        .where(eq(prospectJamaah.id, prospect.id));
    }

    return successResponse(
      res,
      { id: inserted.id, package: packageData, packageOption },
      "Minat paket berhasil disimpan",
      201,
    );
  } catch (error) {
    logger.error("Save prospect interest error", error, {
      userId: req.user?.userId,
    });
    next(error);
  }
};

export const getMyPackageInterests = async (req, res, next) => {
  try {
    const prospect = await getCurrentProspect(req.user.userId);
    if (!prospect) {
      return notFoundResponse(res, "Data calon jamaah tidak ditemukan");
    }

    const interests = await getProspectInterests(prospect.id, 100);
    return successResponse(res, interests);
  } catch (error) {
    next(error);
  }
};

export const convertMyProspectToJamaah = async (req, res, next) => {
  try {
    const prospect = await getCurrentProspect(req.user.userId);
    if (!prospect) {
      return notFoundResponse(res, "Data calon jamaah tidak ditemukan");
    }

    const { packageId, packageOptionId, sourcePath } = req.validatedBody;
    const result = await convertProspect({
      prospect,
      packageId,
      packageOptionId,
      sourcePath,
      actorUserId: req.user.userId,
    });

    if (result.error) {
      return errorResponse(res, result.error, result.statusCode || 400);
    }

    return successResponse(
      res,
      result,
      "Pengajuan jamaah berhasil dibuat. Silakan lengkapi data dan dokumen.",
      result.created ? 201 : 200,
    );
  } catch (error) {
    logger.error("Convert own prospect error", error, {
      userId: req.user?.userId,
    });
    next(error);
  }
};

const buildProspectListWhere = ({ status, search }) => {
  const conditions = [];

  if (status && PROSPECT_STATUSES.has(status)) {
    conditions.push(eq(prospectJamaah.followUpStatus, status));
  }

  if (search) {
    const query = `%${search}%`;
    conditions.push(
      or(
        like(users.fullName, query),
        like(users.email, query),
        like(users.phone, query),
        like(prospectJamaah.sourceSlug, query),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const getProspects = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query;
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    const offset = (page - 1) * limit;
    const where = buildProspectListWhere(query);

    const rows = await db
      .select({
        id: prospectJamaah.id,
        followUpStatus: prospectJamaah.followUpStatus,
        sourceType: prospectJamaah.sourceType,
        sourceSlug: prospectJamaah.sourceSlug,
        convertedJamaahId: prospectJamaah.convertedJamaahId,
        convertedAt: prospectJamaah.convertedAt,
        createdAt: prospectJamaah.createdAt,
        updatedAt: prospectJamaah.updatedAt,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isEmailVerified: users.isEmailVerified,
      })
      .from(prospectJamaah)
      .leftJoin(users, eq(prospectJamaah.userId, users.id))
      .where(where)
      .orderBy(desc(prospectJamaah.updatedAt), desc(prospectJamaah.id))
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ total: count() })
      .from(prospectJamaah)
      .leftJoin(users, eq(prospectJamaah.userId, users.id))
      .where(where);

    const data = await Promise.all(
      rows.map(async (row) => {
        const latestInterest = await getProspectInterests(row.id, 1);
        return {
          ...row,
          latestInterest: latestInterest[0] || null,
        };
      }),
    );

    const total = Number(totalRows[0]?.total || 0);
    return paginatedResponse(res, data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Get prospects error", error, { userId: req.user?.userId });
    next(error);
  }
};

export const getProspectDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "ID calon jamaah tidak valid", 400);
    }

    const rows = await db
      .select({
        id: prospectJamaah.id,
        followUpStatus: prospectJamaah.followUpStatus,
        sourceType: prospectJamaah.sourceType,
        sourceSlug: prospectJamaah.sourceSlug,
        convertedJamaahId: prospectJamaah.convertedJamaahId,
        convertedAt: prospectJamaah.convertedAt,
        createdAt: prospectJamaah.createdAt,
        updatedAt: prospectJamaah.updatedAt,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
      })
      .from(prospectJamaah)
      .leftJoin(users, eq(prospectJamaah.userId, users.id))
      .where(eq(prospectJamaah.id, id))
      .limit(1);

    const prospect = rows[0];
    if (!prospect) {
      return notFoundResponse(res, "Calon jamaah tidak ditemukan");
    }

    const [interests, followUps] = await Promise.all([
      getProspectInterests(id, 100),
      getFollowUps(id),
    ]);

    return successResponse(res, {
      prospect,
      interests,
      followUps,
    });
  } catch (error) {
    next(error);
  }
};

export const addProspectFollowUp = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "ID calon jamaah tidak valid", 400);
    }

    const prospect = await db.query.prospectJamaah.findFirst({
      where: eq(prospectJamaah.id, id),
    });
    if (!prospect) {
      return notFoundResponse(res, "Calon jamaah tidak ditemukan");
    }

    const { status, note } = req.validatedBody;
    const [inserted] = await db
      .insert(prospectFollowUps)
      .values({
        prospectId: id,
        actorUserId: req.user.userId,
        status,
        note: note || null,
      })
      .$returningId();

    await db
      .update(prospectJamaah)
      .set({ followUpStatus: status })
      .where(eq(prospectJamaah.id, id));

    return successResponse(
      res,
      { id: inserted.id },
      "Follow up berhasil disimpan",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const adminConvertProspectToJamaah = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, "ID calon jamaah tidak valid", 400);
    }

    const prospect = await db.query.prospectJamaah.findFirst({
      where: eq(prospectJamaah.id, id),
    });
    if (!prospect) {
      return notFoundResponse(res, "Calon jamaah tidak ditemukan");
    }

    const { packageId, packageOptionId, sourcePath } = req.validatedBody;
    const result = await convertProspect({
      prospect,
      packageId,
      packageOptionId,
      sourcePath,
      actorUserId: req.user.userId,
    });

    if (result.error) {
      return errorResponse(res, result.error, result.statusCode || 400);
    }

    return successResponse(res, result, "Calon jamaah berhasil dikonversi");
  } catch (error) {
    logger.error("Admin convert prospect error", error, {
      userId: req.user?.userId,
    });
    next(error);
  }
};
