const month = "2027-02";
const subtitle = "Pilih Jadwal, Hotel & Tipe Kamar Sesuai Kebutuhan Keluarga";
const note = "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.";

const definition = (name, rows, extraNote = note) => ({
  name,
  month,
  subtitle,
  note: extraNote,
  rows,
});

const facilities = (items) => `Fasilitas: ${items}. ${note}`;

const itikafFacilities = facilities(
  "cek kesehatan dasar, cek tensi darah, cek gula darah, infus vitamin booster, Ayam Al-Baik 2x, perlengkapan umroh, bus executive, Thaif, manasik 2x, nasi Mandhi, transmitter, dan Museum Al Moudi",
);

export const february2027PackageSchedules = [
  definition(
    "PAKET SMART I'TIKAF MEKKAH",
    [
      ["2027-02-24", 16, "WY", "Fajr Badea 4 / Mahter / Al-Jiwar / setaraf", "ODST / Triple One / setaraf", 43.9, 47.9, 56.5],
      ["2027-02-25", 16, "GA", "Fajr Badea 4 / Mahter / Al-Jiwar / setaraf", "Mukhtara / Triple One / setaraf", 48.9, 53.9, 60.9],
      ["2027-02-25", 16, "SV", "Fajr Badea 4 / Mahter / Al-Jiwar / setaraf", "ODST / Triple One / setaraf", 47.9, 52.9, 59.9],
      ["2027-02-25", 16, "WY", "Fajr Badea 4 / Mahter / Al-Jiwar / setaraf", "ODST / Triple One / setaraf", 43.9, 47.9, 56.5],
      ["2027-02-28", 17, "WY", "Fajr Badea 4 / Mahter / Al-Jiwar / setaraf", "ODST / Triple One / setaraf", 45.9, 49.9, 58.5],
    ],
    itikafFacilities,
  ),
  definition(
    "PAKET RAMADHAN PELATARAN",
    [
      ["2027-02-03", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / setaraf", 44.5, 50, 54.5],
      ["2027-02-04", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / setaraf", 44.5, 50, 54.5],
      ["2027-02-05", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / ODST / setaraf", 54.5, 58.5, 62.5],
      ["2027-02-06", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 45.5, 51, 55.5],
      ["2027-02-07", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / ODST / setaraf", 61.5, 65, 69.5, "MED", "JED"],
    ],
    facilities("cek tensi darah, cek gula darah, cek kolesterol, cek asam urat, infus vitamin booster++, Ayam Al-Baik 2x, Thaif + Teleferic, transmitter, perlengkapan executive, nasi Mandhi, kereta cepat, Museum Moudi, manasik 2x, dan bus executive"),
  ),
  definition(
    "PAKET I'TIKAF MEKKAH PELATARAN",
    [
      ["2027-02-24", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 102.9, 117.9, 142.9],
      ["2027-02-28", 9, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 100.9, 115.9, 140.9],
    ],
    facilities("program pelataran dengan estimasi 3–5 menit jalan kaki dari hotel ke pelataran Masjid"),
  ),
  definition(
    "PAKET COMFY I'TIKAF MEKKAH - OPSI MAYSAN",
    [
      ["2027-02-24", 9, "WY", "Maysan Al Mashaer / Azka Al Safa / setaraf", "ODST / Triple One / setaraf", 67.9, 76.9, 90.9],
      ["2027-02-28", 9, "WY", "Maysan Al Mashaer / Azka Al Safa / setaraf", "ODST / Triple One / setaraf", 65.9, 74.9, 88.9],
    ],
    itikafFacilities,
  ),
  definition(
    "PAKET COMFY I'TIKAF MEKKAH - OPSI SNOOD",
    [
      ["2027-02-24", 9, "WY", "Snood / Grand Al Massa / setaraf", "ODST / Triple One / setaraf", 54.9, 61.9, 76.9],
      ["2027-02-25", 9, "WY", "Snood / Grand Al Massa / setaraf", "ODST / Triple One / setaraf", 54.9, 61.9, 76.9],
      ["2027-02-28", 17, "WY", "Snood / Grand Al Massa / Prestige / setaraf", "ODST / Triple One / setaraf", 56.9, 63.9, 78.9],
    ],
    itikafFacilities,
  ),
  definition(
    "PAKET RAMADAN COMFY - OPSI MAYSAN",
    [
      ["2027-02-03", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 38.5, 41.5, 44],
      ["2027-02-04", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 38.5, 42.1, 44],
      ["2027-02-06", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 39.5, 41.5, 45],
      ["2027-02-07", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 39.5, 42.5, 45],
      ["2027-02-08", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 39.5, 42, 45],
    ],
    facilities("cek kesehatan dasar, cek tensi darah, cek gula darah, dan infus vitamin booster"),
  ),
  definition(
    "PAKET RAMADAN COMFY - OPSI AZKA",
    [
      ["2027-02-04", 9, "GA", "Azka Al Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 42.5, 45.1, 49.1],
      ["2027-02-06", 9, "GA", "Azka Al Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 43.9, 46.5, 50.9],
      ["2027-02-07", 9, "GA", "Azka Al Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 44.9, 44.9, 51.9],
    ],
    facilities("cek kesehatan dasar, cek tensi darah, cek gula darah, dan infus vitamin booster"),
  ),
  definition(
    "PAKET RAMADAN SMART - OPSI WINNER INN",
    [
      ["2027-02-03", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 33.5, 36, 38],
      ["2027-02-04", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 33.5, 36, 38],
      ["2027-02-06", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 34.5, 37, 39],
      ["2027-02-07", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 34.5, 37, 39],
      ["2027-02-08", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 34.5, 37, 39],
      ["2027-02-21", 9, "GA", "Nada Ajyad / setaraf", "ODST / setaraf", 32.7, 34.6, 37.7],
    ],
    facilities("cek kesehatan dasar, cek tensi darah, cek gula darah, Ayam Al-Baik, perlengkapan umroh, bus executive, nasi Mandhi, Museum Al Moudi, transmitter, Thaif, dan manasik 2x"),
  ),
  definition(
    "PAKET RAMADAN SMART - OPSI AL-MASSA",
    [
      ["2027-02-04", 9, "WY", "Al-Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 36.5, 38.6, 41.5],
      ["2027-02-06", 9, "WY", "Al-Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 37.9, 40.4, 43.4],
    ],
    facilities("cek kesehatan dasar, cek tensi darah, cek gula darah, Ayam Al-Baik, perlengkapan umroh, bus executive, nasi Mandhi, Museum Al Moudi, transmitter, Thaif, dan manasik 2x"),
  ),
];
