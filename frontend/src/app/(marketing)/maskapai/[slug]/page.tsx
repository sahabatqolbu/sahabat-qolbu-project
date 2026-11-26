import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/sq/ArticleCard";
import Markdown from "@/components/sq/Markdown";
import { WaLink } from "@/components/sq/chrome";
import { IconCheck, IconPlane, IconWa } from "@/components/sq/icons";
import { PackageCard, PageHead, rupiah, titleCase, viewPackage } from "@/components/sq/ui";
import { getPublicAirlineDetail, parseEntityIdFromSlug, toMarketingPackage } from "@/lib/public-api";
import { safeJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const parseList = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // bukan JSON
  }
  return value.split(/\r?\n|•/).map((item) => item.replace(/^[-*\s]+/, "").trim()).filter(Boolean);
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  const detail = id ? await getPublicAirlineDetail(id) : null;
  if (!detail) return { title: "Maskapai Tidak Ditemukan | Sahabat Qolbu" };
  const name = String(detail.airline.name || "Maskapai");
  const title = `Umroh dengan ${name} | Sahabat Qolbu`;
  const description = `Paket umroh Sahabat Qolbu dengan ${name}: rute, jadwal keberangkatan, dan artikel terkait.`;
  return { title, description, alternates: { canonical: `/maskapai/${slug}` }, openGraph: { title, description } };
}

export default async function AirlinePage({ params }: { params: Params }) {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  if (!id) notFound();
  const detail = await getPublicAirlineDetail(id);
  if (!detail) notFound();

  const { airline, articles } = detail;
  const name = String(airline.name || "Maskapai");
  const rank: Record<string, number> = { open: 0, soon: 1, full: 2, closed: 2, departed: 3 };
  const views = detail.packages
    .map(toMarketingPackage)
    .map(viewPackage)
    .sort((a, b) => {
      const r = (rank[a.state] ?? 4) - (rank[b.state] ?? 4);
      if (r) return r;
      return a.state === "departed"
        ? (b.pkg.departureDate || "").localeCompare(a.pkg.departureDate || "")
        : (a.pkg.departureDate || "").localeCompare(b.pkg.departureDate || "");
    });
  const upcoming = views.filter((v) => v.open).sort((a, b) => (a.pkg.departureDate || "").localeCompare(b.pkg.departureDate || ""));
  const facilities = parseList(airline.facilities);
  const routes = [...new Set(upcoming.map((v) => [v.pkg.route?.arrivalCode, v.pkg.route?.returnCode].filter(Boolean).join(" / ")).filter(Boolean))];
  const next = upcoming[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Airline",
    name,
    iataCode: airline.code || undefined,
    logo: airline.logo || undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <PageHead
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/paket", label: "Paket Umroh" }, { label: name }]}
        eyebrow="Maskapai"
        title={name}
        logo={airline.logo || undefined}
      >
        <div className="hchips">
          {airline.code ? <span>Kode penerbangan {airline.code}</span> : null}
          {airline.country ? <span>{airline.country}</span> : null}
        </div>
      </PageHead>

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout">
          <div>
            <div className="panel">
              <h2>Terbang dengan {name}</h2>
              {airline.description ? (
                <div className="prose" style={{ fontSize: 16, marginTop: 12 }}><Markdown content={airline.description} /></div>
              ) : (
                <p>{name}{airline.code ? ` (kode ${airline.code})` : ""} adalah salah satu maskapai yang dipakai dalam paket umroh Sahabat Qolbu.</p>
              )}
              {routes.length ? (
                <>
                  <h3 style={{ marginTop: 26 }}>Bandara tujuan di paket terdekat</h3>
                  <div className="route" style={{ marginTop: 16 }}>
                    <div><b>ID</b><small>Indonesia</small></div>
                    <div className="line"><IconPlane className="" /></div>
                    <div><b>{routes[0]}</b><small>Arab Saudi</small></div>
                  </div>
                </>
              ) : null}
              {facilities.length ? (
                <>
                  <h3 style={{ marginTop: 26 }}>Fasilitas</h3>
                  <ul className="ticks two">{facilities.map((f) => <li key={f}><IconCheck /><span>{f}</span></li>)}</ul>
                </>
              ) : null}
            </div>
          </div>
          <aside className="sticky lift">
            <div className="panel side">
              <h2 style={{ fontSize: 20 }}>{next ? "Paket terdekat" : "Tanya jadwal"}</h2>
              {next ? (
                <>
                  <p style={{ fontSize: 15 }}>{titleCase(next.pkg.name)}, {next.date}, {next.days} hari.</p>
                  <div className="total" style={{ marginTop: 12 }}><span style={{ color: "var(--muted)" }}>Mulai</span><b>{rupiah(next.price)}</b></div>
                  <Link className="btn btn-gold" href={next.href}>Lihat paket</Link>
                </>
              ) : (
                <p style={{ fontSize: 15 }}>Belum ada jadwal terbuka dengan maskapai ini. Admin bisa bantu carikan.</p>
              )}
              <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin paket umroh dengan ${name}`}><IconWa />Tanya admin</WaLink>
            </div>
          </aside>
        </div>
      </section>

      {views.length ? (
        <section className="sec sandband">
          <div className="wrap">
            <div className="head">
              <div>
                <h2 className="h2">Paket bersama {name}</h2>
                <p className="lead">{upcoming.length ? `${upcoming.length} jadwal masih tersedia.` : "Belum ada jadwal terbuka."} Jadwal yang sudah lewat tetap ditampilkan sebagai riwayat.</p>
              </div>
              <Link className="btn btn-line" href="/paket">Semua paket</Link>
            </div>
            <div className="cards">
              {views.map((v) => <PackageCard key={v.pkg.id} view={v} />)}
            </div>
          </div>
        </section>
      ) : null}

      {articles.length ? (
        <section className="sec">
          <div className="wrap">
            <h2 className="h2">Artikel tentang {name}</h2>
            <div className="grid3" style={{ marginTop: 32 }}>
              {articles.slice(0, 6).map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
