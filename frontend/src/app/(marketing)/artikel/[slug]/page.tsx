import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPublicArticleBySlug, resolveAssetUrl } from "@/lib/public-api";

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

const markdownImagePattern = /!?\[([^\]]*)\]\(([^)]+)\)/g;

const renderArticleImage = (alt: string, src: string, key: string) => (
  <figure
    key={key}
    className="my-8 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={resolveAssetUrl(src) || src}
      alt={alt || "Gambar artikel"}
      className="h-auto w-full object-contain"
    />
    {alt ? (
      <figcaption className="px-4 py-3 text-sm text-neutral-500">
        {alt}
      </figcaption>
    ) : null}
  </figure>
);

const renderContentBlock = (block: string, index: number) => {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const matches = Array.from(block.matchAll(markdownImagePattern));

  if (!matches.length) {
    return (
      <p
        key={`${block}-${index}`}
        className="whitespace-pre-line leading-8 text-neutral-700"
      >
        {block}
      </p>
    );
  }

  matches.forEach((match, matchIndex) => {
    const start = match.index ?? 0;
    const text = block.slice(lastIndex, start).trim();
    if (text) {
      parts.push(
        <p
          key={`text-${index}-${matchIndex}`}
          className="whitespace-pre-line leading-8 text-neutral-700"
        >
          {text}
        </p>,
      );
    }

    parts.push(
      renderArticleImage(
        match[1],
        match[2],
        `image-${index}-${matchIndex}-${match[2]}`,
      ),
    );
    lastIndex = start + match[0].length;
  });

  const tail = block.slice(lastIndex).trim();
  if (tail) {
    parts.push(
      <p
        key={`tail-${index}`}
        className="whitespace-pre-line leading-8 text-neutral-700"
      >
        {tail}
      </p>,
    );
  }

  return (
    <div key={`${block}-${index}`} className="space-y-6">
      {parts}
    </div>
  );
};

const renderContent = (content: string) =>
  content.split(/\n{2,}/).map((block, index) => renderContentBlock(block, index));

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

  return (
    <main className="min-h-screen bg-white pt-24 text-neutral-800">
      <article>
        <header className="border-b border-neutral-200 bg-neutral-50 py-10 md:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/artikel"
              className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" /> Semua Artikel
            </Link>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
              {article.category || "Artikel"}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-primary md:text-5xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-5 text-lg leading-8 text-neutral-600">
                {article.excerpt}
              </p>
            ) : null}
            <p className="mt-5 flex items-center gap-2 text-sm font-bold text-neutral-500">
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
        <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-base sm:px-6 lg:px-8">
          {renderContent(article.content)}
        </section>
      </article>
    </main>
  );
}
