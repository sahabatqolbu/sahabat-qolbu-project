"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Loader2, Search } from "lucide-react";
import {
  getPublicArticles,
  PublicArticle,
  resolveAssetUrl,
} from "@/lib/public-api";

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

const normalize = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .trim();

function ArticleCard({ article }: { article: PublicArticle }) {
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    >
      {article.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAssetUrl(article.coverImage)}
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
  );
}

function ArticleSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-neutral-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-gold/20" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export default function ArticleIndexClient() {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadArticles = async () => {
      try {
        setIsLoading(true);
        const rows = await getPublicArticles("limit=100");
        if (mounted) {
          setArticles(rows);
          setError("");
        }
      } catch {
        if (mounted) {
          setError("Artikel belum bisa dimuat. Silakan coba lagi nanti.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadArticles();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    const keyword = normalize(search);
    if (!keyword) return articles;

    return articles.filter((article) => {
      const haystack = [
        article.title,
        article.excerpt,
        article.category,
        ...(Array.isArray(article.tags) ? article.tags : []),
      ]
        .map(normalize)
        .join(" ");
      return haystack.includes(keyword);
    });
  }, [articles, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-sm border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Cari artikel</p>
          <p className="text-sm text-neutral-500">
            Temukan panduan hotel, maskapai, dokumen, dan persiapan umroh.
          </p>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul, kategori, atau topik..."
            className="w-full rounded-sm border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {isLoading ? (
        <div>
          <div className="mb-6 flex items-center gap-3 text-sm font-bold text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat artikel...
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArticleSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-sm border border-red-200 bg-red-50 p-10 text-center text-red-700">
          {error}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-sm border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          {articles.length === 0
            ? "Belum ada artikel published."
            : "Artikel tidak ditemukan untuk pencarian tersebut."}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
