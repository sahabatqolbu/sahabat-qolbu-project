import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PdfItineraryPreview from "@/components/marketing/PdfItineraryPreview";
import ItineraryTimeline from "@/components/sq/ItineraryTimeline";
import { WaLink } from "@/components/sq/chrome";
import { IconWa } from "@/components/sq/icons";
import { PageHead, rupiah, titleCase, viewPackage } from "@/components/sq/ui";
import { getItineraryDownloadUrl, getItineraryPreviewUrl } from "@/lib/itinerary-url";
import { getMarketingPackageBySlug } from "@/lib/public-api";
import { normalizeItinerary } from "@/lib/sq-itinerary";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);
  if (!pkg || (!pkg.itinerary?.length && !pkg.itineraryPdf)) {
    return { title: "Itinerary Tidak Ditemukan | Sahabat Qolbu" };
  }
  const name = titleCase(pkg.name);
  return {
    title: `Itinerary ${name} | Sahabat Qolbu`,
    description: `Jadwal harian perjalanan ${name} dari Sahabat Qolbu.`,
    alternates: { canonical: getItineraryPreviewUrl(pkg.slug) },
    robots: { index: false, follow: true },
  };
}

const dayDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export default async function ItineraryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);
  if (!pkg || (!pkg.itinerary?.length && !pkg.itineraryPdf)) notFound();

  const days = normalizeItinerary(pkg.itinerary || []);
  const view = viewPackage(pkg);
  const name = titleCase(pkg.name);
  const nights = (city: string) => days.filter((d) => d.city === city).length;

  return (
    <>
      <PageHead
        image="/sq/clock-tower.webp"
        crumbs={[
          { href: "/", label: "Beranda" },
          { href: "/paket", label: "Paket Umroh" },
          { href: `/paket/${pkg.slug}`, label: name },
          { label: "Itinerary" },
        ]}
        title={`Itinerary ${days.length ? `${days.length} hari` : name}`}
        lead={`${name}, ${dayDate(pkg.departureDate)}${pkg.returnDate ? ` sampai ${dayDate(pkg.returnDate)}` : ""}. Waktu dapat menyesuaikan jadwal shalat dan kondisi di lapangan.`}
      >
        {days.length ? (
          <div className="hchips noprint">
            {nights("Madinah") ? <span>Madinah {nights("Madinah")} hari</span> : null}
            {nights("Makkah") ? <span>Makkah {nights("Makkah")} hari</span> : null}
            <span>{pkg.airline.name}</span>
          </div>
        ) : null}
      </PageHead>

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout">
          <div>
            {days.length ? <ItineraryTimeline days={days} /> : null}
            {pkg.itineraryPdf ? (
              <div className="panel" style={{ marginTop: days.length ? 28 : 0 }}>
                <div className="bar">
                  <h2 style={{ fontSize: 20 }}>Dokumen itinerary resmi</h2>
                  <a className="btn btn-line" href={getItineraryDownloadUrl(pkg.slug)} style={{ minHeight: 44 }}>Unduh PDF</a>
                </div>
                <div style={{ marginTop: 18 }}>
                  <PdfItineraryPreview fileUrl={getItineraryDownloadUrl(pkg.slug)} title={`Itinerary ${name}`} />
                </div>
              </div>
            ) : null}
          </div>
          <aside className="sticky noprint">
            <div className="panel side">
              <span className="cat">Paket ini</span>
              <h3 style={{ marginTop: 12, fontSize: 20 }}>{name}</h3>
              <dl className="kv">
                <div><dt>Berangkat</dt><dd>{view.date}</dd></div>
                <div><dt>Maskapai</dt><dd>{pkg.airline.name}</dd></div>
                {pkg.hotelMadinah ? <div><dt>Hotel Madinah</dt><dd>{titleCase(pkg.hotelMadinah.name)}</dd></div> : null}
                <div><dt>Hotel Makkah</dt><dd>{titleCase(pkg.hotelMakkah.name)}</dd></div>
                {view.price ? <div><dt>Mulai</dt><dd>{rupiah(view.price)}</dd></div> : null}
              </dl>
              <Link className="btn btn-gold" href={`/paket/${pkg.slug}`} style={{ width: "100%", marginTop: 18 }}>Lihat detail dan harga</Link>
              <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin bertanya tentang itinerary ${name}`}>
                <IconWa />Tanya itinerary ke admin
              </WaLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
