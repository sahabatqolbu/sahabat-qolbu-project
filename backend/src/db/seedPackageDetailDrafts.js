import { eq, or } from "drizzle-orm";
import { db } from "./index.js";
import { packageDetailDrafts } from "./packageDetailDrafts.js";
import {
  masterAirlines,
  masterAirports,
  packageOptions,
  packages,
} from "./schema.js";

const MILLION = 1_000_000;
const money = (millions) => String(millions * MILLION);

const run = async () => {
  const [airlines, airports] = await Promise.all([
    db.select().from(masterAirlines),
    db.select().from(masterAirports),
  ]);
  const airlineByCode = new Map(airlines.map((item) => [item.code, item.id]));
  const airportByCode = new Map(airports.map((item) => [item.code, item.id]));

  for (const draft of packageDetailDrafts) {
    const airlineId = airlineByCode.get(draft.airlineCode);
    const arrivalAirportId = airportByCode.get(draft.arrivalAirportCode);
    const returnAirportId = airportByCode.get(draft.returnAirportCode);
    if (!airlineId || !arrivalAirportId || !returnAirportId) {
      throw new Error(`Master maskapai/bandara belum lengkap untuk ${draft.code}`);
    }

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(or(eq(packages.code, draft.code), eq(packages.name, draft.name)))
        .limit(1);
      if (existing) {
        console.log(`Preserved existing package draft: ${draft.code}`);
        return;
      }

      const defaultOption = draft.options[0];
      const [created] = await tx.insert(packages).values({
        code: draft.code,
        name: draft.name,
        description: draft.description,
        type: "FULL_SERVICE",
        departureDate: draft.departureDate,
        returnDate: draft.returnDate,
        duration: draft.duration,
        price: money(defaultOption.priceQuad),
        discountPrice: null,
        priceDouble: money(defaultOption.priceDouble),
        priceTriple: money(defaultOption.priceTriple),
        priceQuad: money(defaultOption.priceQuad),
        priceQuint: "0",
        facilities: draft.facilities.join("\n"),
        excludedFacilities: null,
        notes: draft.notes.join("\n"),
        registrationRequirements: null,
        termsConditions: null,
        registrationSteps: null,
        airlineId,
        airlineStatus: "PLANNING",
        hotelMakkahStatus: "PLANNING",
        hotelMadinahStatus: "PLANNING",
        arrivalAirportId,
        returnAirportId,
        isActive: false,
        isPublished: false,
        manualBookingStatus: "CLOSED",
      }).$returningId();

      await tx.insert(packageOptions).values(draft.options.map((option, index) => ({
        packageId: created.id,
        name: option.name,
        priceDouble: money(option.priceDouble),
        priceTriple: money(option.priceTriple),
        priceQuad: money(option.priceQuad),
        priceQuint: "0",
        isDefault: index === 0,
        isActive: true,
        sortOrder: index,
      })));

      console.log(`Created package detail draft: ${draft.code}`);
    });
  }

  console.log(`Processed ${packageDetailDrafts.length} package detail drafts.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
