const month = "2027-03";
const subtitle = "Pilih Jadwal, Hotel & Tipe Kamar Sesuai Kebutuhan Keluarga";
const note = "Harga & ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.";

const definition = (name, rows, extraNote = note) => ({ name, month, subtitle, note: extraNote, rows });
const facilities = (text) => `Fasilitas: ${text}. ${note}`;
const standardCare = facilities("cek kesehatan dasar, cek tensi darah, cek gula darah, dan infus vitamin booster");

export const march2027PackageSchedules = [
  definition("PAKET SPESIAL LEBARAN DI MADINAH - OPSI WINNER INN", [
    ["2027-03-07", 9, "GA", "Winner Inn Ajyad / setaraf", "Mukhtara / ODST / setaraf", 35.9, 37.5, 39.9],
  ]),
  definition("PAKET SPESIAL LEBARAN DI MADINAH - OPSI MAYSAN", [
    ["2027-03-07", 9, "GA", "Maysan Al Mashaer / Azka Al Safa / setaraf", "ODST / Triple One / setaraf", 38.5, 40.5, 42.9],
  ]),
  definition("PAKET SPESIAL LEBARAN DI MADINAH - OPSI SAFWA", [
    ["2027-03-07", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "ODST / Triple One / setaraf", 40.9, 43.5, 46.9],
  ]),
  definition("PAKET TAKBIRAN DI MAKKAH - OPSI 1", [
    ["2027-03-07", 9, "GA", "Al Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 35.5, 37, 39.5],
    ["2027-03-08", 9, "SV", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 34.9, 36.5, 38.9],
  ]),
  definition("PAKET TAKBIRAN DI MAKKAH - OPSI 2", [
    ["2027-03-08", 9, "GA", "Maysan Al Mashaer / Azka Al Safa / setaraf", "ODST / Triple One / setaraf", 37.5, 39.5, 41.9],
    ["2027-03-07", 9, "GA", "Maysan Al Mashaer / Azka Al Safa / setaraf", "ODST / Triple One / setaraf", 39.5, 41.5, 44],
  ]),
  definition("PAKET TAKBIRAN DI MAKKAH - OPSI 3", [
    ["2027-03-08", 9, "SV", "Safwa Tower / Makkah Tower / setaraf", "ODST / Triple One / setaraf", 39.9, 42.5, 45.9],
    ["2027-03-08", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "Mukhtara / ODST / setaraf", 43.9, 46.5, 49.9],
  ]),
  definition("PAKET TAKBIRAN DI MAKKAH - OPSI PREMIUM", [
    ["2027-03-08", 9, "GA", "Marwa Rotana / Swissotel / setaraf", "Millenium AlAqeeq / setaraf", 49.9, 52.9, 57.5],
  ]),
  definition("PAKET COMFY I'TIKAF MADINAH", [
    ["2027-03-03", 12, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 44.5, 47.5, 53.5],
    ["2027-03-04", 12, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 43.5, 46.5, 52.5],
    ["2027-03-05", 12, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 46.5, 49.5, 55.5],
    ["2027-03-06", 12, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 43.5, 46.5, 52.5],
  ],
    standardCare,
  ),
  definition("PAKET COMFY I'TIKAF MADINAH - OPSI AZKA", [
    ["2027-03-06", 12, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 46.5, 49.5, 55.5],
  ], standardCare),
  definition("PAKET I'TIKAF MADINAH PELATARAN - OPSI 1", [
    ["2027-03-03", 12, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 47.9, 51.9, 58.9],
    ["2027-03-04", 12, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 46.9, 50.9, 57.9],
    ["2027-03-05", 12, "GA", "Safwa Tower / Mekkah Tower / setaraf", "ODST / Triple One / setaraf", 47.9, 50.9, 57.9],
  ], facilities("program pelataran dengan estimasi 3–5 menit jalan kaki dari hotel ke pelataran Masjid")),
  definition("PAKET I'TIKAF MADINAH PELATARAN - OPSI 2", [
    ["2027-03-04", 12, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 49.5, 53.5, 59.5],
    ["2027-03-05", 12, "GA", "Safwa Tower / Mekkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 50.5, 54.5, 60.5],
    ["2027-03-05", 12, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Millenium AlAqeeq / setaraf", 57.5, 62.9, 69.5],
    ["2027-03-06", 12, "SV", "Safwa Tower / Mekkah Tower / setaraf", "Millenium AlAqeeq / setaraf", 56.5, 61.9, 65.5],
  ], facilities("program pelataran dengan estimasi 3–5 menit jalan kaki dari hotel ke pelataran Masjid")),
  definition("PAKET SYAWAL MUBARAK 12 HARI - OPSI AL MASSA", [
    ["2027-03-11", 12, "GA", "Al Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 35.5, 37.5, 40],
    ["2027-03-14", 12, "GA", "Al Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 35.5, 37.5, 40],
  ]),
  definition("PAKET SYAWAL MUBARAK 12 HARI - OPSI WINNER INN", [
    ["2027-03-11", 12, "GA", "Winner Inn Ajyad / setaraf", "ODST / Triple One / setaraf", 32.9, 34.9, 37.9],
    ["2027-03-13", 12, "GA", "Winner Inn Ajyad / setaraf", "ODST / Triple One / setaraf", 32.9, 34.9, 37.9],
  ]),
  definition("PAKET SYAWAL MUBARAK ZAMRUD & MUMTAZ 12 HARI - OPSI GARUDA", [
    ["2027-03-11", 12, "GA", "Azka Al Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 40.5, 43, 46.5],
    ["2027-03-14", 12, "GA", "Azka Al Safa / Prestige / setaraf", "Mukhtara / Triple One / setaraf", 40.5, 43, 46.5],
  ]),
  definition("PAKET SYAWAL MUBARAK ZAMRUD & MUMTAZ 12 HARI - OPSI OMAN AIR", [
    ["2027-03-11", 12, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 35.9, 38.5, 42.9],
    ["2027-03-13", 12, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 35.9, 38.5, 42.9],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI WINNER INN", [
    ["2027-03-18", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.4, 34.4],
    ["2027-03-19", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.4, 34.4],
    ["2027-03-20", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.4, 34.4],
    ["2027-03-21", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.4, 34.4],
    ["2027-03-22", 9, "GA", "Winner Inn / Nada Ajyad / setaraf", "ODST / Triple One / setaraf", 30.9, 32.4, 34.4],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI PRIMA", [
    ["2027-03-18", 9, "GA", "Al-Maida Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 33.5, 35, 37.5],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI COMFY", [
    ["2027-03-11", 9, "GA", "Al Massa Fayzeen / setaraf", "Mukhtara / ODST / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-12", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-13", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-14", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 39.9, 35.9, 37.9],
    ["2027-03-15", 9, "GA", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI SMART", [
    ["2027-03-11", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39.5, 42],
    ["2027-03-13", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
    ["2027-03-14", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
    ["2027-03-15", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
    ["2027-03-16", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI OMAN AIR", [
    ["2027-03-16", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-17", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-18", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-19", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-20", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
    ["2027-03-21", 9, "WY", "Maysan Al Mashaer / Prestige / setaraf", "ODST / Triple One / setaraf", 33.9, 35.9, 37.9],
  ]),
  definition("PAKET SYAWAL MUBARAK 9 HARI - OPSI GARUDA AZKA", [
    ["2027-03-17", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
    ["2027-03-18", 9, "GA", "Azka Al Safa / Maysan Al Mashaer / setaraf", "Mukhtara / ODST / setaraf", 37.5, 39, 42],
  ]),
  definition("PAKET RUBY & DIAMOND SYAWAL MUBARAK PELATARAN", [
    ["2027-03-11", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44.4, 46.9],
    ["2027-03-13", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44, 46.9],
    ["2027-03-14", 9, "GA", "Marwa Rotana / Swissotel / setaraf", "Millennium Al Aqeeq / setaraf", 47.9, 50, 55.5],
    ["2027-03-15", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44, 46.9],
    ["2027-03-16", 9, "GA", "Marwa Rotana / Swissotel / setaraf", "Millennium Al Aqeeq / setaraf", 47.9, 50, 55.5],
    ["2027-03-17", 9, "GA", "Safwa Tower / Makkah Tower / setaraf", "Mukhtara / Triple One / setaraf", 41.9, 44, 46.9],
    ["2027-03-18", 9, "GA", "Marwa Rotana / Swissotel / setaraf", "Millennium Al Aqeeq / setaraf", 47.9, 50, 55.5],
  ]),
];
