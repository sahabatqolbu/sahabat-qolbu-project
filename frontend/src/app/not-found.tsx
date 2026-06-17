import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-primary">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-secondary blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-primary-300 blur-3xl" />
      </div>

      <section className="container-custom relative z-10 flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-white backdrop-blur-sm md:p-12">
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-secondary">ERROR 404</p>
          <h1 className="mb-4 text-4xl font-bold md:text-6xl">Halaman Tidak Ditemukan</h1>
          <p className="mx-auto mb-8 max-w-2xl text-white/85 md:text-lg">
            Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/landing" className="btn-primary">
              Kembali ke Beranda
            </Link>
            <Link href="/landing/paket" className="btn-outline-white">
              Lihat Paket Umroh
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
