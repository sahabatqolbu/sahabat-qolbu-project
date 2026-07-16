import ArticleIndexClient from "@/components/marketing/ArticleIndexClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Artikel Umroh | Sahabat Qolbu",
  description:
    "Artikel edukasi seputar umroh, hotel, maskapai, dan layanan Sahabat Qolbu.",
};

export default function ArtikelPage() {
  return (
    <main className="min-h-screen bg-white pt-24 text-neutral-800">
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-gold">
            Artikel
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-primary md:text-5xl">
            Panduan & Informasi Umroh
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-neutral-600">
            Kenali fasilitas, hotel, maskapai, dan panduan perjalanan sebelum
            memilih paket.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <ArticleIndexClient />
      </section>
    </main>
  );
}
