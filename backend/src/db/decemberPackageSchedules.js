const makkahComfy = "Azka Al-Safa / Prestige / setaraf";
const makkahMaysan = "Maisyan Al-Mashaer / setaraf";
const makkahSmart = "Winner Inn / Nada Ajyad / setaraf";
const makkahPelataran = "Safwa Tower / Mekkah Tower / setaraf";
const madinahComfy = "Mukhtara / Triple One / setaraf";
const madinahSmart = "ODST / Triple One / setaraf";
const definition = (name, rows, facilities) => ({
  name, month: "2026-12",
  subtitle: "Pilih Jadwal, Hotel & Tipe Kamar Sesuai Kebutuhan Keluarga",
  note: `Fasilitas: ${facilities}. Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum pembayaran.`,
  rows,
});
const specialFacilities = "Cek kesehatan dasar (tensi, gula darah, kolesterol, asam urat), infus vitamin booster++, Ayam Al-Baik 2X, City Tour Thaif + Telefric, Bus Executive, transmitter, manasik 2X, perlengkapan exclusive, nasi mandhi, kereta cepat, Museum Moudi";

// Separate lists retain the brochure's three hotel options without violating
// the existing unique (list, departure date, airline) database constraint.
export const decemberPackageSchedules = [
  definition("PAKET FAMILY SQ SPESIAL - OPSI 1", [
    ["2026-12-03", null, "SV", makkahSmart, madinahSmart, 29.9, 31.9, 33.9],
    ["2026-12-04", null, "SV", makkahSmart, madinahSmart, 29.9, 31.9, 33.9],
  ], specialFacilities),
  definition("PAKET FAMILY SQ SPESIAL - OPSI 2", [
    ["2026-12-03", null, "SV", "Maisyan Al-Mashaer / Prestige / setaraf", madinahSmart, 32.5, 34.5, 37.5],
    ["2026-12-04", null, "SV", "Maisyan Al-Mashaer / Prestige / setaraf", madinahSmart, 32.5, 34.5, 37.5],
  ], specialFacilities),
  definition("PAKET FAMILY SQ SPESIAL - OPSI 3", [
    ["2026-12-03", null, "SV", makkahPelataran, madinahSmart, 34.9, 37.9, 39.9],
  ], specialFacilities),
  definition("PAKET FAMILY SQ SMART LIBURAN", [
    ["2026-12-09", 12, "GA", "Al-Massa Fayzeen / setaraf", madinahComfy, 37.5, 39.5, 42.9],
    ["2026-12-13", null, "WY", makkahSmart, madinahSmart, 31.9, 33.9, 35.9],
    ["2026-12-21", null, "SV", "Al-Massa Fayzeen / setaraf", madinahComfy, 36.9, 38.9, 40.9],
    ["2026-12-22", null, "WY", makkahSmart, madinahSmart, 34.9, 36.9, 39.9],
    ["2026-12-22", null, "SV", makkahSmart, madinahSmart, 36.9, 38.9, 41.9],
    ["2026-12-26", null, "SV", "Al-Massa Fayzeen / setaraf", madinahComfy, 36.9, 38.9, 40.9],
    ["2026-12-26", null, "WY", makkahSmart, madinahSmart, 34.9, 36.9, 39.9, "MED", "TIF"],
  ], "Cek kesehatan dasar (tensi, gula darah, kolesterol, asam urat), infus vitamin booster++, Ayam Al-Baik 2X, City Tour Thaif, transmitter, Bus Executive, manasik 2X, perlengkapan umroh, nasi mandhi, Museum Moudi"),
  definition("PAKET FAMILY SQ COMFY LIBURAN", [
    ["2026-12-07", 9, "GA", makkahComfy, madinahComfy, 37.5, 40.5, 43.5],
    ["2026-12-09", 12, "GA", makkahComfy, madinahComfy, 42.5, 45.5, 48.5],
    ["2026-12-13", 9, "WY", makkahMaysan, madinahSmart, 34.5, 36.5, 38.5],
    ["2026-12-21", 9, "SV", makkahComfy, madinahComfy, 40.9, 43.9, 46.9],
    ["2026-12-22", 9, "WY", makkahMaysan, madinahSmart, 38.9, 41.5, 43.9],
    ["2026-12-22", 9, "SV", "Royal Majestic / setaraf", madinahSmart, 39.9, 42.9, 45.9],
    ["2026-12-26", 9, "SV", makkahComfy, madinahComfy, 40.9, 43.4, 46.9],
    ["2026-12-26", 9, "WY", makkahMaysan, madinahSmart, 39.5, 42, 44.5, "MED", "TIF"],
    ["2026-12-27", 9, "SV", "Snood Ajyad / Anwar Diyafah / setaraf", "Durrat Al Eiman / Arkan Manar / setaraf", 38.9, 40.9, 44.5],
    ["2026-12-31", 9, "GA", makkahComfy, madinahComfy, 40.9, 43.4, 46.9],
  ], "Cek kesehatan dasar (tensi darah dan gula darah), infus vitamin booster"),
  definition("PAKET FAMILY SQ PELATARAN LIBURAN", [
    ["2026-12-07", 9, "GA", makkahPelataran, madinahSmart, 42.9, 45.5, 47.9],
    ["2026-12-13", 9, "WY", makkahPelataran, madinahSmart, 37.4, 39.8, 42.8],
    ["2026-12-21", 9, "SV", makkahPelataran, madinahSmart, 49, 52.5, 57.5],
    ["2026-12-22", 9, "WY", makkahPelataran, madinahSmart, 48, 51.5, 54.9],
    ["2026-12-22", 9, "SV", makkahPelataran, madinahSmart, 48, 51.5, 57.9],
    ["2026-12-26", 9, "SV", makkahPelataran, madinahSmart, 49, 52.5, 57.5],
    ["2026-12-26", 9, "WY", makkahPelataran, madinahSmart, 45.5, 49, 53, "MED", "TIF"],
    ["2026-12-27", 9, "SV", makkahPelataran, madinahSmart, 59, 75.5, 81.5],
    ["2026-12-31", 9, "GA", makkahPelataran, madinahSmart, 49, 52.5, 58.5],
  ], "Cek kesehatan dasar (tensi darah dan gula darah), infus vitamin booster"),
];
