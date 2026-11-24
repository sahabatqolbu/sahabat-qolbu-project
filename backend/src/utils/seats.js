import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { jamaahData } from "../db/schema.js";

// A seat is held once an admin confirms the registration, the jamaah has paid, or the data is approved.
export const seatHeldCondition = () => or(
  isNotNull(jamaahData.seatConfirmedAt),
  inArray(jamaahData.statusPayment, ["CICILAN", "LUNAS"]),
  eq(jamaahData.registrationStatus, "APPROVED"),
);

export const seatHeldForPackage = (packageId) => and(eq(jamaahData.packageId, packageId), seatHeldCondition());
