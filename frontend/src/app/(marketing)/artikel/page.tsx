import Link from "next/link";
import { CalendarDays, FileText } from "lucide-react";
import { getPublicArticles } from "@/lib/public-api";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Artikel Umroh | Sahabat Qolbu",
  description:
    "Artikel edukasi seputar umroh, hotel, maskapai, dan layanan Sahabat Qolbu.",
};

export default async function ArtikelPage() {
  const articles = await getPublicArticles("limit=100");

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {articles.length === 0 ? (
            <div className="rounded-sm border border-neutral-200 bg-white p-10 text-center text-neutral-500">
              Belum ada artikel published.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/artikel/${article.slug}`}
                  className="group overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                >
                  {article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-primary/5 text-primary">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                      {article.category || "Artikel"}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-xl font-extrabold text-primary group-hover:text-gold">
                      {article.title}
                    </h2>
                    {article.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">
                        {article.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-4 flex items-center gap-2 text-xs font-bold text-neutral-500">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
