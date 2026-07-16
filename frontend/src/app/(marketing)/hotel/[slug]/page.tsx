import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileText, MapPin, Star } from "lucide-react";
import {
  getPublicHotelDetail,
  parseEntityIdFromSlug,
  slugifyPackageName,
} from "@/lib/public-api";

type Params = Promise<{ slug: string }>;

const parseFacilities = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HotelDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  if (!id) notFound();
  const detail = await getPublicHotelDetail(id);
  if (!detail) notFound();
  const { hotel, articles, packages } = detail;
  const facilities = parseFacilities(hotel.facilities);

  return (
    <main className="min-h-screen bg-white pt-24 text-neutral-800">
      <section className="border-b border-neutral-200 bg-neutral-50 py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <Link
              href="/paket"
              className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Paket
            </Link>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
              Hotel {hotel.city || "Umroh"}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold text-primary md:text-5xl">
              {hotel.name}
            </h1>
            {hotel.address ? (
              <p className="mt-4 flex items-start gap-2 leading-7 text-neutral-600">
                <MapPin className="mt-1 h-5 w-5 text-gold" />
                {hotel.address}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-sm border border-neutral-200 bg-white px-4 py-2 font-bold text-primary">
                <Building2 className="h-4 w-4 text-gold" />
                {hotel.city}
              </span>
              <span className="inline-flex items-center gap-2 rounded-sm border border-neutral-200 bg-white px-4 py-2 font-bold text-primary">
                <Star className="h-4 w-4 fill-gold text-gold" />
                {hotel.starRating || "-"} Bintang
              </span>
              {hotel.distanceToHaram ? (
                <span className="inline-flex items-center gap-2 rounded-sm border border-neutral-200 bg-white px-4 py-2 font-bold text-primary">
                  {hotel.distanceToHaram}m dari masjid
                </span>
              ) : null}
            </div>
          </div>
          {hotel.imageUrl ? (
            <img
              src={hotel.imageUrl}
              alt={hotel.name || "Hotel"}
              className="h-auto w-full rounded-sm border border-neutral-200 bg-white object-contain shadow-lg shadow-primary/10"
            />
          ) : null}
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <article className="space-y-8">
            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-primary">
                Fasilitas Hotel
              </h2>
              {facilities.length ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {facilities.map((item) => (
                    <li
                      key={item}
                      className="rounded-sm bg-neutral-50 px-4 py-3 font-semibold text-neutral-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-neutral-600">
                  Informasi fasilitas akan dilengkapi oleh admin.
                </p>
              )}
            </div>
            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-primary">
                Artikel Terkait
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
                  Belum ada artikel terkait hotel ini.
                </p>
              )}
            </div>
          </article>
          <aside className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm lg:self-start">
            <h2 className="text-xl font-extrabold text-primary">
              Paket yang Menggunakan Hotel Ini
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
                  Belum ada paket published yang memakai hotel ini.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
