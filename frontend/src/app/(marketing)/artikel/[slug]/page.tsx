import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard, { categoryLabel } from "@/components/sq/ArticleCard";
import Markdown, { headingSlug } from "@/components/sq/Markdown";
import SectionNav from "@/components/sq/SectionNav";
import ShareButtons from "@/components/sq/ShareButtons";
import { IconCalendar, IconClock, IconUsers } from "@/components/sq/icons";
import { PageHead, rupiah, titleCase, viewPackage } from "@/components/sq/ui";
import {
  getMarketingPackageById,
  getMarketingPackages,
  getPublicAirlineDetail,
  getPublicArticleBySlug,
  getPublicArticles,
  getPublicHotelDetail,
  slugifyPackageName,
} from "@/lib/public-api";
import { safeJsonLd } from "@/lib/seo";

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
    .replace(/^[\u2022\-]\s+/gm, "- ")
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
  const title = article.seoTitle || `${article.title} | Sahabat Qolbu`;
  const description = article.seoDescription || article.excerpt || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/artikel/${slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      url: `https://sahabatqolbu.com/artikel/${slug}`,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) notFound();

  const [latest, relatedPackages, allPackages] = await Promise.all([
    getPublicArticles(`limit=7${article.category ? `&category=${encodeURIComponent(article.category)}` : ""}`),
    getRelatedPackages(article.relatedType, article.relatedId),
    getMarketingPackages(),
  ]);
  const related = latest.filter((item) => item.slug !== article.slug).slice(0, 3);
  const content = prepareArticleContent(article.content || "", article.title);
  const minutes = estimateReadingTime(content);
  const toc = content
    .split(/\r?\n/)
    .map((line) => line.match(/^#{1,2}\s+(.+)$/)?.[1]?.replace(/[*_`]/g, "").trim())
    .filter((text): text is string => Boolean(text))
    .map((text) => ({ id: headingSlug(text), label: text.length > 48 ? `${text.slice(0, 46)}...` : text }))
    .filter((item, index, all) => item.id && all.findIndex((x) => x.id === item.id) === index);
  const sidePackages = relatedPackages.length
    ? relatedPackages.slice(0, 4).map((p) => ({ href: `/paket/${slugifyPackageName(p.name)}`, name: titleCase(p.name), sub: formatDate(p.departureDate), price: formatPrice(p.price) }))
    : allPackages
        .map(viewPackage)
        .filter((v) => v.open)
        .sort((a, b) => (a.pkg.departureDate || "").localeCompare(b.pkg.departureDate || ""))
        .slice(0, 4)
        .map((v) => ({ href: v.href, name: titleCase(v.pkg.name), sub: `${v.date}, ${v.days} hari`, price: v.price ? rupiah(v.price) : null }));
  const url = `https://sahabatqolbu.com/artikel/${article.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.seoDescription || undefined,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.publishedAt || article.createdAt,
    author: { "@type": "Organization", name: "Sahabat Qolbu", url: "https://sahabatqolbu.com" },
    publisher: { "@id": "https://sahabatqolbu.com/#organization" },
    mainEntityOfPage: url,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://sahabatqolbu.com" },
      { "@type": "ListItem", position: 2, name: "Artikel", item: "https://sahabatqolbu.com/artikel" },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <PageHead
        image={article.coverImage || "/sq/clock-tower.webp"}
        busy={Boolean(article.coverImage)}
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/artikel", label: "Artikel" }, { label: categoryLabel(article.category) }]}
        eyebrow={categoryLabel(article.category)}
        title={article.title}
      >
        <div className="byline">
          {formatDate(article.publishedAt || article.createdAt) ? <span><IconCalendar />{formatDate(article.publishedAt || article.createdAt)}</span> : null}
          <span><IconClock />{minutes} menit baca</span>
          <span><IconUsers />Tim Sahabat Qolbu</span>
        </div>
      </PageHead>

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout">
          <article className="prose">
            {article.coverImage ? (
              <figure className="cover-fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.coverImage} alt={article.title} />
              </figure>
            ) : null}
            <Markdown content={content} headingIds />
            {article.tags?.length ? <p style={{ fontSize: 15, color: "var(--muted)" }}>Tag: {article.tags.join(", ")}</p> : null}
            <ShareButtons title={article.title} url={url} />
          </article>

          <aside className="sticky" style={{ display: "grid", gap: 20 }}>
            {toc.length > 1 ? (
              <nav className="panel" aria-label="Daftar isi">
                <h2 style={{ fontSize: 18 }}>Daftar isi</h2>
                <SectionNav items={toc} variant="toc" />
              </nav>
            ) : null}
            {sidePackages.length ? (
              <div className="panel">
                <h2 style={{ fontSize: 18 }}>{relatedPackages.length ? "Paket terkait" : "Jadwal umroh terdekat"}</h2>
                <div className="mini">
                  {sidePackages.map((p) => (
                    <Link key={p.href + p.name} href={p.href}>
                      <span><b>{p.name}</b><small>{p.sub}</small></span>
                      {p.price ? <span>{p.price}</span> : null}
                    </Link>
                  ))}
                </div>
                <Link className="btn btn-gold" href="/paket" style={{ width: "100%", marginTop: 16 }}>Lihat semua paket</Link>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="sec sandband">
          <div className="wrap">
            <div className="head">
              <h2 className="h2">Artikel terkait</h2>
              <Link className="btn btn-line" href="/artikel">Semua artikel</Link>
            </div>
            <div className="grid3" style={{ marginTop: 32 }}>
              {related.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
