// js/packages-data.js
const WA = "6281255871984";

// Kategori/Tipe Paket dengan Icon
const tipeList = [
  { 
    id: "all", 
    nama: "Semua", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`
  },
  { 
    id: "reguler", 
    nama: "Reguler", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>`
  },
  { 
    id: "extreme", 
    nama: "Extreme", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`
  },
  { 
    id: "semi-mandiri", 
    nama: "Semi Mandiri", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
  },
  { 
    id: "fleksibilitas", 
    nama: "Fleksibel", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
  },
  { 
    id: "konsorsium", 
    nama: "Konsorsium", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
  },
  { 
    id: "la", 
    nama: "Land Arrangement", 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>`
  },
];


// Data Paket
const paket = [
  {
    id: 1,
    nama: "Umroh Sya'ban Plus Awal Ramadhan",
    images: ["./images/paket/xt-1-1.webp", "./images/paket/xt-1-2.webp"],
    tgl: "14-22 Feb 2026",
    hari: 9,
    tipe: "extreme",
    label: "EXTREME",
    labelColor: "bg-gold text-primary",
    hot: false,
    featured: true,
  },
  {
    id: 2,
    nama: "Umroh Plus Hainan",
    images: ["./images/paket/xt-2-1.webp", "./images/paket/xt-2-2.webp"],
    tgl: "15-25 Feb 2026",
    hari: 12,
    tipe: "extreme",
    label: "EXTREME",
    labelColor: "bg-gold text-primary",
    hot: false,
    featured: true,
  },
  {
    id: 3,
    nama: "Umroh Ramadhan 2x Jumat",
    images: ["./images/paket/xt-3-1.webp", "./images/paket/xt-3-2.webp"],
    tgl: "19 Feb - 02 Mar 2026",
    hari: 12,
    tipe: "extreme",
    label: "EXTREME",
    labelColor: "bg-gold text-primary",
    hot: false,
    featured: true,
  },
  {
    id: 4,
    nama: "Umroh Plus City Tour Wisata Halal",
    images: ["./images/paket/xt-4-1.webp", "./images/paket/xt-4-2.webp"],
    tgl: "27 Feb - 10 Mar 2026",
    hari: 13,
    tipe: "extreme",
    label: "EXTREME",
    labelColor: "bg-gold text-primary",
    hot: false,
    featured: true,
  },
  {
    id: 5,
    nama: "Umroh Lebaran Plus Tour Asia Timur",
    images: ["./images/paket/xt-5-1.webp", "./images/paket/xt-5-2.webp"],
    tgl: "17-27 Mar 2026",
    hari: 11,
    tipe: "extreme",
    label: "EXTREME",
    labelColor: "bg-gold text-primary",
    hot: false,
    featured: true,
  },
  {
    id: 6,
    nama: "Umroh Konsorsium Awal Ramadhan Plus Hainan",
    images: ["./images/paket/kons-1-1.webp", "./images/paket/kons-1-2.webp"],
    tgl: "15-25 Feb 2026",
    hari: 12,
    tipe: "konsorsium",
    label: "KONSORSIUM",
    labelColor: "bg-blue-500 text-white",
    hot: "hot",
    featured: false,
  },
  {
    id: 7,
    nama: "Umroh Konsorsium Lebaran di Madinah Plus Tour Asia Timur",
    images: ["./images/paket/kons-2-1.webp", "./images/paket/kons-2-2.webp"],
    tgl: "17-27 Mar 2026",
    hari: 11,
    tipe: "konsorsium",
    label: "KONSORSIUM",
    labelColor: "bg-blue-500 text-white",
    hot: false,
    featured: false,
  },
  {
    id: 8,
    nama: "Umroh Konsorsium Plus City Tour Wisata Halal",
    images: ["./images/paket/kons-3-1.webp", "./images/paket/kons-3-2.webp"],
    tgl: "27 Feb - 10 Mar 2026",
    hari: 13,
    tipe: "konsorsium",
    label: "KONSORSIUM",
    labelColor: "bg-blue-500 text-white",
    hot: false,
    featured: true,
  },
  {
    id: 9,
    nama: "Umroh Konsorsium Ramadhan 2x Jumat",
    images: ["./images/paket/kons-4-1.webp", "./images/paket/kons-4-2.webp"],
    tgl: "19 Feb - 02 Mar 2026",
    hari: 12,
    tipe: "konsorsium",
    label: "KONSORSIUM",
    labelColor: "bg-blue-500 text-white",
    hot: false,
    featured: false,
  },
  {
    id: 10,
    nama: "Umroh Konsorsium Sya'ban Plus Awal Ramadhan",
    images: ["./images/paket/kons-5-1.webp", "./images/paket/kons-5-2.webp"],
    tgl: "14-22 Feb 2026",
    hari: 9,
    tipe: "konsorsium",
    label: "KONSORSIUM",
    labelColor: "bg-blue-500 text-white",
    hot: false,
    featured: false,
  },

  // TAMBAH PAKET BARU DI SINI ⬇️
];

if (typeof window !== "undefined") {
  window.WA = WA;
  window.tipeList = tipeList;
  window.paket = paket;
}
