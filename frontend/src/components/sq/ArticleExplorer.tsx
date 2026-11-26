"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getPublicArticlesPage, type PublicArticle } from "@/lib/public-api";
import ArticleCard, { articleDate, categoryLabel, readingMinutes } from "./ArticleCard";
import { IconSearch } from "./icons";
import { PageHead } from "./ui";

const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "UMRAH", label: "Umroh" },
  { id: "HOTEL", label: "Hotel" },
  { id: "MASKAPAI", label: "Maskapai" },
];
const PAGE_SIZE = 13;

export default function ArticleExplorer({ initial, total }: { initial: PublicArticle[]; total: number }) {
  const [articles, setArticles] = useState(initial);
  const [count, setCount] = useState(total);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const first = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let active = true;
    const params = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE) });
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    setLoading(true);
    setError("");
    getPublicArticlesPage(params.toString())
      .then((result) => {
        if (!active) return;
        setArticles(result.articles);
        setCount(result.pagination.total || result.articles.length);
        setPages(result.pagination.totalPages || 1);
        setPage(1);
      })
      .catch(() => active && setError("Artikel gagal dimuat. Coba lagi sebentar."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, search]);

  const loadMore = async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: String(PAGE_SIZE) });
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    setLoading(true);
    try {
      const result = await getPublicArticlesPage(params.toString());
      setArticles((list) => [...list, ...result.articles.filter((a) => !list.some((b) => b.id === a.id))]);
      setPage((p) => p + 1);
    } catch {
      setError("Artikel gagal dimuat. Coba lagi sebentar.");
    } finally {
      setLoading(false);
    }
  };

  const [featured, ...rest] = articles;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  return (
    <>
      <PageHead
        image="/sq/clock-tower.webp"
        crumbs={[{ href: "/", label: "Beranda" }, { label: "Artikel" }]}
        title="Artikel dan panduan umroh"
        lead="Tuntunan ibadah sesuai sunnah, ulasan hotel di Makkah dan Madinah, dan tips persiapan dari tim Sahabat Qolbu."
      >
        <form className="search hsearch" role="search" onSubmit={submit}>
          <IconSearch />
          <label htmlFor="artikel-cari" className="sr-only">Cari artikel</label>
          <input id="artikel-cari" type="search" placeholder="Cari: puasa, Abraj Taba, lansia" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-gold" type="submit">Cari</button>
        </form>
      </PageHead>
      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="bar">
            <div className="tabs" role="tablist" aria-label="Kategori artikel">
              {CATEGORIES.map((c) => (
                <button key={c.id} className="tab" type="button" role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <span style={{ color: "var(--muted)", fontSize: 15 }} aria-live="polite">
              {loading ? "Memuat..." : `${count} artikel`}
            </span>
          </div>
          {error ? <div className="empty" style={{ marginTop: 24 }}><b>{error}</b></div> : null}
          {featured ? (
            <Link className="feat" href={`/artikel/${featured.slug}`} style={{ marginTop: 28 }}>
              <div className="cover">
                {featured.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.coverImage} alt="" />
                ) : null}
              </div>
              <div className="pb">
                <span className="cat gold">Terbaru, {categoryLabel(featured.category)}</span>
                <h2>{featured.title}</h2>
                {featured.excerpt ? <p>{featured.excerpt}</p> : null}
                <div style={{ fontSize: 14, color: "var(--muted)" }}>
                  {articleDate(featured)}, {readingMinutes(featured.content || featured.excerpt)} menit baca
                </div>
              </div>
            </Link>
          ) : !loading && !error ? (
            <div className="empty" style={{ marginTop: 24 }}>
              <b>Artikel tidak ditemukan</b>Coba kata kunci lain atau pilih kategori Semua.
            </div>
          ) : null}
          <div className="grid3" style={{ marginTop: 24 }}>
            {rest.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
          {page < pages ? (
            <div className="more">
              <button className="btn btn-navy" type="button" onClick={loadMore} disabled={loading}>
                {loading ? "Memuat..." : "Muat artikel lainnya"}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
