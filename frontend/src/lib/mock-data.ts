// src/lib/mock-data.ts

export interface Package {
  id: number;
  code: string;
  name: string;
  type: "UMRAH" | "UMRAH_PLUS" | "UMRAH_RAMADHAN";
  duration: number;
  departureDate: string;
  returnDate: string;
  airline: { name: string; logo?: string };
  hotelMakkah: {
    name: string;
    starRating: number;
    distanceToHaram?: string;
    facilities?: string[];
  };
  hotelMadinah?: {
    name: string;
    starRating: number;
    distanceToMasjid?: string;
    facilities?: string[];
  };
  priceQuad: string;
  priceTriple?: string;
  priceDouble: string;
  totalSeats: number;
  bookedSeats: number;
  image: string;
  gallery?: string[];
  featured: boolean;
  description?: string;
  included?: string[];
  excluded?: string[];
  itinerary?: {
    day: number;
    title: string;
    activities: string[];
  }[];
  documents?: string[];
  terms?: string[];
}

export const mockPackages: Package[] = [
  {
    id: 1,
    code: "UMR-RAM-2024",
    name: "Umroh Ramadhan 2024 Premium",
    type: "UMRAH_RAMADHAN",
    duration: 9,
    departureDate: "2024-03-10",
    returnDate: "2024-03-18",
    airline: { name: "Garuda Indonesia" },
    hotelMakkah: {
      name: "Fairmont Makkah Clock Royal Tower",
      starRating: 5,
      distanceToHaram: "100m (Walking Distance)",
      facilities: ["WiFi", "AC", "Breakfast", "City View"],
    },
    hotelMadinah: {
      name: "Anwar Al Madinah Movenpick",
      starRating: 5,
      distanceToMasjid: "200m (Walking Distance)",
      facilities: ["WiFi", "AC", "Breakfast", "Pool"],
    },
    priceQuad: "25000000",
    priceTriple: "27000000",
    priceDouble: "30000000",
    totalSeats: 45,
    bookedSeats: 38,
    image:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80",
      "https://images.unsplash.com/photo-1564769610819-790a44eac2e8?w=800&q=80",
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
    ],
    featured: true,
    description:
      "Nikmati ibadah umroh di bulan suci Ramadhan dengan fasilitas hotel bintang 5 yang sangat dekat dengan Masjidil Haram dan Masjid Nabawi. Paket ini dirancang khusus untuk memberikan kenyamanan maksimal dalam beribadah.",
    included: [
      "Tiket pesawat PP Jakarta - Jeddah (Garuda Indonesia)",
      "Visa Umroh",
      "Hotel Bintang 5 di Makkah (7 malam)",
      "Hotel Bintang 5 di Madinah (2 malam)",
      "Makan 3x sehari (prasmanan)",
      "Bus AC pariwisata",
      "Air Zam-zam 5 liter",
      "Perlengkapan ibadah (mukena, koper)",
      "Manasik umroh",
      "Tour leader berpengalaman",
      "City tour Makkah & Madinah",
    ],
    excluded: [
      "Pengeluaran pribadi",
      "Tips guide & driver (optional)",
      "Excess baggage",
      "Upgrade room",
    ],
    itinerary: [
      {
        day: 1,
        title: "Keberangkatan Jakarta - Jeddah",
        activities: [
          "07:00 - Berkumpul di Bandara Soekarno-Hatta Terminal 3",
          "10:00 - Penerbangan menuju Jeddah (Garuda Indonesia)",
          "16:00 - Tiba di Bandara King Abdulaziz, Jeddah",
          "18:00 - Perjalanan menuju Madinah (bus AC)",
          "22:00 - Check-in hotel & istirahat",
        ],
      },
      {
        day: 2,
        title: "Madinah - Ziarah & Ibadah",
        activities: [
          "05:00 - Sholat Subuh di Masjid Nabawi",
          "08:00 - Sarapan di hotel",
          "09:00 - Ziarah ke Raudhah",
          "12:00 - Sholat Dzuhur berjamaah",
          "14:00 - City tour Madinah (Jabal Uhud, Kebun Kurma)",
          "18:00 - Sholat Maghrib & Isya di Masjid Nabawi",
        ],
      },
      {
        day: 3,
        title: "Madinah - Makkah",
        activities: [
          "05:00 - Sholat Subuh di Masjid Nabawi",
          "08:00 - Sarapan & check-out hotel",
          "09:00 - Perjalanan menuju Makkah",
          "14:00 - Tiba di Makkah, check-in hotel",
          "16:00 - Umroh pertama (Thawaf, Sa'i, Tahallul)",
          "20:00 - Istirahat",
        ],
      },
      {
        day: 4,
        title: "Makkah - Ibadah Bebas",
        activities: [
          "Free program - Ibadah di Masjidil Haram",
          "Thawaf sunnah",
          "Sholat berjamaah",
          "Berdoa di Multazam",
        ],
      },
      {
        day: 5,
        title: "Makkah - City Tour",
        activities: [
          "09:00 - City tour Makkah",
          "Ziarah ke Jabal Rahmah",
          "Kunjungan ke Gua Hira",
          "Belanja oleh-oleh di Abraj Al Bait Mall",
        ],
      },
      {
        day: 6,
        title: "Makkah - Ibadah Bebas",
        activities: ["Free program - Perbanyak ibadah di Masjidil Haram"],
      },
      {
        day: 7,
        title: "Makkah - Ibadah Bebas",
        activities: ["Free program - Persiapan kepulangan"],
      },
      {
        day: 8,
        title: "Makkah - Jeddah",
        activities: [
          "05:00 - Sholat Subuh & thawaf wada",
          "08:00 - Check-out hotel",
          "09:00 - Perjalanan ke Jeddah",
          "12:00 - Shopping di Jeddah (Red Sea Mall)",
          "18:00 - Menuju bandara",
          "22:00 - Penerbangan kembali ke Jakarta",
        ],
      },
      {
        day: 9,
        title: "Tiba di Jakarta",
        activities: [
          "14:00 - Tiba di Bandara Soekarno-Hatta",
          "Program selesai",
        ],
      },
    ],
    documents: [
      "Paspor (min. 7 bulan masa berlaku)",
      "KTP",
      "Kartu Keluarga",
      "Foto 4x6 (latar belakang putih, 80% wajah)",
      "Buku nikah (untuk pasangan)",
      "Surat mahram (untuk wanita di bawah 45 tahun)",
    ],
    terms: [
      "DP minimal 30% dari total biaya",
      "Pelunasan H-30 hari sebelum keberangkatan",
      "Pembatalan H-30 hari: DP hangus",
      "Pembatalan H-15 hari: 50% dari total biaya",
      "Pembatalan H-7 hari: 100% dari total biaya",
      "Harga sewaktu-waktu dapat berubah",
    ],
  },
  {
    id: 2,
    code: "UMR-PLUS-TRK",
    name: "Umroh Plus Turki - Explore Istanbul",
    type: "UMRAH_PLUS",
    duration: 12,
    departureDate: "2024-04-15",
    returnDate: "2024-04-26",
    airline: { name: "Saudia Airlines" },
    hotelMakkah: {
      name: "Pullman ZamZam Makkah",
      starRating: 5,
      distanceToHaram: "50m (Walking Distance)",
      facilities: ["WiFi", "AC", "Breakfast", "Haram View"],
    },
    hotelMadinah: {
      name: "Pullman ZamZam Madinah",
      starRating: 5,
      distanceToMasjid: "100m (Walking Distance)",
      facilities: ["WiFi", "AC", "Breakfast", "City View"],
    },
    priceQuad: "35000000",
    priceTriple: "38000000",
    priceDouble: "42000000",
    totalSeats: 40,
    bookedSeats: 25,
    image:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
      "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80",
      "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80",
    ],
    featured: false,
    description:
      "Paket umroh plus wisata Turki yang menggabungkan ibadah umroh dengan eksplorasi kota Istanbul yang memukau. Kunjungi masjid-masjid bersejarah dan nikmati keindahan Bosphorus.",
    included: [
      "Tiket pesawat PP Jakarta - Jeddah - Istanbul (Saudia Airlines)",
      "Visa Umroh & Visa Turki",
      "Hotel Bintang 5 di Makkah, Madinah & Istanbul",
      "Makan 3x sehari",
      "Tour Turki (Blue Mosque, Hagia Sophia, Topkapi Palace)",
      "Bosphorus Cruise",
      "Air Zam-zam 5 liter",
      "City tour lengkap",
    ],
    excluded: [
      "Pengeluaran pribadi",
      "Tips guide & driver",
      "Entrance fee optional tour",
    ],
    itinerary: [
      {
        day: 1,
        title: "Jakarta - Jeddah",
        activities: ["Keberangkatan dari Jakarta menuju Jeddah"],
      },
      {
        day: 2,
        title: "Jeddah - Madinah",
        activities: ["Perjalanan ke Madinah", "Check-in hotel"],
      },
      {
        day: 3,
        title: "Madinah - Ibadah",
        activities: ["Ibadah di Masjid Nabawi", "Ziarah"],
      },
      {
        day: 4,
        title: "Madinah - Makkah",
        activities: ["Perjalanan ke Makkah", "Umroh pertama"],
      },
      {
        day: 5,
        title: "Makkah - Ibadah Bebas",
        activities: ["Free program di Masjidil Haram"],
      },
      {
        day: 6,
        title: "Makkah - Ibadah Bebas",
        activities: ["Free program di Masjidil Haram"],
      },
      {
        day: 7,
        title: "Makkah - Istanbul",
        activities: ["Penerbangan ke Istanbul", "City tour"],
      },
      {
        day: 8,
        title: "Istanbul - Tour",
        activities: ["Blue Mosque", "Hagia Sophia", "Topkapi Palace"],
      },
      {
        day: 9,
        title: "Istanbul - Bosphorus",
        activities: ["Bosphorus Cruise", "Shopping"],
      },
      {
        day: 10,
        title: "Istanbul - Jakarta",
        activities: ["Penerbangan kembali ke Jakarta"],
      },
      {
        day: 11,
        title: "Transit",
        activities: ["Transit"],
      },
      {
        day: 12,
        title: "Tiba di Jakarta",
        activities: ["Tiba di Jakarta"],
      },
    ],
    documents: [
      "Paspor (min. 7 bulan)",
      "KTP & KK",
      "Foto 4x6",
      "Buku nikah",
      "Surat keterangan kerja (untuk visa Turki)",
    ],
    terms: [
      "DP 40% dari total biaya",
      "Pelunasan H-45 hari",
      "Berlaku kebijakan pembatalan normal",
    ],
  },
  {
    id: 3,
    code: "UMR-HMT-2024",
    name: "Umroh Hemat - Berkah Bersama Keluarga",
    type: "UMRAH",
    duration: 9,
    departureDate: "2024-05-20",
    returnDate: "2024-05-28",
    airline: { name: "Lion Air" },
    hotelMakkah: {
      name: "Swiss Hotel Makkah",
      starRating: 4,
      distanceToHaram: "800m (Shuttle Bus)",
      facilities: ["WiFi", "AC", "Breakfast"],
    },
    hotelMadinah: {
      name: "Al Aqeeq Hotel",
      starRating: 4,
      distanceToMasjid: "1km (Shuttle Bus)",
      facilities: ["WiFi", "AC", "Breakfast"],
    },
    priceQuad: "18000000",
    priceTriple: "20000000",
    priceDouble: "23000000",
    totalSeats: 45,
    bookedSeats: 12,
    image:
      "https://images.unsplash.com/photo-1564769610819-790a44eac2e8?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1564769610819-790a44eac2e8?w=800&q=80",
    ],
    featured: false,
    description:
      "Paket umroh ekonomis dengan fasilitas yang tetap nyaman. Cocok untuk keluarga yang ingin beribadah umroh dengan budget terjangkau.",
    included: [
      "Tiket pesawat PP Jakarta - Jeddah (Lion Air)",
      "Visa Umroh",
      "Hotel bintang 4 di Makkah & Madinah",
      "Makan 3x sehari",
      "Transportasi shuttle bus",
      "Air Zam-zam 5 liter",
      "Manasik umroh",
    ],
    excluded: ["Pengeluaran pribadi", "Tips guide & driver"],
    itinerary: [
      {
        day: 1,
        title: "Keberangkatan Jakarta - Jeddah",
        activities: ["Berangkat dari Jakarta"],
      },
      {
        day: 2,
        title: "Jeddah - Madinah",
        activities: ["Perjalanan ke Madinah"],
      },
      {
        day: 3,
        title: "Madinah - Ibadah",
        activities: ["Ibadah di Masjid Nabawi"],
      },
      {
        day: 4,
        title: "Madinah - Makkah",
        activities: ["Perjalanan ke Makkah", "Umroh"],
      },
      {
        day: 5,
        title: "Makkah - Ibadah",
        activities: ["Free program"],
      },
      {
        day: 6,
        title: "Makkah - Ibadah",
        activities: ["Free program"],
      },
      {
        day: 7,
        title: "Makkah - Ibadah",
        activities: ["Free program"],
      },
      {
        day: 8,
        title: "Makkah - Jakarta",
        activities: ["Thawaf wada", "Penerbangan ke Jakarta"],
      },
      {
        day: 9,
        title: "Tiba di Jakarta",
        activities: ["Tiba di Jakarta"],
      },
    ],
    documents: ["Paspor", "KTP", "KK", "Foto"],
    terms: ["DP 30%", "Pelunasan H-30"],
  },
];

// Helper functions
export const getPackageById = (id: number): Package | undefined => {
  return mockPackages.find((pkg) => pkg.id === id);
};

export const getFeaturedPackages = (): Package[] => {
  return mockPackages.filter((pkg) => pkg.featured);
};

export const filterPackages = (filters: {
  type?: string;
  month?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}): Package[] => {
  return mockPackages.filter((pkg) => {
    if (filters.type && pkg.type !== filters.type) return false;

    if (filters.month) {
      const pkgMonth = new Date(pkg.departureDate).getMonth() + 1;
      if (pkgMonth !== parseInt(filters.month)) return false;
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!pkg.name.toLowerCase().includes(search)) return false;
    }

    const price = parseInt(pkg.priceQuad);
    if (filters.minPrice && price < filters.minPrice) return false;
    if (filters.maxPrice && price > filters.maxPrice) return false;

    return true;
  });
};
