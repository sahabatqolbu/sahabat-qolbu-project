import { and, eq } from "drizzle-orm";
import { db } from "./index.js";
import {
  masterAirlines,
  masterAirports,
  masterHotels,
  packageScheduleItems,
  packageScheduleLists,
} from "./schema.js";

const MILLION = 1_000_000;
const sharedSubtitle = "Pilih Jadwal, Maskapai & Tipe Kamar Sesuai Kebutuhan Keluarga";

const scheduleLists = [
  {
    name: "PAKET FAMILY PELATARAN",
    month: "2026-10",
    subtitle: sharedSubtitle,
    note: "Harga dan ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-10-03", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 40.5, 43.5, 45.5],
      ["2026-10-05", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 36.9, 39.9, 41.9],
      ["2026-10-12", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44.9, 46.9],
      ["2026-10-21", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 36.9, 39.9, 42.9],
      ["2026-10-29", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 40.9, 43.9, 46.9],
      ["2026-10-31", 9, "QR", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 36.5, 38.5, 41.5],
    ],
  },
  {
    name: "PAKET FAMILY SMART",
    month: "2026-11",
    subtitle: sharedSubtitle,
    note: "Harga, hotel setaraf, rute dan ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-11-02", 9, "GA", "Maysan Al Mashaer / setaraf", "Al Saha / setaraf", 35.9, 37.9, 41.9, null, null, "Prosesi Umroh bersama Ustadz Khalid Basalamah"],
      ["2026-11-04", 12, "QR", "Snood Ajyad / setaraf", "Durrat Al Eiman / setaraf", 34.5, 36.5, 39.5, null, null, "2X Jumaat"],
      ["2026-11-07", null, "QR", "Al-Massa Fayzeen / setaraf", "Mukhtara / Triple One / setaraf", 34.5, 36.5, 38.5],
      ["2026-11-10", null, "SV", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.9, 34.9],
      ["2026-11-11", null, "GA", "Al-Massa Fayzeen / setaraf", "Mukhtara / Triple One / setaraf", 36.5, 38.5, 40.5],
      ["2026-11-14", null, "WY", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 31.5, 33.5, 35.5],
      ["2026-11-16", 12, "WY", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 33.5, 36.5, 38.5, "MED", "JED"],
      ["2026-11-21", null, "SV", "Al-Massa Fayzeen / setaraf", "Mukhtara / Triple One / setaraf", 32.5, 34.5, 36.5],
      ["2026-11-25", null, "QR", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.9, 34.9],
      ["2026-11-30", null, "GA", "Al-Massa Fayzeen / setaraf", "Mukhtara / Triple One / setaraf", 34.5, 37.5, 39.5, "MED", "JED"],
    ],
  },
];

const findHotel = (hotels, label, city) => {
  const normalized = label.toLowerCase();
  return hotels.find((hotel) => hotel.city === city && normalized.includes(hotel.name.toLowerCase()))?.id || null;
};

const run = async () => {
  let [airlines, airports, hotels] = await Promise.all([
    db.select().from(masterAirlines),
    db.select().from(masterAirports),
    db.select().from(masterHotels),
  ]);

  if (!airlines.some((airline) => airline.code === "WY")) {
    await db.insert(masterAirlines).values({ code: "WY", name: "Oman Air", country: "Oman", isActive: true });
    airlines = await db.select().from(masterAirlines);
  }

  const airlineByCode = new Map(airlines.map((item) => [item.code, item.id]));
  const airportByCode = new Map(airports.map((item) => [item.code, item.id]));
  if (!airportByCode.get("JED") || !airportByCode.get("MED")) {
    throw new Error("Master bandara JED dan MED wajib tersedia sebelum seed jadwal");
  }

  for (const definition of scheduleLists) {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(packageScheduleLists)
        .where(and(eq(packageScheduleLists.name, definition.name), eq(packageScheduleLists.month, definition.month)))
        .limit(1);
      let listId = existing?.id;
      const listData = {
        name: definition.name,
        month: definition.month,
        subtitle: definition.subtitle,
        note: definition.note,
        isActive: true,
        isPublished: true,
      };
      if (listId) {
        await tx.update(packageScheduleLists).set(listData).where(eq(packageScheduleLists.id, listId));
        await tx.delete(packageScheduleItems).where(eq(packageScheduleItems.listId, listId));
      } else {
        const [created] = await tx.insert(packageScheduleLists).values(listData).$returningId();
        listId = created.id;
      }

      await tx.insert(packageScheduleItems).values(
        definition.rows.map((row, index) => ({
          listId,
          departureDate: row[0],
          duration: row[1],
          airlineId: airlineByCode.get(row[2]),
          hotelMakkahLabel: row[3],
          hotelMadinahLabel: row[4],
          hotelMakkahId: findHotel(hotels, row[3], "MAKKAH"),
          hotelMadinahId: findHotel(hotels, row[4], "MADINAH"),
          priceQuad: String(row[5] * MILLION),
          priceTriple: String(row[6] * MILLION),
          priceDouble: String(row[7] * MILLION),
          arrivalAirportId: airportByCode.get(row[8] || "JED"),
          returnAirportId: airportByCode.get(row[9] || "JED"),
          note: row[10] || null,
          status: "CHECK_SEAT",
          sortOrder: index,
        })),
      );
    });
  }
  console.log(`Seeded ${scheduleLists.length} package schedule lists.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
