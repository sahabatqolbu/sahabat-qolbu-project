import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/sq/ArticleCard";
import Markdown from "@/components/sq/Markdown";
import { WaLink } from "@/components/sq/chrome";
import { IconCheck, IconHotel, IconPin, IconPlay, IconWa, IconWalk, Stars } from "@/components/sq/icons";
import { AskCard, PackageCard, PageHead, titleCase, viewPackage } from "@/components/sq/ui";
import { getPublicHotelDetail, parseEntityIdFromSlug, toMarketingPackage } from "@/lib/public-api";
import { safeJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const parseList = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).replace(/^[•\-*\s]+/, "").trim()).filter(Boolean);
  } catch {
    // bukan JSON
  }
  return value.split(/\r?\n|•/).map((item) => item.replace(/^[-*\s]+/, "").trim()).filter(Boolean);
};

const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1] || "";
const cityName = (city?: string | null) => (city ? city.charAt(0) + city.slice(1).toLowerCase() : "");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  const detail = id ? await getPublicHotelDetail(id) : null;
  if (!detail) return { title: "Hotel Tidak Ditemukan | Sahabat Qolbu" };
  const { hotel } = detail;
  const name = titleCase(String(hotel.name || "Hotel"));
  const city = cityName(hotel.city);
  const title = `Hotel ${name}${city ? ` di ${city}` : ""} | Sahabat Qolbu`;
  const description = `Fasilitas, lokasi, dan paket umroh Sahabat Qolbu yang menginap di ${name}${hotel.distanceToHaram ? `, sekitar ${hotel.distanceToHaram} m dari masjid` : ""}.`;
  return {
    title,
    description,
    alternates: { canonical: `/hotel/${slug}` },
    openGraph: { title, description, images: hotel.imageUrl ? [{ url: hotel.imageUrl }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: hotel.imageUrl ? [hotel.imageUrl] : undefined },
  };
}

export default async function HotelPage({ params }: { params: Params }) {
  const { slug } = await params;
  const id = parseEntityIdFromSlug(slug);
  if (!id) notFound();
  const detail = await getPublicHotelDetail(id);
  if (!detail) notFound();

  const { hotel, articles } = detail;
  const name = titleCase(String(hotel.name || "Hotel"));
  const city = cityName(hotel.city);
  const mosque = String(hotel.city || "").toUpperCase() === "MADINAH" ? "Masjid Nabawi" : "Masjidil Haram";
  const facilities = parseList(hotel.facilities);
  const videos = (Array.isArray(hotel.videoUrls) ? hotel.videoUrls : parseList(hotel.videoUrls as string | null))
    .map((url) => ({ url: url.replace(/[?&]utm_source=[^&]*/, ""), id: youtubeId(url) }))
    .filter((video) => video.id);
  const packages = detail.packages.map(toMarketingPackage).map(viewPackage);
  const gallery = (hotel.images || []).map((image) => image.imageUrl).filter(Boolean);
  const mapsUrl = hotel.mapUrl
    ? hotel.mapUrl.replace(/&utm_source=[^&]*/, "")
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.city || ""}`)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name,
    image: hotel.imageUrl ? [hotel.imageUrl] : undefined,
    address: hotel.address ? { "@type": "PostalAddress", streetAddress: hotel.address.trim(), addressLocality: city, addressCountry: "SA" } : undefined,
    starRating: hotel.starRating ? { "@type": "Rating", ratingValue: hotel.starRating } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <PageHead
        image={hotel.imageUrl || "/sq/clock-tower.webp"}
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/paket", label: "Paket Umroh" }, { label: `Hotel ${name}` }]}
        eyebrow={`Hotel ${city || "umroh"}`}
        title={name}
      >
        <div className="hchips">
          {city ? <span><IconPin />{city}</span> : null}
          {hotel.starRating ? <span><Stars count={hotel.starRating} />Bintang {hotel.starRating}</span> : null}
          {hotel.distanceToHaram ? <span><IconWalk />Sekitar {hotel.distanceToHaram} m ke {mosque}</span> : null}
        </div>
      </PageHead>

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout">
          <div>
            <div className="panel">
              <h2>Tentang hotel</h2>
              {hotel.description ? (
                <div className="prose" style={{ fontSize: 16, marginTop: 12 }}><Markdown content={hotel.description} /></div>
              ) : (
                <p>
                  {name} adalah hotel{hotel.starRating ? ` bintang ${hotel.starRating}` : ""} di {city || "Tanah Suci"}
                  {hotel.distanceToHaram ? `, sekitar ${hotel.distanceToHaram} m dari ${mosque}` : ""}. Hotel ini dipakai dalam paket umroh Sahabat Qolbu.
                </p>
              )}
              {hotel.distanceToHaram ? (
                <div className="walk">
                  <h3>Jarak ke {mosque}</h3>
                  <div className="walkline" aria-hidden="true">
                    <span><IconHotel /></span>
                    <em>Sekitar {hotel.distanceToHaram} m</em>
                    <span><IconPin /></span>
                  </div>
                  <div className="walklab"><span>{name}</span><span>{mosque}</span></div>
                </div>
              ) : null}
            </div>
            {facilities.length ? (
              <div className="panel">
                <h2>Fasilitas</h2>
                <ul className="ticks two">
                  {facilities.map((f) => <li key={f}><IconCheck /><span>{f}</span></li>)}
                </ul>
              </div>
            ) : null}
            {gallery.length ? (
              <div className="panel">
                <h2>Foto hotel</h2>
                <div className="grid2" style={{ marginTop: 18, gap: 14 }}>
                  {gallery.slice(0, 6).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt={`Foto ${name}`} loading="lazy" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
                  ))}
                </div>
              </div>
            ) : null}
            {videos.length ? (
              <div className="panel">
                <h2>Video hotel</h2>
                <p>Tonton suasana hotel dan jalan menuju {mosque}.</p>
                <div className="vlinks">
                  {videos.map((video, i) => (
                    <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`Video ${name} ${i + 1}`} loading="lazy" />
                      <span><IconPlay className="" /></span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <aside className="sticky lift">
            <div className="panel side">
              <h2 style={{ fontSize: 20 }}>Lokasi</h2>
              <dl className="kv">
                {city ? <div><dt>Kota</dt><dd>{city}</dd></div> : null}
                {hotel.address ? <div><dt>Alamat</dt><dd>{hotel.address.trim()}</dd></div> : null}
                {hotel.starRating ? <div><dt>Kelas</dt><dd>Bintang {hotel.starRating}</dd></div> : null}
                {hotel.distanceToHaram ? <div><dt>Ke masjid</dt><dd>Sekitar {hotel.distanceToHaram} m</dd></div> : null}
              </dl>
              <a className="btn btn-navy" href={mapsUrl} target="_blank" rel="noopener noreferrer">Buka di Google Maps</a>
              <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin paket umroh yang menginap di ${name}`}>
                <IconWa />Tanya paket dengan hotel ini
              </WaLink>
            </div>
          </aside>
        </div>
      </section>

      {packages.length || articles.length ? (
        <section className="sec sandband">
          <div className="wrap">
            {packages.length ? (
              <>
                <h2 className="h2">Paket yang menginap di {name}</h2>
                <div className="cards">
                  {packages.map((v) => <PackageCard key={v.pkg.id} view={v} />)}
                  <AskCard title="Mau hotel ini di tanggal lain?" text={`Admin bisa cek ketersediaan ${name} untuk jadwal keberangkatan lain.`} />
                </div>
              </>
            ) : null}
            {articles.length ? (
              <>
                <h2 className="h2" style={{ marginTop: packages.length ? 72 : 0 }}>Artikel tentang hotel ini</h2>
                <div className="grid3" style={{ marginTop: 32 }}>
                  {articles.slice(0, 6).map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
