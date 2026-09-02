import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  getMarketingPackageById,
  getPublicArticleBySlug,
  getPublicArticles,
  getPublicAirlineDetail,
  getPublicHotelDetail,
  slugifyPackageName,
} from "@/lib/public-api";
import ArticleEngagement from "@/components/marketing/ArticleEngagement";
import { renderMarkdownContent } from "@/components/marketing/MarkdownContent";

type Params = Promise<{ slug: string }>;

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

const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
};

const normalizeComparableText = (value: string) =>
  value
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const prepareArticleContent = (content: string, title: string) => {
  const normalized = content
    .replace(/(\S)[ \t]+\*\*(?=[\s,.;:!?]|$)/g, "$1**")
    .replace(/(\S)[ \t]+\*(?=[\s,.;:!?]|$)/g, "$1*")
    .replace(/^•\s+/gm, "- ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  const lines = normalized.split("\n");
  const firstContentLine = lines.findIndex((line) => line.trim());

  if (firstContentLine >= 0) {
    const firstLine = lines[firstContentLine].trim();
    const heading =
      firstLine.match(/^#{1,4}\s+(.+)$/) ||
      firstLine.match(/^\*\*(.+)\*\*$/);
    if (
      heading &&
      normalizeComparableText(heading[1]) === normalizeComparableText(title)
    ) {
      lines.splice(firstContentLine, 1);
    }
  }

  return lines
    .map((line) => {
      const standaloneBold = line.trim().match(/^\*\*([^*]{2,90})\*\*$/);
      if (standaloneBold && !/[.!?]$/.test(standaloneBold[1])) {
        return `## ${standaloneBold[1]}`;
      }
      return line;
    })
    .join("\n")
    .trim();
};

type RelatedPackageSummary = {
  id: number;
  name: string;
  departureDate?: string | null;
  price?: string | number | null;
};

const formatPrice = (value?: string | number | null) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRelatedPackageTitle = (relatedType?: string | null) => {
  if (relatedType === "HOTEL") return "Paket yang Menggunakan Hotel Ini";
  if (relatedType === "AIRLINE") return "Paket yang Menggunakan Maskapai Ini";
  if (relatedType === "PACKAGE") return "Paket Terkait Artikel Ini";
  return "Paket yang Menggunakan Layanan Ini";
};

const getRelatedPackages = async (
  relatedType?: string | null,
  relatedId?: number | null,
): Promise<RelatedPackageSummary[]> => {
  if (!relatedType || !relatedId) return [];

  if (relatedType === "HOTEL") {
    const detail = await getPublicHotelDetail(relatedId);
    return (detail?.packages || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name || `Paket ${pkg.id}`,
      departureDate: pkg.departureDate,
      price: pkg.discountPrice || pkg.price,
    }));
  }

  if (relatedType === "AIRLINE") {
    const detail = await getPublicAirlineDetail(relatedId);
    return (detail?.packages || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name || `Paket ${pkg.id}`,
      departureDate: pkg.departureDate,
      price: pkg.discountPrice || pkg.price,
    }));
  }

  if (relatedType === "PACKAGE") {
    const pkg = await getMarketingPackageById(relatedId);
    return pkg
      ? [
          {
            id: pkg.id,
            name: pkg.name,
            departureDate: pkg.departureDate,
            price: pkg.discountedPrice || pkg.priceQuad,
          },
        ]
      : [];
  }

  return [];
};

const renderContent = (content: string) => renderMarkdownContent(content);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) return { title: "Artikel Tidak Ditemukan | Sahabat Qolbu" };
  return {
    title: article.seoTitle || `${article.title} | Sahabat Qolbu`,
    description: article.seoDescription || article.excerpt || undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) notFound();
  const relatedArticles = (await getPublicArticles("limit=6"))
    .filter((item) => item.slug !== article.slug)
    .slice(0, 4);
  const relatedPackages = await getRelatedPackages(
    article.relatedType,
    article.relatedId,
  );
  const preparedContent = prepareArticleContent(
    article.content || "",
    article.title,
  );
  const readingTime = estimateReadingTime(preparedContent);

  return (
    <main className="min-h-screen bg-[#f8faf8] pt-24 text-neutral-800">
      <article>
        <header className="relative overflow-hidden border-b border-primary/10 bg-primary py-10 text-white md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.28),transparent_34%)]" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/artikel"
              className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-gold transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Semua Artikel
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
                {article.category || "Artikel"}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white/75">
                <BookOpen className="h-4 w-4 text-gold" />
                {readingTime} menit baca
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight md:text-5xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">
                {article.excerpt}
              </p>
            ) : null}
            <p className="mt-5 flex items-center gap-2 text-sm font-bold text-white/70">
              <CalendarDays className="h-4 w-4" />
              {formatDate(article.publishedAt || article.createdAt)}
            </p>
          </div>
        </header>
        {article.coverImage ? (
          <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-auto w-full rounded-sm border border-neutral-200 object-contain shadow-lg shadow-primary/10"
            />
          </div>
        ) : null}
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-8">
            <div className="min-w-0 px-0 py-1 md:rounded-md md:border md:border-neutral-200 md:bg-white md:px-10 md:py-9 md:shadow-sm lg:px-12">
              <div className="mx-auto max-w-[780px] text-base">
                {renderContent(preparedContent)}
              </div>
            </div>

            <ArticleEngagement slug={article.slug} title={article.title} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            {relatedPackages.length ? (
              <div className="rounded-sm border border-gold/30 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-primary">
                  {getRelatedPackageTitle(article.relatedType)}
                </h2>
                <div className="mt-4 space-y-3">
                  {relatedPackages.slice(0, 4).map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/paket/${slugifyPackageName(pkg.name || `paket-${pkg.id}`)}`}
                      className="block rounded-sm border border-neutral-200 p-4 transition hover:border-gold hover:bg-gold/5"
                    >
                      <h3 className="font-extrabold leading-6 text-primary">
                        {pkg.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-neutral-500">
                        {pkg.departureDate ? (
                          <span>{formatDate(pkg.departureDate)}</span>
                        ) : null}
                        {formatPrice(pkg.price) ? (
                          <span className="text-gold">
                            {formatPrice(pkg.price)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-sm border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary">
                <FileText className="h-5 w-5 text-gold" />
                Artikel Lainnya
              </h2>
              <div className="mt-4 space-y-3">
                {relatedArticles.length ? (
                  relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/artikel/${item.slug}`}
                      className="group block rounded-sm border border-neutral-200 p-4 transition hover:border-gold hover:bg-gold/5"
                    >
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
                        {item.category || "Artikel"}
                      </p>
                      <h3 className="mt-2 line-clamp-2 font-extrabold leading-6 text-primary group-hover:text-gold">
                        {item.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                        Baca artikel
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">
                    Belum ada artikel lain.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-sm bg-primary p-5 text-white shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
                Butuh rekomendasi?
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                Konsultasikan pilihan paket dengan tim Sahabat Qolbu.
              </h2>
              <Link
                href="/#paket"
                className="mt-5 inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-3 font-extrabold text-primary transition hover:bg-white"
              >
                Lihat Paket Umroh
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </article>
    </main>
  );
}
