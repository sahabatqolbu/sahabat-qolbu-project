import type { Metadata } from "next";
import Link from "next/link";
import ArticleExplorer from "@/components/sq/ArticleExplorer";
import { WaLink } from "@/components/sq/chrome";
import { Closing } from "@/components/sq/ui";
import { getPublicArticlesPage } from "@/lib/public-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Artikel Umroh | Sahabat Qolbu",
  description:
    "Panduan ibadah umroh sesuai sunnah, ulasan hotel Makkah dan Madinah, serta tips persiapan perjalanan dari Sahabat Qolbu.",
  alternates: { canonical: "/artikel" },
};

export default async function ArticlesPage() {
  const { articles, pagination } = await getPublicArticlesPage("page=1&limit=13");
  return (
    <>
      <ArticleExplorer initial={articles} total={pagination.total || articles.length} />
      <Closing
        title="Siap berangkat setelah membaca?"
        text="Lihat jadwal umroh terdekat atau tanyakan langsung ke admin kami."
        primary={<Link className="btn btn-gold" href="/paket">Lihat jadwal paket</Link>}
        secondary={<WaLink className="btn btn-ghost">Konsultasi via WhatsApp</WaLink>}
      />
    </>
  );
}
