const healthFacilities = [
  "Cek kesehatan dasar: pemeriksaan tensi darah",
  "Cek kesehatan dasar: pemeriksaan gula darah",
  "Infus vitamin booster (immune booster)",
];

export const packageDetailDrafts = [
  {
    code: "SQ-DXB-MHB-20261114",
    name: "Umroh Plus Dubai Program Mahabbah 12 Hari",
    description: "Program Umroh Plus Dubai selama 12 hari dengan penerbangan Emirates, dua pilihan akomodasi Makkah, serta rangkaian pengalaman wisata Dubai setelah agenda ibadah.",
    departureDate: "2026-11-14",
    returnDate: "2026-11-25",
    duration: 12,
    airlineCode: "EK",
    arrivalAirportCode: "JED",
    returnAirportCode: "JED",
    facilities: [
      ...healthFacilities,
      "Hotel Madinah: ODST / Triple / setaraf",
      "Hotel Dubai: Grand Kingsgate Hotel Waterfront",
      "Program Dubai: Dubai Frame, Museum of the Future, Atlantis Hotel, Jumeirah Beach, Burj Al Arab, dan Burj Khalifa",
      "Desert experience: Desert Safari, Dune Bashing, Camel Ride, dan BBQ Dinner",
    ],
    notes: [
      "Draft paket: jumlah seat, itinerary harian, gambar, syarat pendaftaran, biaya di luar paket, dan ketentuan final perlu dilengkapi admin sebelum publikasi",
      "Harga dan susunan program mengikuti materi awal dan dapat berubah setelah konfirmasi operasional",
    ],
    options: [
      {
        name: "Opsi 1 - Winner Inn / Nada Ajyad",
        priceQuad: 37.9,
        priceTriple: 39.9,
        priceDouble: 42.9,
      },
      {
        name: "Opsi 2 - Azka Al-Safa / Maysan Al-Mashaer",
        priceQuad: 39.9,
        priceTriple: 42.9,
        priceDouble: 44.9,
      },
    ],
  },
  {
    code: "SQ-TRK-PRM-20261030",
    name: "Umroh Plus Turki Program Prima 12 Hari",
    description: "Program Umroh Plus Turki selama 12 hari dengan penerbangan Emirates, perjalanan ibadah di Makkah dan Madinah, serta kunjungan ke sejumlah destinasi utama Istanbul.",
    departureDate: "2026-10-30",
    returnDate: "2026-11-10",
    duration: 12,
    airlineCode: "EK",
    arrivalAirportCode: "JED",
    returnAirportCode: "JED",
    facilities: [
      ...healthFacilities,
      "Hotel Makkah: Al-Massa Fayzeen / setaraf",
      "Hotel Madinah: Mukhtara / Triple One / setaraf",
      "Hotel Istanbul: Park Inn Radisson / setaraf",
      "Program Turki: Hagia Sophia, Emirgan Park Tulip, Masjid Abu Ayub, Bosphorus Private Cruise, Masjid Ulucami, Tophane Garden, Blue Mosque, Hippodrome Area, Topkapi Palace Museum, dan Grand Bazaar",
    ],
    notes: [
      "Draft paket: jumlah seat, itinerary harian, gambar, syarat pendaftaran, biaya di luar paket, dan ketentuan final perlu dilengkapi admin sebelum publikasi",
      "Harga dan susunan program mengikuti materi awal dan dapat berubah setelah konfirmasi operasional",
    ],
    options: [
      {
        name: "Pilihan Utama - Al-Massa Fayzeen",
        priceQuad: 40.5,
        priceTriple: 42.5,
        priceDouble: 44.5,
      },
    ],
  },
];
