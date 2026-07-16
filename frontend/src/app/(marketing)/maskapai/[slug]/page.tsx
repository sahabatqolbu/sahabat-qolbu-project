import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Plane } from "lucide-react";
import {
  getPublicAirlineDetail,
  parseEntityIdFromSlug,
  slugifyPackageName,
} from "@/lib/public-api";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AirlineDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  if (!id) notFound();
  const detail = await getPublicAirlineDetail(id);
  if (!detail) notFound();
  const { airline, articles, packages } = detail;

  return (
    <main className="min-h-screen bg-white pt-24 text-neutral-800">
      <section className="border-b border-neutral-200 bg-neutral-50 py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <Link
              href="/paket"
              className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Paket
            </Link>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
              Maskapai
            </p>
            <h1 className="mt-3 text-4xl font-extrabold text-primary md:text-5xl">
              {airline.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3">
              {airline.code ? (
                <span className="inline-flex rounded-sm border border-neutral-200 bg-white px-4 py-2 font-bold text-primary">
                  Kode: {airline.code}
                </span>
              ) : null}
              {airline.country ? (
                <span className="inline-flex rounded-sm border border-neutral-200 bg-white px-4 py-2 font-bold text-primary">
                  {airline.country}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex min-h-56 items-center justify-center rounded-sm border border-neutral-200 bg-white p-8 shadow-lg shadow-primary/10">
            {airline.logo ? (
              <img
                src={airline.logo}
                alt={airline.name || "Maskapai"}
                className="max-h-40 w-full object-contain"
              />
            ) : (
              <Plane className="h-16 w-16 text-gold" />
            )}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <article className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-primary">
              Artikel Terkait Maskapai
            </h2>
            {articles.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="rounded-sm border border-neutral-200 p-4 transition hover:border-gold hover:shadow-sm"
                  >
                    <FileText className="h-5 w-5 text-gold" />
                    <h3 className="mt-3 font-extrabold text-primary">
                      {article.title}
                    </h3>
                    {article.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                        {article.excerpt}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-neutral-600">
                Belum ada artikel terkait maskapai ini.
              </p>
            )}
          </article>
          <aside className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm lg:self-start">
            <h2 className="text-xl font-extrabold text-primary">
              Paket dengan Maskapai Ini
            </h2>
            <div className="mt-5 space-y-3">
              {packages.length ? (
                packages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/paket/${slugifyPackageName(pkg.name || `paket-${pkg.id}`)}`}
                    className="block rounded-sm border border-neutral-200 p-4 font-bold text-primary transition hover:border-gold hover:text-gold"
                  >
                    {pkg.name}
                  </Link>
                ))
              ) : (
                <p className="text-neutral-600">
                  Belum ada paket published yang memakai maskapai ini.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
