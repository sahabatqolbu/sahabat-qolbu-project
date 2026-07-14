import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Sahabat Qolbu",
  description:
    "Kebijakan privasi Sahabat Qolbu terkait pengumpulan, penggunaan, dan perlindungan data calon jamaah dan jamaah.",
  alternates: {
    canonical: "https://sahabatqolbu.com/kebijakan-privasi",
  },
};

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: [
      "Kami dapat mengumpulkan data yang Anda berikan melalui website, formulir pendaftaran, WhatsApp, dashboard, atau komunikasi resmi Sahabat Qolbu.",
      "Data tersebut dapat mencakup nama, nomor telepon, email, alamat, data identitas, dokumen perjalanan, pilihan paket, riwayat konsultasi, dan informasi pembayaran yang diperlukan untuk proses layanan umroh.",
    ],
  },
  {
    title: "2. Penggunaan Data",
    content: [
      "Data digunakan untuk memproses konsultasi, pendaftaran, pemilihan paket, pengurusan dokumen, konfirmasi pembayaran, pemberangkatan, layanan jamaah, dan komunikasi resmi Sahabat Qolbu.",
      "Kami juga dapat menggunakan data untuk peningkatan layanan, pengingat keberangkatan, informasi paket, serta kebutuhan administrasi internal yang relevan.",
    ],
  },
  {
    title: "3. Dokumen dan Data Sensitif",
    content: [
      "Dokumen seperti KTP, Kartu Keluarga, paspor, pas foto, bukti vaksin, dan bukti pembayaran diperlakukan sebagai data sensitif.",
      "Akses terhadap dokumen dibatasi hanya untuk pihak internal atau mitra operasional yang membutuhkan data tersebut dalam proses pelayanan jamaah.",
    ],
  },
  {
    title: "4. Pembagian Data kepada Pihak Terkait",
    content: [
      "Dalam proses layanan, data tertentu dapat dibagikan kepada pihak yang relevan seperti maskapai, hotel, penyedia visa, pembimbing perjalanan, penyedia pembayaran, atau pihak lain yang diperlukan untuk pelaksanaan perjalanan ibadah.",
      "Kami tidak menjual data pribadi jamaah kepada pihak ketiga.",
    ],
  },
  {
    title: "5. Keamanan Data",
    content: [
      "Kami menerapkan langkah teknis dan administratif yang wajar untuk menjaga keamanan data, termasuk pembatasan akses dan penggunaan sistem yang mendukung perlindungan data.",
      "Namun, tidak ada sistem elektronik yang sepenuhnya bebas risiko. Karena itu, jamaah juga diimbau untuk menjaga kerahasiaan akun, OTP, bukti pembayaran, dan dokumen pribadi.",
    ],
  },
  {
    title: "6. Cookie dan Teknologi Pelacakan",
    content: [
      "Website dapat menggunakan cookie atau teknologi serupa untuk menjaga sesi login, memahami performa halaman, meningkatkan pengalaman pengguna, dan menjaga keamanan layanan.",
      "Anda dapat mengatur cookie melalui pengaturan browser, namun beberapa fitur mungkin tidak berjalan optimal jika cookie dinonaktifkan.",
    ],
  },
  {
    title: "7. Komunikasi Resmi",
    content: [
      "Kami dapat menghubungi Anda melalui WhatsApp, telepon, email, dashboard, atau kanal resmi lain untuk kebutuhan konsultasi, pendaftaran, konfirmasi pembayaran, pembaruan paket, dan informasi keberangkatan.",
      "Pembayaran hanya dilakukan melalui rekening resmi PT. Sahabat Qolbu Cahaya Baitullah. Jangan melakukan transfer ke rekening pribadi pihak mana pun.",
    ],
  },
  {
    title: "8. Hak Pengguna",
    content: [
      "Anda dapat meminta pembaruan, koreksi, atau penghapusan data tertentu sejauh diperbolehkan oleh kebutuhan administrasi, regulasi, dan kewajiban operasional perjalanan.",
      "Permintaan terkait data dapat disampaikan melalui kontak resmi Sahabat Qolbu.",
    ],
  },
  {
    title: "9. Perubahan Kebijakan",
    content: [
      "Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu mengikuti kebutuhan layanan, sistem, atau ketentuan yang berlaku.",
      "Perubahan akan ditampilkan pada halaman ini dan berlaku sejak tanggal pembaruan dipublikasikan.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <section className="bg-primary pb-16 pt-28 text-white md:pb-20 md:pt-36">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Sahabat Qolbu
          </span>
          <h1 className="mt-4 text-3xl font-bold md:text-5xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-200 md:text-lg">
            Halaman ini menjelaskan bagaimana Sahabat Qolbu mengumpulkan,
            menggunakan, menyimpan, dan melindungi data calon jamaah dan jamaah.
          </p>
          <p className="mt-4 text-sm text-gray-300">
            Terakhir diperbarui: 14 Juli 2026
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <h2 className="font-bold text-primary">Kontak Resmi</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                <p>WhatsApp Hotline: 0812 4000 0101</p>
                <p>Admin Pembayaran: 0896 5919 5000</p>
                <p>Email: admin@sahabatqolbu.com</p>
                <p>
                  Alamat: Ruko Jl. Ebony, Metland Transyogi No.11, Cileungsi,
                  Bogor 16820
                </p>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-5 text-sm leading-7 text-primary">
              Dengan menggunakan website, dashboard, atau layanan Sahabat Qolbu,
              Anda dianggap telah membaca dan memahami Kebijakan Privasi ini.
            </div>

            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold text-primary">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-gray-600 md:text-base">
                  {section.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
