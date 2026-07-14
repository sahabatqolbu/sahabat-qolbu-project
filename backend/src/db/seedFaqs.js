import dotenv from "dotenv";
dotenv.config();

import { inArray } from "drizzle-orm";
import { db } from "./index.js";
import { faqs } from "./schema.js";

const faqSeedItems = [
  {
    category: "GENERAL",
    question: "Apa fungsi Grup WhatsApp Info Resmi Calon Jamaah?",
    answer:
      "Grup WhatsApp Info Resmi Calon Jamaah digunakan untuk calon jamaah yang ingin mendapatkan update terbaru seputar paket umroh, info pendaftaran, dan pengingat keberangkatan.\n\n" +
      "Link grup: https://chat.whatsapp.com/B54jzpk7AHJGg5AiZtFVaX\n\n" +
      "Grup ini cocok diberikan kepada calon jamaah yang:\n" +
      "- Sudah ditanya jumlah peserta tapi belum merespons follow-up\n" +
      "- Ingin mendapatkan update berkala tanpa harus chat terus-menerus dengan admin\n" +
      "- Sudah selesai konfirmasi paket dan ingin tetap terhubung untuk info lanjutan\n\n" +
      'Setelah join grup, calon jamaah diminta membalas chat admin dengan tulisan "SUDAH JOIN" agar admin bisa membantu cek sisa seat dan simulasi DP sesuai pilihan kamar.',
    sortOrder: 1,
  },
  {
    category: "UMRAH",
    question: "Bagaimana 5 langkah pendaftaran umroh di Sahabat Qolbu?",
    answer:
      "5 langkah pendaftaran:\n" +
      "1. Hubungi Hotline - cek ketersediaan seat, pilihan kamar, jadwal, dan simulasi pembayaran.\n" +
      "2. Kirim Data - nama sesuai paspor, foto KTP, foto KK, paspor, pas foto 4x6, dan pilihan kamar.\n" +
      "3. Bayar DP - lakukan pembayaran DP untuk mengunci seat melalui rekening resmi.\n" +
      "4. Konfirmasi Pembayaran - kirim bukti transfer agar segera diproses dan dikunci.\n" +
      "5. Masuk Grup Keberangkatan - dapatkan persiapan, dokumen, manasik, dan update teknis perjalanan.",
    sortOrder: 2,
  },
  {
    category: "UMRAH",
    question: "Dokumen apa saja yang harus disiapkan untuk pendaftaran?",
    answer:
      "Dokumen pendaftaran yang harus disiapkan:\n" +
      "- Fotocopy KTP\n" +
      "- Fotocopy Kartu Keluarga\n" +
      "- Paspor aktif\n" +
      "- Pas foto 4x6",
    sortOrder: 3,
  },
  {
    category: "UMRAH",
    question: "Apa saja syarat jamaah untuk mengikuti umroh?",
    answer:
      "Syarat jamaah:\n" +
      "- Sehat jasmani dan rohani\n" +
      "- Tidak memiliki kendala jalan kaki\n" +
      "- Tidak ada batas usia\n" +
      "- Jamaah usia 60 tahun ke atas atau memiliki riwayat komorbid disarankan didampingi keluarga.",
    sortOrder: 4,
  },
  {
    category: "PAYMENT",
    question: "Biaya apa saja yang tidak termasuk dalam paket umroh?",
    answer:
      "Biaya yang tidak termasuk dalam paket:\n" +
      "- Pembuatan / perpanjangan paspor\n" +
      "- Biaya pengiriman perlengkapan jamaah\n" +
      "- Keperluan pribadi selama perjalanan\n" +
      "- Vaksin meningitis dan polio apabila diwajibkan sesuai ketentuan\n" +
      "- Perjalanan domestik dari / ke bandara keberangkatan\n" +
      "- Tiket Kereta Gantung Thaif / Telefric",
    sortOrder: 5,
  },
  {
    category: "PAYMENT",
    question: "Ke rekening mana pembayaran resmi dilakukan?",
    answer:
      "Rekening resmi pembayaran Sahabat Qolbu:\n" +
      "- BSI (Bank Syariah Indonesia): 7664412343 a/n PT. Sahabat Qolbu Cahaya Baitullah\n" +
      "- BCA Syariah: 04423 01818 a/n PT. Sahabat Qolbu Cahaya Baitullah\n\n" +
      "Penting: pembayaran hanya dilakukan melalui rekening resmi di atas. Jangan transfer ke rekening pribadi siapa pun, termasuk admin atau agen perorangan.",
    sortOrder: 6,
  },
  {
    category: "UMRAH",
    question: "Dokumen apa saja yang dibutuhkan untuk membuat paspor?",
    answer:
      "Dokumen pembuatan paspor:\n" +
      "- KTP asli dan fotocopy (diperbesar A4)\n" +
      "- KK asli dan fotocopy\n" +
      "- Akta Lahir / Ijazah asli dan fotocopy\n" +
      "- Buku Nikah asli dan fotocopy (bagi pasangan suami istri)\n" +
      "- Untuk perpanjangan: paspor lama asli dan fotocopy",
    sortOrder: 7,
  },
  {
    category: "UMRAH",
    question: "Bagaimana proses pembuatan paspor secara mandiri?",
    answer:
      "Proses pembuatan paspor mandiri oleh jamaah:\n" +
      '1. Download aplikasi "Layanan Paspor Online" di Playstore\n' +
      "2. Daftar akun dan pilih Kantor Imigrasi terdekat\n" +
      "3. Datang sesuai jadwal dengan dokumen asli dan fotocopy 2 rangkap\n" +
      "4. Wawancara, foto, dan sidik jari\n" +
      '5. Bayar setelah mendapat "Bukti Pengantar Pembayaran"\n' +
      "6. Paspor jadi 5-7 hari setelah pembayaran.",
    sortOrder: 8,
  },
  {
    category: "UMRAH",
    question: "Bagaimana ketentuan nama paspor untuk visa umroh?",
    answer:
      "Untuk visa umroh, nama jamaah minimal 3 kata. Jika paspor hanya 1 kata, perlu proses penambahan nama di Kantor Imigrasi sebelum visa bisa diproses.\n\n" +
      "Jika nama hanya 1 kata, bisa ditambahkan nama Ayah dan nama Kakek dari pihak Ayah sesuai KK, Akta, atau Buku Nikah.",
    sortOrder: 9,
  },
  {
    category: "UMRAH",
    question: "Berapa masa berlaku paspor yang aman untuk umroh?",
    answer:
      "Masa berlaku paspor minimal 8-12 bulan dari tanggal keberangkatan. Ikuti masa berlaku yang diminta pada syarat paket karena kebutuhan dokumen bisa berbeda mengikuti ketentuan perjalanan.",
    sortOrder: 10,
  },
  {
    category: "UMRAH",
    question: "Di mana jamaah bisa melakukan vaksin meningitis?",
    answer:
      "Vaksin meningitis atau Buku Kuning ICV bisa dilakukan di Kantor Kesehatan Pelabuhan (KKP) terdekat, atau rumah sakit / klinik yang bersertifikat ICV.",
    sortOrder: 11,
  },
  {
    category: "UMRAH",
    question: "Dokumen apa yang dibawa saat vaksin meningitis di KKP?",
    answer:
      "Dokumen yang dibawa ke KKP:\n" +
      "- Tanda terima pendaftaran online\n" +
      "- Fotocopy paspor\n" +
      "- Fotocopy KTP\n" +
      "- Foto 4x6 2 lembar dengan background putih\n\n" +
      "Daftar online KKP: https://kespel.kemkes.go.id/vaksinasi_int/vaksinasi_int_public/add",
    sortOrder: 12,
  },
  {
    category: "UMRAH",
    question:
      "Kapan waktu terbaik vaksin meningitis dan berapa masa berlakunya?",
    answer:
      "Waktu terbaik vaksin adalah paling lambat 2 minggu sebelum keberangkatan karena kekebalan terbentuk dalam 2 minggu.\n\n" +
      "Masa berlaku Buku Kuning adalah 2 tahun. Jika jamaah sudah punya Buku Hijau Haji yang masih berlaku dan memuat data meningitis, dokumen tersebut bisa digunakan.\n\n" +
      "Catatan: biaya vaksin meningitis dan polio tidak termasuk dalam paket umroh, sehingga ditanggung sendiri oleh jamaah.",
    sortOrder: 13,
  },
  {
    category: "GENERAL",
    question: "Apa saja kontak resmi Sahabat Qolbu?",
    answer:
      "Kontak resmi Sahabat Qolbu:\n" +
      "- WhatsApp Hotline: 0812 4000 0101\n" +
      "- Admin Konfirmasi DP/Pembayaran: 0896 5919 5000\n" +
      "- Website: sahabatqolbu.com\n" +
      "- Instagram: @sahabatqolbu.official\n" +
      "- Alamat: Ruko Jl. Ebony, Metland Transyogi No.11, Cileungsi, Bogor 16820",
    sortOrder: 14,
  },
];

const obsoleteQuestions = [
  "Dokumen apa saja yang harus disiapkan saat pendaftaran?",
  "Apa saja syarat jamaah untuk mendaftar paket umroh?",
  "Apa syarat dan alur pembuatan paspor untuk umroh?",
  "Berapa ketentuan nama paspor untuk visa umroh?",
  "Bagaimana aturan vaksin meningitis untuk jamaah umroh?",
];

async function seedFaqs() {
  console.log("Seeding public FAQs...");

  const managedQuestions = [
    ...obsoleteQuestions,
    ...faqSeedItems.map((item) => item.question),
  ];

  await db.delete(faqs).where(inArray(faqs.question, managedQuestions));
  await db.insert(faqs).values(
    faqSeedItems.map((item) => ({
      ...item,
      isActive: true,
    })),
  );

  console.log(`FAQ sync completed (${faqSeedItems.length} active items).`);
  process.exit(0);
}

seedFaqs().catch((error) => {
  console.error("FAQ seed failed:", error);
  process.exit(1);
});
