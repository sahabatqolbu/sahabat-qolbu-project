const subtitle = "Pilihan Program Umroh Plus Dubai Sesuai Hotel & Tipe Kamar";
const note = "Termasuk cek kesehatan dasar dan infus vitamin booster. Destinasi Dubai mencakup city tour dan desert experience mengikuti penyesuaian operasional program. Harga dan ketersediaan seat dapat berubah.";
const madinahHotel = "ODST / Triple / setaraf";
const dubaiHotelNote = "Hotel Dubai: Grand Kingsgate Hotel Waterfront.";

const row = (departureDate, makkahHotel, prices) => [
  departureDate,
  12,
  "EK",
  makkahHotel,
  madinahHotel,
  prices[0],
  prices[1],
  prices[2],
  "JED",
  "JED",
  dubaiHotelNote,
];

const define = (month, option, rows) => ({
  name: `UMROH PLUS DUBAI - PROGRAM MAHABBAH 12D - OPSI ${option}`,
  month,
  subtitle,
  note,
  rows,
});

export const dubaiPackageSchedules = [
  define("2026-11", 1, [
    row("2026-11-14", "Winner Inn / Nada Ajyad / setaraf", [37.9, 39.9, 42.9]),
  ]),
  define("2026-11", 2, [
    row("2026-11-14", "Azka Al-Safa / Maysan Al-Mashaer / setaraf", [39.9, 42.9, 44.9]),
  ]),
  define("2027-01", 1, [
    row("2027-01-06", "Winner Inn / Nada Ajyad / setaraf", [37.9, 39.9, 42.9]),
  ]),
  define("2027-01", 2, [
    row("2027-01-06", "Azka Al-Safa / Maysan Al-Mashaer / setaraf", [39.9, 42.9, 44.9]),
  ]),
];
