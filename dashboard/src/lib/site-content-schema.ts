/*
 * Struktur dan nilai bawaan Konten Website. Harus sama dengan
 * frontend/src/lib/site-content.ts (DEFAULT_HOME dan DEFAULT_ABOUT).
 */
export type TitleText = { title: string; text: string };
export type PhotoItem = { label: string; photoUrl: string };

export const DEFAULT_HOME = {
  hero: {
    show: true,
    headline: "Berangkat Umroh, Pulang Berhijrah",
    license: "Travel Umroh Sunnah, PPIU Berizin Resmi No. 12112100038690008",
    points: [
      "Sesuai Al-Qur'an dan Sunnah",
      "Tim medis pribadi",
      "Anggota Mutiara Haji Indonesia",
    ],
    primaryLabel: "Lihat paket umroh",
    secondaryLabel: "Konsultasi via WhatsApp",
    backgroundUrl: "",
  },
  trust: {
    chips: ["Tim medis pribadi", "Bimbingan sesuai sunnah", "Rekening resmi a/n PT"],
  },
  packages: {
    heading: "Jadwal umroh terdekat",
    lead: "Harga per orang untuk kamar berempat. Seat terbatas di setiap keberangkatan.",
  },
  why: {
    heading: "Mengapa jamaah memilih Sahabat Qolbu",
    lead: "Setiap detail perjalanan disiapkan supaya Anda bisa fokus beribadah, dari manasik sampai kembali ke tanah air.",
    photoUrl: "/uploads/gallery/1783479414395-0a02f3c757f92f96.webp",
    photoCaption: "Rombongan jamaah Sahabat Qolbu",
    items: [
      { title: "Sesuai Al-Qur'an dan Sunnah", text: "Kegiatan ibadah dibimbing pembimbing yang paham manasik sesuai tuntunan." },
      { title: "Tim medis pribadi", text: "Pendampingan tim medis sepanjang perjalanan, tenang untuk jamaah lansia dan keluarga." },
      { title: "Jadwal pasti", text: "Tanggal berangkat, nomor penerbangan, dan itinerary sudah tertera sebelum Anda membayar." },
      { title: "Pembayaran tercatat", text: "Bayar ke rekening resmi PT, kwitansi terbit, dan sisa tagihan terlihat di akun jamaah." },
    ] as TitleText[],
  },
  steps: {
    heading: "Daftar umroh dalam 4 langkah",
    lead: "Mulai dari form satu menit, tanpa membuat password.",
    ctaLabel: "Isi form pendaftaran",
    items: [
      { title: "Pilih paket dan isi form", text: "Nama, email, nomor WhatsApp, tipe kamar, dan jumlah orang." },
      { title: "Admin mengonfirmasi seat", text: "Email berisi akses akun, total biaya, dan rekening resmi dikirim ke Anda." },
      { title: "Bayar DP untuk mengunci seat", text: "Transfer ke rekening resmi a/n PT, lalu unggah buktinya." },
      { title: "Lengkapi dokumen", text: "Isi data paspor seluruh keluarga lewat satu link pribadi, lalu ikut manasik." },
    ] as TitleText[],
  },
  gallery: {
    heading: "Dokumentasi perjalanan jamaah",
    lead: "Momen jamaah Sahabat Qolbu di Tanah Suci dan perjalanan wisata halal.",
  },
  faq: {
    heading: "Pertanyaan yang sering diajukan",
    lead: "Belum menemukan jawabannya? Admin kami siap membantu.",
  },
  closing: {
    heading: "Wujudkan rindu Baitullah bersama kami",
    text: "Tim kami bantu jelaskan paket, jadwal, hotel, dan simulasi pembayaran sesuai kebutuhan keluarga Anda.",
    backgroundUrl: "",
  },
};

export const DEFAULT_ABOUT = {
  hero: {
    kicker: "Travel umroh sunnah · Peduli kesehatan jamaah",
    headline: "Ibadah lebih tenang, perjalanan lebih terjaga",
    text: "Karena perjalanan menuju Baitullah bukan hanya tentang bagaimana Anda sampai, tetapi juga bagaimana Anda dilayani, dibimbing, dan diperhatikan sepanjang perjalanan ibadah.",
    ctaLabel: "Konsultasikan perjalanan umroh Anda",
    photoUrl: "",
    photoCaption: "Jamaah SQ di Tanah Suci",
    trustChips: ["PPIU resmi", "Anggota Mutiara Haji", "Tim medis pribadi"],
  },
  pillars: [
    { title: "Sunnah First", text: "Bimbingan ibadah berdasarkan Al-Qur'an dan Sunnah." },
    { title: "Medical Care", text: "Perhatian terhadap kesehatan jamaah sejak sebelum keberangkatan." },
    { title: "Service Excellence", text: "Pelayanan yang manusiawi, responsif, dan terarah." },
    { title: "Trust & Credibility", text: "Legalitas, kejelasan program, dan keanggotaan resmi Mutiara Haji." },
  ] as TitleText[],
  who: {
    eyebrow: "Who we are",
    heading: "Lebih dari sekadar travel umroh",
    paragraphs: [
      "Sahabat Qolbu Tour & Travel hadir dengan keyakinan bahwa setiap jamaah berhak mendapatkan pelayanan terbaik dalam perjalanan menuju Baitullah.",
      "Umroh bukan perjalanan biasa. Ini perjalanan ibadah yang telah dinantikan, dipersiapkan, dan diperjuangkan oleh banyak keluarga. Karena itu, kami tidak hanya menyiapkan keberangkatan, tetapi juga memberikan bimbingan ibadah, pendampingan perjalanan, serta perhatian terhadap kesehatan jamaah.",
    ],
    quote: "Berangkat Umroh, Pulang Berhijrah.",
    closing: "Keberhasilan sebuah perjalanan umroh bukan hanya ketika jamaah sampai di Tanah Suci, tetapi ketika jamaah memperoleh pengalaman ibadah yang bermakna dan membawa perubahan kebaikan setelah kembali ke Tanah Air.",
    photoUrl: "/uploads/gallery/1783486675372-558d3a63acd2a6c5.webp",
    photoCaption: "Tim SQ bersama jamaah",
  },
  health: {
    eyebrow: "We care about your health",
    heading: "Perjalanan ibadah yang istimewa membutuhkan persiapan yang istimewa",
    text: "Umroh melibatkan aktivitas fisik, perubahan cuaca, lingkungan yang berbeda, penerbangan panjang, serta perubahan pola tidur. Kondisi ini bisa menjadi tantangan, terutama bagi jamaah lansia dan jamaah dengan riwayat kesehatan tertentu.",
    callout: [
      "Itulah mengapa Sahabat Qolbu memberi perhatian khusus terhadap kesehatan jamaah, sebagai bagian dari komitmen pelayanan perjalanan ibadah.",
      "Kami ingin jamaah lebih fokus beribadah, dengan tenang karena ada tim yang siap membantu ketika mereka membutuhkan perhatian kesehatan.",
    ],
    risks: [
      "Perubahan cuaca",
      "Aktivitas fisik",
      "Perjalanan panjang",
      "Perubahan pola istirahat",
      "Kondisi kesehatan",
      "Kebutuhan jamaah lansia",
    ],
  },
  medical: {
    badge: "Our signature service",
    title: "SQ Private Medical Care",
    subtitle: "Pendampingan Tim Medis Pribadi untuk jamaah Sahabat Qolbu",
    text: "Perhatian kami terhadap kesehatan jamaah tidak baru dimulai ketika jamaah mengalami keluhan di Tanah Suci. Kami memulainya sejak tahap persiapan sebelum keberangkatan.",
    photoUrl: "",
    items: [
      { title: "Pemeriksaan kesehatan saat manasik", text: "Membantu jamaah mengenali kondisi kesehatan sebelum perjalanan." },
      { title: "Pendampingan sejak keberangkatan", text: "Perhatian kesehatan sebagai bagian dari pelayanan perjalanan." },
      { title: "Tim medis di hotel Makkah dan Madinah", text: "Memudahkan jamaah memperoleh bantuan awal ketika mengalami keluhan kesehatan." },
    ] as TitleText[],
  },
  journey: {
    eyebrow: "Perjalanan pelayanan jamaah",
    heading: "Kepedulian kami dimulai bahkan sebelum Anda berangkat",
    stages: [
      { label: "Tahap 01, sebelum keberangkatan", title: "Pemeriksaan kesehatan saat manasik", text: "Pemeriksaan tekanan darah, gula darah, kolesterol, edukasi kesehatan perjalanan, serta booster vitamin bagi jamaah yang membutuhkan sesuai pertimbangan tenaga kesehatan.", photoUrl: "" },
      { label: "Tahap 02, keberangkatan", title: "Pendampingan perjalanan", text: "Perhatian terhadap kondisi jamaah sejak keberangkatan menuju Tanah Suci, sebagai bagian dari pelayanan tim SQ.", photoUrl: "" },
      { label: "Tahap 03, Makkah", title: "Tim medis di hotel Makkah", text: "Jamaah dapat menyampaikan keluhan kesehatan dan memperoleh pemeriksaan serta bantuan awal sesuai kebutuhan dan kewenangan tim medis.", photoUrl: "" },
      { label: "Tahap 04, Madinah", title: "Tim medis di hotel Madinah", text: "Perhatian terhadap kesehatan jamaah tetap menjadi bagian dari pelayanan selama rangkaian ibadah di Madinah.", photoUrl: "" },
      { label: "Tahap 05, kepulangan", title: "Kembali ke Tanah Air", text: "Pendampingan perjalanan hingga jamaah menyelesaikan rangkaian program umroh dan kembali ke Indonesia.", photoUrl: "" },
    ],
    closing: "Karena setiap jamaah bukan sekadar peserta perjalanan. Mereka adalah tamu Allah yang harus kami layani dengan penuh amanah.",
  },
  network: {
    eyebrow: "Our network & affiliation",
    heading: "Bersama Mutiara Haji Indonesia",
    text: "Membangun pelayanan perjalanan ibadah dengan amanah dan profesionalisme.",
    leaderName: "Ustadz Khalid Basalamah Hafizhahullah",
    leaderRole: "Ketua Umum Mutiara Haji Indonesia",
    leaderPhotoUrl: "",
    paragraphs: [
      "Sahabat Qolbu Tour & Travel merupakan anggota resmi Mutiara Haji Indonesia di bawah kepemimpinan Ustadz Khalid Basalamah Hafizhahullah sebagai Ketua Umum.",
      "Tidak hanya menjadi anggota, perwakilan Sahabat Qolbu juga turut berperan aktif dalam kepengurusan Koperasi Mutiara Haji. Keterlibatan ini bagian dari komitmen kami untuk terus meningkatkan kualitas pelayanan dan profesionalisme penyelenggaraan perjalanan ibadah.",
    ],
    roles: [
      { title: "Anggota resmi Mutiara Haji Indonesia", text: "Sahabat Qolbu Tour & Travel merupakan bagian dari jaringan Mutiara Haji Indonesia." },
      { title: "Kepengurusan Koperasi Mutiara Haji", text: "Perwakilan Sahabat Qolbu berperan aktif sebagai pengurus Koperasi Mutiara Haji." },
    ] as TitleText[],
    proofs: [
      { label: "Dokumentasi kepengurusan", photoUrl: "" },
      { label: "Kegiatan Mutiara Haji", photoUrl: "" },
      { label: "Bukti keanggotaan resmi", photoUrl: "" },
    ] as PhotoItem[],
  },
  legal: {
    eyebrow: "Your trust matters",
    heading: "Beribadah dengan tenang, bersama travel berizin resmi",
    text: "Kepercayaan jamaah adalah amanah yang harus kami jaga. Sahabat Qolbu berkomitmen memberikan informasi perjalanan, fasilitas, biaya, dan ketentuan program secara jelas sebelum jamaah mendaftar.",
  },
  proof: {
    eyebrow: "Real people · Real service",
    heading: "Bukan sekadar janji. Lihat bagaimana kami melayani",
    text: "Setiap perjalanan jamaah memiliki cerita. Berikut bagian dari perjalanan kami dalam memberikan pelayanan, bimbingan, dan perhatian kepada para tamu Allah.",
    items: [
      { label: "Keberangkatan jamaah", photoUrl: "" },
      { label: "Pemeriksaan tensi jamaah", photoUrl: "" },
      { label: "Pemeriksaan gula darah", photoUrl: "" },
      { label: "Pelayanan kesehatan saat manasik", photoUrl: "" },
      { label: "Tim medis di Makkah", photoUrl: "" },
      { label: "Tim medis di Madinah", photoUrl: "" },
      { label: "Pendampingan jamaah lansia", photoUrl: "" },
      { label: "Bimbingan ibadah", photoUrl: "" },
      { label: "Kebersamaan jamaah SQ", photoUrl: "" },
    ] as PhotoItem[],
    videoLink: "",
    videoTitle: "Satu menit bersama jamaah SQ",
    videoText: "Dari pemeriksaan kesehatan saat manasik sampai pendampingan di hotel Makkah dan Madinah, langsung dari jamaah dan tim kami.",
  },
  office: {
    eyebrow: "Visit our office",
    heading: "Kami siap menyambut dan mendengarkan Anda",
    text: "Memilih travel umroh membutuhkan kepercayaan. Karena itu, kami membuka kesempatan bagi calon jamaah dan keluarga untuk berkonsultasi langsung di kantor Sahabat Qolbu.",
    photos: [
      { label: "Kantor Sahabat Qolbu", photoUrl: "" },
      { label: "Ruang konsultasi jamaah", photoUrl: "" },
    ] as PhotoItem[],
    mapsLink: "",
  },
  closing: {
    eyebrow: "Your journey begins here",
    heading: "Persiapkan perjalanan menuju Baitullah bersama kami",
    text: "Perjalanan yang dibimbing dengan sunnah, dilayani dengan sepenuh hati, dan disertai perhatian terhadap kesehatan Anda.",
    motto: "Berangkat Umroh, Pulang Berhijrah.",
    note: "Konsultasi tanpa kewajiban mendaftar.",
    promises: [
      { title: "Dibimbing dengan sunnah", text: "Manasik dan ibadah sesuai tuntunan Rasulullah ﷺ." },
      { title: "Dilayani dengan amanah", text: "Program, biaya, dan ketentuan jelas sejak awal." },
      { title: "Diperhatikan sepenuh hati", text: "SQ Private Medical Care sejak manasik sampai pulang." },
    ] as TitleText[],
  },
};

export type ContentKey = "home" | "about";

export const DEFAULTS: Record<ContentKey, Record<string, unknown>> = {
  home: DEFAULT_HOME,
  about: DEFAULT_ABOUT,
};

/** Judul tiap bagian di form. */
export const SECTION_LABELS: Record<string, string> = {
  hero: "Bagian atas (hero)",
  trust: "Baris legalitas",
  packages: "Jadwal paket",
  why: "Keunggulan",
  steps: "Cara daftar",
  gallery: "Galeri",
  faq: "Tanya jawab",
  closing: "Ajakan penutup",
  pillars: "4 pilar brand",
  who: "Mengenal Sahabat Qolbu",
  health: "Edukasi kesehatan jamaah",
  medical: "SQ Private Medical Care",
  journey: "Perjalanan pelayanan",
  network: "Mutiara Haji Indonesia",
  legal: "Legalitas",
  proof: "Bukti pelayanan",
  office: "Kantor",
};

/** Label field. Field yang tidak ada di sini memakai nama key. */
export const FIELD_LABELS: Record<string, string> = {
  show: "Tampilkan slide sambutan",
  headline: "Judul",
  heading: "Judul",
  license: "Baris izin",
  points: "Poin keunggulan",
  primaryLabel: "Teks tombol utama",
  secondaryLabel: "Teks tombol WhatsApp",
  backgroundUrl: "Foto latar",
  chips: "Label",
  lead: "Kalimat pembuka",
  photoUrl: "Foto",
  photoCaption: "Keterangan foto",
  items: "Daftar",
  title: "Judul",
  text: "Teks",
  ctaLabel: "Teks tombol",
  kicker: "Label kecil di atas judul",
  trustChips: "Label kepercayaan",
  eyebrow: "Label kecil",
  paragraphs: "Paragraf",
  quote: "Kutipan",
  closing: "Kalimat penutup",
  callout: "Kotak navy",
  risks: "Tantangan perjalanan",
  badge: "Label",
  subtitle: "Subjudul",
  stages: "Tahap",
  label: "Label",
  leaderName: "Nama Ketua Umum",
  leaderRole: "Jabatan",
  leaderPhotoUrl: "Foto Ketua Umum",
  roles: "Peran Sahabat Qolbu",
  proofs: "Foto bukti",
  videoLink: "Link video YouTube",
  videoTitle: "Judul video",
  videoText: "Keterangan video",
  photos: "Foto kantor",
  mapsLink: "Link Google Maps",
  motto: "Motto",
  note: "Catatan kecil",
  promises: "Janji brand",
};
