import type { Metadata } from "next";
import SectionNav from "@/components/sq/SectionNav";
import { IconCalendar } from "@/components/sq/icons";
import { PageHead } from "@/components/sq/ui";
import { getPublicCompanyProfile } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Sahabat Qolbu",
  description:
    "Kebijakan privasi Sahabat Qolbu terkait pengumpulan, penggunaan, dan perlindungan data calon jamaah dan jamaah.",
  alternates: { canonical: "https://sahabatqolbu.com/kebijakan-privasi" },
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

export default async function PrivacyPolicyPage() {
  const company = await getPublicCompanyProfile();
  const address = [company?.address, company?.city, company?.postalCode].filter(Boolean).join(", ");
  const toc = sections.map((section, i) => ({ id: `k${i + 1}`, label: section.title }));
  return (
    <>
      <PageHead
        image="/sq/clock-tower.webp"
        crumbs={[{ href: "/", label: "Beranda" }, { label: "Kebijakan Privasi" }]}
        title="Kebijakan privasi"
        lead="Bagaimana Sahabat Qolbu mengumpulkan, menggunakan, menyimpan, dan melindungi data calon jamaah dan jamaah."
      >
        <div className="hchips"><span><IconCalendar />Terakhir diperbarui 14 Juli 2026</span></div>
      </PageHead>
      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout narrow">
          <aside className="sticky">
            <nav className="panel" aria-label="Daftar isi" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16 }}>Daftar isi</h2>
              <SectionNav items={toc} variant="toc" />
            </nav>
          </aside>
          <div>
            <p className="note">
              Dengan menggunakan website, dashboard, atau layanan Sahabat Qolbu, Anda dianggap telah membaca dan memahami kebijakan privasi ini.
            </p>
            <div className="policy">
              {sections.map((section, i) => (
                <section id={`k${i + 1}`} key={section.title}>
                  <h2><span>{i + 1}</span>{section.title.replace(/^\d+\.\s*/, "")}</h2>
                  {section.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
            </div>
            <div className="help" style={{ marginTop: 20 }}>
              <h3>Kontak resmi untuk urusan data</h3>
              <dl>
                {company?.whatsapp ? <div><dt>WhatsApp</dt><dd>{company.whatsapp}</dd></div> : null}
                {company?.email ? <div><dt>Email</dt><dd style={{ overflowWrap: "anywhere" }}>{company.email}</dd></div> : null}
                {address ? <div><dt>Alamat</dt><dd>{address}</dd></div> : null}
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
