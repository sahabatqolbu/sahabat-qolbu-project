import dotenv from "dotenv";
dotenv.config();

import { eq, like, or } from "drizzle-orm";
import { db } from "./index.js";
import { articles, masterAirlines, masterHotels } from "./schema.js";

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

const maysanContent = `## Maysan Al Mashaer Makkah: Pilihan Cerdas untuk Jamaah yang Fokus ke Haram

Di Ajyad, jarak dekat saja tidak cukup. Yang benar-benar bernilai adalah akses yang mudah dilalui, terutama untuk jamaah lansia dan keluarga. Maysan Al Mashaer menonjol karena menawarkan jalan kaki yang relatif datar menuju Masjidil Haram, sehingga waktu dan tenaga bisa lebih banyak dipakai untuk ibadah.

Hotel ini berada di bawah Maysan International Group dan dikenal sebagai properti kelas ekonomis yang tetap punya posisi strategis. Dengan kapasitas sekitar 195 sampai 214 kamar, Maysan Al Mashaer cocok untuk paket umroh yang ingin menjaga harga tetap rasional tanpa mengorbankan kedekatan ke pusat ibadah.

## Kenapa Hotel Ini Menarik

Nilai jual utamanya sederhana: dekat, praktis, dan tidak ribet. Dari hotel ke area Haram, waktu jalan kaki umumnya berada di kisaran 5 sampai 10 menit, tergantung ritme langkah dan titik masuk yang dipilih. Buat jamaah yang ingin mengurangi ketergantungan pada transportasi, ini adalah keuntungan yang sangat terasa.

Selain itu, lingkungan Ajyad yang padat membuat hotel seperti ini jadi relevan untuk jamaah yang lebih memilih efisiensi daripada kemewahan berlebihan. Bagi banyak rombongan, keputusan memilih hotel bukan soal pamer fasilitas, tapi soal energi ibadah tetap terjaga sejak pagi sampai malam.

## Fasilitas yang Relevan untuk Jamaah

Kamar di Maysan Al Mashaer tergolong kompak, rata-rata sekitar 16 m². Tipe twin, triple, dan quadruple tersedia, jadi hotel ini paling cocok untuk rombongan yang sudah sepakat soal komposisi kamar sejak awal. Ruangnya tidak luas, tetapi fungsional untuk istirahat, menaruh koper, dan bersiap ke masjid.

Fasilitas yang umumnya tersedia mencakup AC, TV layar datar, lemari pakaian, brankas, kulkas kecil, dan ketel listrik. Di beberapa deskripsi agen, hotel ini juga disebut punya kamar mandi dengan whirlpool bathtub dan aksesibilitas yang lebih ramah untuk tamu tertentu.

## Kenyamanan Makan dan Suasana Menginap

Salah satu alasan hotel ini sering dipilih jamaah Indonesia adalah restoran dengan menu Nusantara. Ini detail kecil yang efeknya besar: makan terasa lebih familiar, anak-anak lebih mudah cocok, dan jamaah tidak perlu terlalu bergantung pada makanan luar selama program berjalan.

Sarapan buffet juga tersedia untuk tamu yang mengambil opsi terpisah. Ditambah staf yang dikenal cukup membantu, hotel ini terasa lebih ramah jamaah daripada kesan awalnya sebagai hotel bintang satu.

## Yang Perlu Dipahami Sebelum Booking

Maysan Al Mashaer bukan hotel untuk mencari kamar lega. Yang dicari di sini adalah lokasi yang masuk akal, akses yang praktis, dan harga yang tetap realistis untuk area dekat Haram. Karena itu, hotel ini paling cocok dijelaskan sebagai kompromi cerdas, bukan sebagai hotel premium.

Calon jamaah juga sebaiknya melakukan reconfirm reservasi sebelum tiba, terutama jika booking lewat pihak ketiga. Kalau ekspektasinya sudah pas sejak awal, hotel ini bisa jadi pilihan yang solid untuk paket umroh yang ingin dekat ke Masjidil Haram tanpa membebani anggaran.

### Ringkasan

Maysan Al Mashaer Makkah adalah opsi yang menarik untuk jamaah yang memprioritaskan akses ke Masjidil Haram, jalur jalan kaki yang lebih nyaman, dan kenyamanan makan yang familiar. Hotel ini sederhana, tapi justru di situlah nilainya: efisien, strategis, dan cukup masuk akal untuk banyak paket umroh.`;

const alSahaContent = `## Al Saha Hotel Madinah: Dekat Nabawi, Praktis untuk Jamaah

Al Saha Hotel Madinah menarik karena satu alasan utama: lokasinya benar-benar membantu jamaah menghemat tenaga. Berada di kawasan Bada'ah dekat Central Area, hotel ini sering dipilih oleh jamaah yang ingin akses cepat ke pelataran Masjid Nabawi tanpa harus repot dengan perjalanan tambahan.

Yang membuatnya unik adalah perbedaan cara hotel ini dipasarkan di berbagai platform. Di beberapa tempat, hotel ini muncul dengan nama Al Saha Hotel by Sedra International, Al Saha Hotel - By Al Rawda, atau Jiwar Al Saha Hotel. Buat jamaah, nama boleh berbeda, tetapi yang penting tetap sama: hotel ini memang diposisikan sebagai akomodasi yang fokus pada kedekatan dan fungsionalitas.

## Kenapa Lokasinya Menonjol

Nilai jual terbesar Al Saha adalah jaraknya yang sangat dekat ke area utama Masjid Nabawi. Dari hotel ke pelataran luar, jamaah bisa berjalan kaki dalam hitungan menit, dan ini sangat terasa manfaatnya terutama untuk jamaah lansia, keluarga, atau rombongan yang ingin lebih banyak menghabiskan waktu di masjid daripada di jalan.

Lingkungan sekitarnya juga mendukung. Ada pusat belanja, minimarket, dan area logistik harian yang mudah dijangkau. Buat jamaah yang ingin beli kebutuhan kecil atau oleh-oleh tanpa jauh-jauh, posisi hotel ini cukup praktis.

## Kamar dan Pengalaman Menginap

Karakter kamar di Al Saha cenderung fungsional. Tipe kamar tersedia dari twin sampai family room, dengan konfigurasi ranjang yang menyesuaikan kebutuhan rombongan. Ada juga kamar tertentu yang lebih tenang, termasuk opsi tanpa jendela untuk tamu yang ingin istirahat lebih fokus.

Hotel ini bukan pilihan yang dijual sebagai kemewahan, dan justru di situ letak strateginya. Jamaah yang memilih Al Saha biasanya mencari kamar yang cukup nyaman, akses yang dekat, dan harga yang masih masuk akal untuk area Madinah yang kompetitif.

## Hal yang Perlu Diketahui Sebelum Booking

Salah satu hal yang perlu dijelaskan secara jujur adalah adanya perbedaan ekspektasi antarplatform. Ada tamu yang datang dengan bayangan hotel berbintang tinggi, lalu kecewa karena properti ini lebih cocok dibaca sebagai hotel fungsional untuk ibadah. Di sisi lain, jamaah Asia Tenggara justru sering merasa puas karena apa yang mereka bayar sepadan dengan lokasi dan kemudahan aksesnya.

Karena itu, Al Saha paling tepat dipresentasikan sebagai hotel praktis untuk jamaah yang memprioritaskan dekat ke Nabawi dan tidak terlalu mengejar kesan premium. Kalau ekspektasinya pas sejak awal, hotel ini bisa jadi pilihan yang sangat masuk akal.

### Ringkasan

Al Saha Hotel Madinah cocok untuk jamaah yang ingin mengutamakan jarak dekat ke Masjid Nabawi, akses harian yang sederhana, dan kenyamanan yang cukup untuk fokus ibadah. Hotel ini bukan untuk mencari pengalaman mewah, tetapi untuk mencari lokasi yang benar-benar membantu perjalanan umroh atau ziarah di Madinah.`;

const garudaContent = `## Garuda Indonesia untuk Umroh: Nyaman, Langsung, dan Familiar untuk Jamaah

Garuda Indonesia menjadi salah satu pilihan maskapai yang kuat untuk perjalanan umroh karena menggabungkan penerbangan jarak jauh yang nyaman, layanan full service, dan pengalaman yang terasa familiar bagi jamaah Indonesia. Untuk perjalanan ibadah yang melelahkan secara fisik, detail seperti bahasa awak kabin, makanan Nusantara, pengaturan bagasi, dan rute yang rapi bisa memberi dampak besar pada kenyamanan jamaah.

Bagi calon jamaah, memilih maskapai bukan hanya soal tiba di Jeddah atau Madinah. Yang lebih penting adalah bagaimana perjalanan panjang menuju Tanah Suci terasa lebih tertata, aman, dan tidak membuat energi habis sebelum rangkaian ibadah dimulai.

## Kenapa Garuda Menarik untuk Paket Umroh

Nilai utama Garuda Indonesia ada pada kombinasi layanan nasional dan jaringan rute menuju Arab Saudi. Dari Jakarta, penerbangan ke Jeddah dan Madinah menjadi jalur utama yang banyak dipakai untuk paket umroh. Di beberapa musim, Garuda juga melayani atau mendukung rute langsung dari kota-kota besar lain seperti Surabaya, Makassar, Kertajati, Yogyakarta, dan Banda Aceh.

Strategi rute seperti ini membantu jamaah dari daerah mengurangi transit yang tidak perlu. Untuk jamaah lansia atau keluarga, perjalanan yang lebih sederhana berarti tubuh lebih siap ketika sampai di Madinah atau Makkah.

## Armada dan Kenyamanan di Udara

Untuk rute jarak jauh ke Timur Tengah, Garuda Indonesia menggunakan armada berbadan lebar seperti Boeing 777-300ER dan Airbus A330. Kabin yang lebih stabil, kapasitas besar, serta konfigurasi penerbangan jarak jauh membuat perjalanan sekitar sembilan jam terasa lebih nyaman dibanding penerbangan yang terlalu banyak transit.

Selama penerbangan, jamaah biasanya mendapatkan layanan makanan hangat dan minuman. Menu bercita rasa Indonesia menjadi nilai tambah yang sederhana tapi penting, terutama untuk jamaah yang lebih nyaman dengan makanan familiar. Sistem hiburan di pesawat juga dapat membantu jamaah mengisi waktu dengan konten yang lebih tenang, termasuk panduan perjalanan atau konten islami sesuai ketersediaan armada.

## Bagasi dan Air Zamzam: Hal yang Wajib Dipahami

Salah satu hal paling penting sebelum berangkat adalah memahami aturan bagasi. Pada rute internasional, kebijakan bagasi dapat berbeda tergantung jenis tiket, rute, dan apakah perjalanan memakai connecting flight dalam satu itinerary. Karena itu, jamaah sebaiknya selalu mengikuti arahan travel dan membaca ketentuan tiket terbaru sebelum packing.

Untuk air zamzam, aturannya jauh lebih ketat. Jamaah tidak boleh memasukkan air zamzam sendiri ke koper bagasi karena alasan keselamatan penerbangan. Sebagai gantinya, jamaah umroh biasanya mendapatkan jatah resmi air zamzam 5 liter sesuai ketentuan maskapai dan otoritas bandara. Ini lebih aman, rapi, dan mengurangi risiko koper dibongkar atau tertahan.

## Cocok untuk Jamaah Seperti Apa?

Garuda Indonesia cocok untuk jamaah yang mengutamakan kenyamanan perjalanan, komunikasi yang mudah, dan pengalaman penerbangan yang lebih familiar. Maskapai ini juga relevan untuk paket umroh reguler sampai premium, terutama ketika travel ingin menjaga kualitas perjalanan sejak dari bandara keberangkatan.

Untuk paket premium, Garuda bisa dipadukan dengan hotel ring satu atau hotel bintang 5 dekat Masjidil Haram dan Masjid Nabawi. Untuk paket menengah, Garuda tetap bisa menjadi pilihan menarik ketika dipadukan dengan hotel yang praktis, dekat akses ibadah, dan memiliki pengaturan rombongan yang baik.

## Tips Sebelum Berangkat dengan Garuda

- Pastikan nama di tiket sama dengan paspor.
- Ikuti batas bagasi sesuai tiket dan jangan menumpuk berat dalam satu koper.
- Simpan powerbank dan perangkat elektronik penting di tas kabin.
- Jangan memasukkan air zamzam ke koper pribadi.
- Datang lebih awal ke bandara karena perjalanan umroh biasanya bergerak dalam rombongan besar.

### Ringkasan

Garuda Indonesia adalah pilihan maskapai yang menarik untuk perjalanan umroh karena menawarkan layanan full service, kenyamanan kabin jarak jauh, makanan yang familiar, dan jaringan rute yang kuat menuju Arab Saudi. Untuk jamaah yang ingin perjalanan lebih tertata sejak dari Indonesia, Garuda menjadi opsi yang layak dipertimbangkan dalam paket umroh Sahabat Qolbu.`;
const articleSeeds = [
  {
    title: "Garuda Indonesia untuk Umroh: Penerbangan Nyaman Menuju Tanah Suci",
    slug: "garuda-indonesia-untuk-umroh",
    excerpt:
      "Mengenal keunggulan Garuda Indonesia untuk perjalanan umroh: rute ke Arab Saudi, kenyamanan kabin, layanan Nusantara, aturan bagasi, dan tips sebelum berangkat.",
    content: garudaContent,
    category: "MASKAPAI",
    tags: [
      "garuda indonesia",
      "maskapai umroh",
      "penerbangan umroh",
      "jeddah",
      "madinah",
    ],
    relatedType: "AIRLINE",
    airline: {
      code: "GA",
      name: "Garuda Indonesia",
      country: "Indonesia",
      logo: "https://www.garuda-indonesia.com/logo.png",
    },
    seoTitle: "Garuda Indonesia untuk Perjalanan Umroh",
    seoDescription:
      "Review Garuda Indonesia untuk umroh: rute, armada, layanan, bagasi, air zamzam, dan kecocokan untuk paket umroh.",
  },
  {
    title:
      "SAJA by Warwick Makkah Hotel: Kamar Luas dan Shuttle Praktis ke Masjidil Haram",
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
    title:
      "ODST Al Madinah Hotel: Dekat Masjid Nabawi dan Efisien untuk Jamaah Umroh",
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
  {
    title:
      "Hotel Maysan Al Mashaer Makkah: Akses Jalan Kaki Datar ke Masjidil Haram dengan Tarif Menengah",
    slug: "hotel-maysan-al-mashaer-makkah",
    excerpt:
      "Mengenal Hotel Maysan Al Mashaer Makkah, akomodasi bintang satu di Ajyad dengan jalur jalan kaki datar ke Masjidil Haram, restoran Indonesia, dan fasilitas aksesibilitas untuk jamaah.",
    content: maysanContent,
    category: "HOTEL",
    tags: [
      "hotel makkah",
      "maysan al mashaer",
      "masjidil haram",
      "umroh",
      "ajyad",
    ],
    relatedType: "HOTEL",
    hotel: {
      name: "Maysan Al Mashaer Hotel",
      city: "MAKKAH",
      address: "Ajyad Street, behind clock complex, Makkah 21955, Saudi Arabia",
      starRating: 1,
      distanceToHaram: 700,
      facilities: [
        "Restoran Indonesia",
        "Sarapan buffet",
        "Aksesibilitas kursi roda",
        "AC",
        "Brankas kamar",
        "Kulkas mini",
        "Ketel listrik",
      ],
    },
    seoTitle: "Maysan Al Mashaer Makkah untuk Jamaah Umroh",
    seoDescription:
      "Review Maysan Al Mashaer Makkah: lokasi Ajyad, akses jalan kaki ke Masjidil Haram, kamar kompak, restoran Indonesia, dan catatan booking.",
  },
  {
    title: "Al Saha Hotel Madinah: Pilihan Praktis Dekat Masjid Nabawi",
    slug: "al-saha-hotel-madinah",
    excerpt:
      "Al Saha Hotel Madinah adalah opsi akomodasi praktis di area Bada'ah yang dekat dengan Masjid Nabawi dan cocok untuk jamaah yang mengutamakan akses.",
    content: alSahaContent,
    category: "HOTEL",
    tags: ["hotel madinah", "al saha", "masjid nabawi", "umroh", "bada'ah"],
    relatedType: "HOTEL",
    hotel: {
      name: "Al Saha Hotel",
      city: "MADINAH",
      address: "6993 Zaid Ibn Thabet, Bada'ah, Madinah, Arab Saudi",
      starRating: 3,
      distanceToHaram: 650,
      facilities: [
        "Dekat Masjid Nabawi",
        "Restoran",
        "Lift",
        "AC",
        "Family room",
        "No window room",
      ],
    },
    seoTitle: "Al Saha Hotel Madinah untuk Jamaah Umroh",
    seoDescription:
      "Review Al Saha Hotel Madinah: lokasi dekat Nabawi, kamar fungsional, akses belanja, dan catatan sebelum booking.",
  },
];

const findOrCreateAirline = async (airline) => {
  const existing = await db.query.masterAirlines.findFirst({
    where: or(
      eq(masterAirlines.code, airline.code),
      eq(masterAirlines.name, airline.name),
    ),
  });

  if (existing) return existing.id;

  const [created] = await db
    .insert(masterAirlines)
    .values({
      code: airline.code,
      name: airline.name,
      country: airline.country || null,
      logo: airline.logo || null,
      isActive: true,
    })
    .$returningId();

  return created.id;
};

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
  const relatedId =
    seed.relatedType === "AIRLINE"
      ? await findOrCreateAirline(seed.airline)
      : await findOrCreateHotel(seed.hotel);
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
