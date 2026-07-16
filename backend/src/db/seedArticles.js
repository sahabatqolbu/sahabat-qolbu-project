import dotenv from "dotenv";
dotenv.config();

import { eq, like, or } from "drizzle-orm";
import { db } from "./index.js";
import { articles, masterHotels } from "./schema.js";

const now = () => new Date();

const sajaContent = `## Mengapa SAJA by Warwick Makkah Menarik untuk Jamaah Umroh?

SAJA by Warwick Makkah Hotel adalah pilihan yang menarik untuk jamaah yang ingin menginap di area Kudai / Al Misfalah dengan fasilitas besar, kamar lapang, dan akses shuttle menuju Masjidil Haram. Secara kelas, hotel ini dikenal sebagai hotel bintang 3, tetapi banyak bagian bangunannya terasa lebih luas karena sejarah gedungnya yang dulu berada dalam kompleks Le Meridien Towers Makkah.

Keunggulan utamanya ada pada kombinasi harga yang lebih rasional, kapasitas kamar besar, lobi luas, dan sistem transportasi shuttle yang membantu jamaah tetap mudah menuju area Haram tanpa harus selalu bergantung pada taksi.

## Lokasi dan Akses ke Masjidil Haram

Hotel ini berada di area Kudai / Al Misfalah dan terhubung dengan jalur shuttle melalui Terowongan Al Kidwah. Dalam kondisi normal, shuttle hotel membawa jamaah menuju Stasiun Kudi, lalu jamaah berjalan kaki menuju area Clock Tower dan Gerbang King Fahd.

Untuk jamaah rombongan, akses seperti ini cukup membantu karena pergerakan lebih terarah. Namun khusus hari Jumat, jamaah perlu memperhatikan aturan penutupan terowongan pada jam tertentu, sehingga keberangkatan salat Jumat sebaiknya diatur lebih awal.

## Kamar yang Luas untuk Keluarga dan Rombongan

Salah satu alasan SAJA by Warwick Makkah cukup disukai adalah ukuran kamarnya yang lega. Tipe kamar seperti Superior, Deluxe, Diplomatic Room, Executive Suite, hingga Royal Suite memberi pilihan yang fleksibel untuk pasangan, keluarga kecil, maupun rombongan keluarga besar.

- Diplomatic Room cocok untuk jamaah yang ingin kamar nyaman dengan fasilitas utama lengkap.
- Executive Suite memberi ruang tamu terpisah dan dapur kecil.
- Royal Suite cocok untuk keluarga besar karena tersedia pilihan unit yang lebih luas.
- Beberapa kamar memiliki pemandangan kota atau pegunungan Makkah.

## Fasilitas yang Membantu Ibadah

Selain kamar dan shuttle, hotel ini memiliki fasilitas pendukung seperti restoran utama, lobby cafe, layanan kamar, dan musala internal. Untuk jamaah lansia atau jamaah yang sedang kelelahan setelah rangkaian ibadah, keberadaan area salat internal bisa menjadi nilai tambah.

Hotel ini juga dikenal memiliki program ziarah gratis pada hari tertentu, seperti kunjungan ke Jabal Al Noor, Jabal Thawr, Arafah, Muzdalifah, dan Mina. Program seperti ini menjadi nilai tambah bagi jamaah yang ingin mengenal sejarah perjalanan ibadah dengan lebih dekat.

## Cocok untuk Siapa?

SAJA by Warwick Makkah cocok untuk jamaah yang mencari hotel Makkah dengan kamar lega, akses shuttle yang jelas, dan fasilitas yang terasa lebih besar dari hotel budget biasa. Hotel ini bukan pilihan paling dekat untuk berjalan kaki langsung ke Haram, tetapi sangat masuk akal untuk paket umroh yang ingin menjaga keseimbangan antara kenyamanan, kapasitas, dan harga.

### Ringkasan

Jika prioritas jamaah adalah kamar luas, fasilitas hotel besar, dan akses shuttle yang tertata, SAJA by Warwick Makkah bisa menjadi opsi yang kuat. Untuk perjalanan keluarga atau rombongan, hotel ini memberi kenyamanan yang cukup solid tanpa harus masuk ke kategori hotel premium ring satu.`;

const odstContent = `## ODST Al Madinah Hotel dalam Sekilas

ODST Al Madinah Hotel adalah hotel Madinah kelas menengah yang dikenal karena lokasinya sangat dekat dengan Masjid Nabawi. Hotel ini berada di area Northern Central Area / Al Markaziah, salah satu kawasan yang banyak dipilih jamaah karena aksesnya praktis untuk salat berjamaah dan aktivitas ibadah harian.

Bagi jamaah umroh, nilai utama ODST bukan sekadar fasilitas kamar, tetapi kombinasi antara jarak, kapasitas, dan efisiensi biaya. Hotel seperti ini sering menjadi pilihan dalam paket umroh reguler atau comfort karena membantu jamaah tetap dekat dengan Masjid Nabawi tanpa membuat harga paket melonjak terlalu tinggi.

## Lokasi Dekat Masjid Nabawi

Keunggulan terbesar ODST Al Madinah adalah jaraknya yang dekat ke Masjid Nabawi. Dari area hotel, jamaah umumnya bisa berjalan kaki sekitar 3 sampai 5 menit menuju area masjid, tergantung gerbang dan kepadatan sekitar.

Posisi ini sangat membantu jamaah lansia, keluarga, dan rombongan yang ingin mengurangi waktu perjalanan dari hotel ke masjid. Kedekatan hotel juga membuat jamaah lebih leluasa mengatur waktu istirahat di sela salat lima waktu.

## Fasilitas dan Kapasitas Hotel

ODST Al Madinah dikenal sebagai properti berkapasitas besar. Hotel ini memiliki banyak kamar, bangunan bertingkat, serta fasilitas pendukung yang dirancang untuk menerima pergerakan jamaah dalam jumlah besar.

- Kamar ber-AC dengan fasilitas standar hotel.
- Kamar mandi pribadi dengan perlengkapan dasar.
- Lift penumpang untuk membantu mobilitas antar lantai.
- Area lobi, restoran, dan fasilitas publik untuk kebutuhan rombongan.
- Wi-Fi tersedia, meski kualitasnya dapat berubah saat okupansi sangat padat.

## Pilihan Kamar untuk Jamaah

Hotel ini menyediakan konfigurasi kamar yang cocok untuk kebutuhan paket umroh, mulai dari double / twin, triple, quad, sampai family room. Bagi travel, fleksibilitas tipe kamar ini penting karena paket umroh biasanya menyesuaikan pilihan kamar jamaah: double, triple, atau quad.

Catatan pentingnya, kapasitas kamar sebaiknya ditentukan sejak awal. Untuk perjalanan rombongan, pengaturan jumlah jamaah per kamar perlu rapi agar tidak mengganggu kenyamanan saat check-in.

## Kelebihan yang Paling Terasa

ODST Al Madinah paling kuat di sisi lokasi dan efisiensi. Jamaah yang fokus pada kemudahan ibadah di Masjid Nabawi biasanya akan sangat menghargai jarak hotel yang dekat, terutama saat jadwal salat padat dan area sekitar masjid ramai.

Kelebihan lainnya adalah hotel ini cukup sering digunakan dalam ekosistem paket umroh Indonesia. Artinya, hotel ini bukan pilihan asing bagi pasar jamaah Indonesia, khususnya untuk paket yang mengutamakan lokasi dekat dengan harga tetap kompetitif.

## Hal yang Perlu Diperhatikan

Karena termasuk hotel dengan arus jamaah besar, beberapa hal perlu diantisipasi sejak awal. Pada jam check-in rombongan atau setelah salat berjamaah, area lobi dan lift bisa menjadi lebih ramai. Koneksi internet juga bisa menurun saat hotel penuh.

Jamaah disarankan membawa kartu SIM lokal atau paket roaming sebagai cadangan, serta mengikuti arahan tour leader agar pergerakan rombongan lebih tertib.

## Cocok untuk Paket Seperti Apa?

ODST Al Madinah cocok untuk paket umroh yang ingin menawarkan akses dekat ke Masjid Nabawi dengan harga tetap rasional. Hotel ini cocok untuk jamaah yang prioritasnya adalah ibadah, kemudahan berjalan kaki ke masjid, dan efisiensi biaya perjalanan.

### Ringkasan

ODST Al Madinah adalah pilihan yang masuk akal untuk jamaah yang ingin dekat dengan Masjid Nabawi tanpa harus masuk ke kategori hotel premium. Kekuatan utamanya ada pada lokasi, kapasitas, dan efisiensi harga. Dengan ekspektasi yang tepat, hotel ini bisa menjadi bagian akomodasi yang praktis dan nyaman dalam perjalanan umroh.`;

const articleSeeds = [
  {
    title: "SAJA by Warwick Makkah Hotel: Kamar Luas dan Shuttle Praktis ke Masjidil Haram",
    slug: "saja-by-warwick-makkah-hotel",
    excerpt:
      "Mengenal SAJA by Warwick Makkah, hotel area Kudai dengan kamar luas, fasilitas besar, dan shuttle menuju Masjidil Haram.",
    content: sajaContent,
    category: "HOTEL",
    tags: ["hotel makkah", "saja by warwick", "umroh"],
    relatedType: "HOTEL",
    hotel: {
      name: "SAJA by Warwick Makkah Hotel",
      city: "MAKKAH",
      address: "MCIE7996, 3909 Al-Masfalah, Makkah 24233, Arab Saudi",
      starRating: 3,
      distanceToHaram: 2500,
      facilities: [
        "Shuttle bus",
        "Restoran",
        "Lobby cafe",
        "Musala",
        "Suite keluarga",
      ],
    },
    seoTitle: "SAJA by Warwick Makkah Hotel untuk Jamaah Umroh",
    seoDescription:
      "Review singkat SAJA by Warwick Makkah Hotel: lokasi, kamar, shuttle, fasilitas, dan kecocokan untuk paket umroh.",
  },
  {
    title: "ODST Al Madinah Hotel: Dekat Masjid Nabawi dan Efisien untuk Jamaah Umroh",
    slug: "odst-al-madinah-hotel",
    excerpt:
      "ODST Al Madinah Hotel dikenal sebagai pilihan akomodasi Madinah yang dekat Masjid Nabawi, praktis untuk rombongan, dan efisien untuk paket umroh.",
    content: odstContent,
    category: "HOTEL",
    tags: ["hotel madinah", "odst al madinah", "masjid nabawi", "umroh"],
    relatedType: "HOTEL",
    hotel: {
      name: "ODST Al Madinah Hotel",
      city: "MADINAH",
      address: "Abdul Rahman Ibn Awaf, Budaah District, Madinah, Arab Saudi",
      starRating: 3,
      distanceToHaram: 200,
      facilities: [
        "Dekat Masjid Nabawi",
        "Restoran",
        "Lift",
        "Wi-Fi",
        "Kamar keluarga",
      ],
    },
    seoTitle: "ODST Al Madinah Hotel Dekat Masjid Nabawi",
    seoDescription:
      "Mengenal ODST Al Madinah Hotel: lokasi dekat Masjid Nabawi, fasilitas, tipe kamar, kelebihan, dan catatan untuk jamaah umroh.",
  },
];

const findOrCreateHotel = async (hotel) => {
  const existing = await db.query.masterHotels.findFirst({
    where: or(
      eq(masterHotels.name, hotel.name),
      like(masterHotels.name, `%${hotel.name.split(" ")[0]}%`),
    ),
  });

  if (existing) return existing.id;

  const [created] = await db
    .insert(masterHotels)
    .values({
      name: hotel.name,
      city: hotel.city,
      address: hotel.address,
      starRating: hotel.starRating,
      distanceToHaram: hotel.distanceToHaram,
      facilities: JSON.stringify(hotel.facilities),
      isActive: true,
    })
    .$returningId();

  return created.id;
};

const upsertArticle = async (seed) => {
  const relatedId = await findOrCreateHotel(seed.hotel);
  const existing = await db.query.articles.findFirst({
    where: eq(articles.slug, seed.slug),
  });

  const payload = {
    title: seed.title,
    slug: seed.slug,
    excerpt: seed.excerpt,
    content: seed.content,
    category: seed.category,
    tags: seed.tags,
    status: "PUBLISHED",
    relatedType: seed.relatedType,
    relatedId,
    seoTitle: seed.seoTitle,
    seoDescription: seed.seoDescription,
    publishedAt: existing?.publishedAt || now(),
  };

  if (existing) {
    await db.update(articles).set(payload).where(eq(articles.id, existing.id));
    return { action: "updated", slug: seed.slug };
  }

  await db.insert(articles).values(payload);
  return { action: "created", slug: seed.slug };
};

async function seedArticles() {
  console.log("Seeding public articles...");

  for (const seed of articleSeeds) {
    const result = await upsertArticle(seed);
    console.log(`${result.action}: ${result.slug}`);
  }

  console.log("Article sync completed.");
  process.exit(0);
}

seedArticles().catch((error) => {
  console.error("Article seed failed:", error);
  process.exit(1);
});
