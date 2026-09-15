import { and, eq } from "drizzle-orm";
import { db } from "./index.js";
import { decemberPackageSchedules } from "./decemberPackageSchedules.js";
import { dubaiPackageSchedules } from "./dubaiPackageSchedules.js";
import { turkeyPackageSchedules } from "./turkeyPackageSchedules.js";
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
    name: "PAKET FAMILY COMFY",
    month: "2026-10",
    subtitle: sharedSubtitle,
    note: "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-10-03", 9, "SV", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 35.9, 37.9, 39.9],
      ["2026-10-05", 9, "SV", "Maisyan Al-Mashaer / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
      ["2026-10-12", 9, "SV", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 36.9, 39.9, 41.9],
      ["2026-10-21", 9, "SV", "Maisyan Al-Mashaer / Azka Al-Safa / setaraf", "ODST / Triple One / setaraf", 33.9, 36.9, 38.9],
      ["2026-10-21", 9, "QR", "Royal Majestic / setaraf", "ODST / Triple One / setaraf", 32.5, 34.5, 36.5],
      ["2026-10-29", 9, "SV", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 36.5, 38.5, 40.5],
      ["2026-10-31", 9, "QR", "Maisyan Al-Mashaer / Azka Al-Safa / setaraf", "ODST / Triple One / setaraf", 33.5, 36.5, 38.5],
    ],
  },
  {
    name: "PAKET FAMILY PELATARAN",
    month: "2026-10",
    subtitle: sharedSubtitle,
    note: "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-10-03", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 40.5, 43.5, 45.5],
      ["2026-10-05", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 36.9, 39.9, 41.9],
      ["2026-10-12", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44.9, 46.9],
      ["2026-10-21", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 36.9, 39.9, 42.9],
      ["2026-10-29", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 40.9, 43.9, 46.9],
      ["2026-10-31", 9, "QR", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 36.5, 38.5, 41.5],
    ],
  },
  {
    name: "PAKET FAMILY SMART",
    month: "2026-11",
    subtitle: sharedSubtitle,
    note: "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-11-07", 9, "GA", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 37.5, 40.5, 43.5],
      ["2026-11-10", 9, "QR", "Royal Majestic / setaraf", "ODST / Triple One / setaraf", 32.5, 34.5, 36.5],
      ["2026-11-14", 9, "GA", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 38.5, 40.5, 43.5],
      ["2026-11-14", 9, "WY", "Maisyan Al-Mashaer / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
      ["2026-11-16", 12, "WY", "Maisyan Al-Mashaer / setaraf", "ODST / Triple One / setaraf", 37.9, 41.5, 43.5, "MED", "JED"],
      ["2026-11-21", 9, "SV", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 37.5, 40.5, 43.5],
      ["2026-11-25", 9, "QR", "Royal Majestic / setaraf", "ODST / Triple One / setaraf", 32.5, 34.9, 36.9],
      ["2026-11-30", 9, "GA", "Azka Al-Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 37.5, 40.5, 43.5],
    ],
  },
  {
    name: "PAKET FAMILY PELATARAN",
    month: "2026-11",
    subtitle: "±3–5 menit jalan kaki dari hotel ke pelataran Masjid",
    note: "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
    rows: [
      ["2026-11-02", 9, "GA", "Safwah Tower 1", "Al Saha", 44.9, 47.9, 53.0, null, null, "Prosesi Umroh bersama Ustadz Khalid Basalamah"],
      ["2026-11-14", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / ODST / setaraf", 43.9, 46.9, 48.9],
      ["2026-11-14", 9, "WY", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 36.9, 39.9, 42.9],
      ["2026-11-16", 12, "WY", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 42.4, 48.5, 52.5, "MED", "JED"],
      ["2026-11-21", 9, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / ODST / setaraf", 48.5, 51.5, 55.5],
      ["2026-11-25", 9, "QR", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 36.9, 39.9, 42.9],
      ["2026-11-30", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / ODST / setaraf", 42.9, 45.9, 48.5],
    ],
  },
];

const findHotel = (hotels, label, city) => {
  const normalized = label.toLowerCase();
  return hotels.find((hotel) => hotel.city === city && normalized.includes(hotel.name.toLowerCase()))?.id || null;
};

const run = async () => {
  const monthArgument = process.argv.find((arg) => arg.startsWith("--month="))?.split("=")[1];
  if (monthArgument && !/^\d{4}-\d{2}$/.test(monthArgument)) throw new Error("Invalid --month=YYYY-MM");
  const definitions = [
    ...scheduleLists,
    ...decemberPackageSchedules,
    ...turkeyPackageSchedules,
    ...dubaiPackageSchedules,
  ]
    .filter((list) => !monthArgument || list.month === monthArgument);
  if (!definitions.length) throw new Error("Tidak ada definisi seed untuk bulan ini");
  let [airlines, airports, hotels] = await Promise.all([
    db.select().from(masterAirlines),
    db.select().from(masterAirports),
    db.select().from(masterHotels),
  ]);

  const requiredAirlines = {
    WY: { name: "Oman Air", country: "Oman", logo: null },
    EK: {
      name: "Emirates",
      country: "United Arab Emirates",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Emirates-Updated-Logo.png",
    },
  };
  const missingAirlines = Object.entries(requiredAirlines)
    .filter(([code]) => definitions.some((list) => list.rows.some((row) => row[2] === code)))
    .filter(([code]) => !airlines.some((airline) => airline.code === code))
    .map(([code, airline]) => ({ code, ...airline, isActive: true }));
  if (missingAirlines.length) {
    await db.insert(masterAirlines).values(missingAirlines);
    airlines = await db.select().from(masterAirlines);
  }

  const airlineByCode = new Map(airlines.map((item) => [item.code, item.id]));
  if (definitions.some((list) => list.rows.some((row) => row[9] === "TIF")) && !airports.some((airport) => airport.code === "TIF")) {
    await db.insert(masterAirports).values({ code: "TIF", name: "Taif International Airport", city: "Taif", country: "Saudi Arabia", isActive: true });
    airports = await db.select().from(masterAirports);
  }
  const airportByCode = new Map(airports.map((item) => [item.code, item.id]));
  if (!airportByCode.get("JED") || !airportByCode.get("MED")) {
    throw new Error("Master bandara JED dan MED wajib tersedia sebelum seed jadwal");
  }

  for (const definition of definitions) {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(packageScheduleLists)
        .where(and(eq(packageScheduleLists.name, definition.name), eq(packageScheduleLists.month, definition.month)))
        .limit(1);
      let listId = existing?.id;
      if (listId && !process.argv.includes("--replace")) {
        console.log(`Preserved existing schedule list: ${definition.name} (${definition.month})`);
        return;
      }
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
  console.log(`Processed ${definitions.length} package schedule lists.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
