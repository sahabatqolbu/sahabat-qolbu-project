import Link from "next/link";
import type { PublicArticle } from "@/lib/public-api";

export const CATEGORY_LABELS: Record<string, string> = {
  UMRAH: "Umroh",
  HAJI: "Haji",
  HOTEL: "Hotel",
  MASKAPAI: "Maskapai",
  AIRLINE: "Maskapai",
  TIPS: "Tips",
  GENERAL: "Umum",
};

export const categoryLabel = (value?: string | null) =>
  CATEGORY_LABELS[String(value || "").toUpperCase()] ||
  String(value || "Artikel").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export const articleDate = (article: PublicArticle) => {
  const value = article.publishedAt || article.createdAt;
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

export const readingMinutes = (text?: string | null) =>
  Math.max(2, Math.round(String(text || "").split(/\s+/).length / 200));

export default function ArticleCard({ article }: { article: PublicArticle }) {
  return (
    <Link className="post" href={`/artikel/${article.slug}`}>
      <div className="cover">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImage} alt="" loading="lazy" />
        ) : null}
      </div>
      <div className="pb">
        <span className="cat">{categoryLabel(article.category)}</span>
        <h3>{article.title}</h3>
        {article.excerpt ? <p>{article.excerpt}</p> : null}
        <div className="pm">
          <span>{articleDate(article)}</span>
          <span>{readingMinutes(article.content || article.excerpt)} menit baca</span>
        </div>
      </div>
    </Link>
  );
}
