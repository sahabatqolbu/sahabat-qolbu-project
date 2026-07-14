import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function NotFoundPage() {
  const waMessage = encodeURIComponent(
    "Assalamualaikum, saya membuka website sahabatqolbu.com tapi halaman yang saya cari tidak ditemukan. Mohon dibantu.",
  );

  return (
    <div className="landing-static min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="relative min-h-screen overflow-hidden bg-primary pt-28 text-white md:pt-36">
          <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-black/20 blur-3xl" />

          <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                Halaman Tidak Ditemukan
              </span>
              <h1 className="mt-6 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl md:text-7xl">
                404
              </h1>
              <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                Sepertinya halaman ini sudah pindah atau belum tersedia.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-gray-200 md:text-lg">
                Tidak apa-apa, Anda masih bisa kembali ke halaman utama, melihat
                daftar paket umroh, atau langsung menghubungi tim Sahabat Qolbu
                untuk dibantu.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-gold px-7 py-4 text-base font-bold text-primary shadow-lg shadow-gold/20 transition hover:bg-gold-dark"
                >
                  Kembali ke Beranda
                </Link>
                <Link
                  href="/paket"
                  className="inline-flex items-center justify-center rounded-md border border-white/25 px-7 py-4 text-base font-bold text-white transition hover:bg-white hover:text-primary"
                >
                  Lihat Paket Umroh
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/10 md:p-8">
              <div className="rounded-lg bg-white p-6 text-primary">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
                  Butuh Bantuan?
                </p>
                <h3 className="mt-3 text-2xl font-bold">
                  Tim kami siap bantu arahkan ke halaman yang benar.
                </h3>
                <div className="mt-6 space-y-4 text-sm leading-6 text-gray-600">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="font-semibold text-primary">
                      Ingin lihat paket?
                    </p>
                    <p>
                      Pilih menu Paket Umroh untuk melihat jadwal dan harga.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="font-semibold text-primary">
                      Link dari admin tidak terbuka?
                    </p>
                    <p>
                      Kirim screenshot atau link tersebut ke WhatsApp hotline.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/6281240000101?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 font-bold text-white transition hover:bg-primary-700"
                >
                  Hubungi via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
