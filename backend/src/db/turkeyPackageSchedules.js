const sharedSubtitle = "Pilihan Program Umroh Plus Turki Sesuai Jadwal & Tipe Kamar";
const standardNote = "Termasuk cek kesehatan dasar dan infus vitamin booster. Destinasi Turki mengikuti penyesuaian operasional program. Harga dan ketersediaan seat dapat berubah.";
const cappadociaNote = "Termasuk cek kesehatan dasar dan infus vitamin booster. Rangkaian Turki mencakup Istanbul, Bursa, dan Cappadocia. Harga dan ketersediaan seat dapat berubah.";

const define = (name, month, rows, note = standardNote) => ({
  name,
  month,
  subtitle: sharedSubtitle,
  note,
  rows,
});

const primaHotels = [
  "Al-Massa Fayzeen / setaraf",
  "Mukhtara / Triple One / setaraf",
];
const zamrudHotels2026 = [
  "Azka Al-Safa / Prestige / setaraf",
  "Mukhtara / Triple One / setaraf",
];
const zamrudHotels2027 = [
  "Al-Massa Fayzeen / setaraf",
  "Mukhtara / Triple One / setaraf",
];
const istanbulNote = "Hotel Istanbul: Park Inn Radisson / setaraf.";

const row = (date, airline, hotels, prices, note = istanbulNote, duration = 12) => [
  date,
  duration,
  airline,
  hotels[0],
  hotels[1],
  prices[0],
  prices[1],
  prices[2],
  "JED",
  "JED",
  note,
];

export const turkeyPackageSchedules = [
  define("UMROH PLUS TURKI - PROGRAM PRIMA 12D", "2026-10", [
    row("2026-10-19", "EK", primaHotels, [40.5, 42.5, 44.5]),
    row("2026-10-30", "EK", primaHotels, [40.5, 42.5, 44.5]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM PRIMA 12D", "2026-11", [
    row("2026-11-30", "EK", primaHotels, [40.5, 42.5, 44.5]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM PRIMA 12D", "2026-12", [
    row("2026-12-21", "SV", primaHotels, [48.9, 50.4, 52.9]),
    row("2026-12-23", "SV", primaHotels, [48.9, 50.4, 52.9]),
    row("2026-12-25", "SV", primaHotels, [48.9, 50.4, 52.9]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM PRIMA 12D", "2027-01", [
    row("2027-01-16", "EK", primaHotels, [40.5, 42.5, 44.5]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM PRIMA 12D", "2027-03", [
    row("2027-03-13", "EK", primaHotels, [41.5, 43.5, 45.5]),
  ]),

  define("UMROH PLUS TURKI - PROGRAM ZAMRUD 12D", "2026-10", [
    row("2026-10-19", "EK", zamrudHotels2026, [44.9, 47.5, 50.9]),
    row("2026-10-30", "EK", zamrudHotels2026, [44.9, 47.5, 50.9]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM ZAMRUD 12D", "2026-11", [
    row("2026-11-30", "EK", zamrudHotels2026, [44.9, 47.5, 50.9]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM ZAMRUD 12D", "2026-12", [
    row("2026-12-21", "SV", zamrudHotels2026, [52.9, 54.9, 57.4]),
    row("2026-12-23", "SV", zamrudHotels2026, [52.9, 54.9, 57.4]),
    row("2026-12-25", "SV", zamrudHotels2026, [52.9, 54.9, 57.4]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM ZAMRUD 12D", "2027-01", [
    row("2027-01-16", "EK", zamrudHotels2027, [44.9, 47.5, 50.9]),
  ]),
  define("UMROH PLUS TURKI - PROGRAM ZAMRUD 12D", "2027-03", [
    row("2027-03-13", "EK", zamrudHotels2027, [45.9, 48.5, 52.9]),
  ]),

  define("UMROH PLUS TURKI - PROGRAM CAPPADOCIA 16D - OPSI 1", "2026-11", [
    row("2026-11-21", "EK", ["Al-Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf"], [44.5, 46, 48.5], "Hotel Istanbul: Park Inn Radisson / setaraf. Bursa: Celik Palas / setaraf. Cappadocia: Anemon City / setaraf.", 16),
  ], cappadociaNote),
  define("UMROH PLUS TURKI - PROGRAM CAPPADOCIA 16D - OPSI 2", "2026-11", [
    row("2026-11-21", "EK", ["Azka Al-Safa / Maisyan Al-Mashaer / setaraf", "Mukhtara / ODST / setaraf"], [47.9, 49.5, 52.5], "Hotel Istanbul: Park Inn Radisson / setaraf. Bursa: Celik Palas / setaraf. Cappadocia: Anemon City / setaraf.", 16),
  ], cappadociaNote),
  define("UMROH PLUS TURKI - PROGRAM CAPPADOCIA 16D - OPSI 1", "2027-03", [
    row("2027-03-13", "EK", ["Al-Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf"], [44.5, 46, 48.5], "Hotel Istanbul: Park Inn Radisson / setaraf. Bursa: Celik Palas / setaraf. Cappadocia: Anemon City / setaraf.", 16),
  ], cappadociaNote),
  define("UMROH PLUS TURKI - PROGRAM CAPPADOCIA 16D - OPSI 2", "2027-03", [
    row("2027-03-13", "EK", ["Azka Al-Safa / Maysan Al-Mashaer / setaraf", "Mukhtara / ODST / setaraf"], [48.5, 50.5, 53.5], "Hotel Istanbul: Park Inn Radisson / setaraf. Hotel Bursa dan Cappadocia dikonfirmasi melalui admin.", 16),
  ], cappadociaNote),
];
