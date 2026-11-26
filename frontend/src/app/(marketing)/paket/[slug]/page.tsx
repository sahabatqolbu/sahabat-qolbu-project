import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RoomCalculator, { type RoomPrice } from "@/components/sq/RoomCalculator";
import SectionNav from "@/components/sq/SectionNav";
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconHotel,
  IconPlane,
  IconShield,
  IconWalk,
  IconX,
  Stars,
} from "@/components/sq/icons";
import { PackageCard, PageHead, titleCase, typeLabel, viewPackage } from "@/components/sq/ui";
import { getPackageRegistrationUrl } from "@/lib/dashboard-url";
import { entitySlug, getMarketingPackageBySlug, getMarketingPackages, type MarketingPackage } from "@/lib/public-api";
import { safeJsonLd } from "@/lib/seo";
import { normalizeItinerary } from "@/lib/sq-itinerary";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);
  if (!pkg) return { title: "Paket Tidak Ditemukan | Sahabat Qolbu" };
  const name = titleCase(pkg.name);
  const description = pkg.description?.slice(0, 160) || `Detail paket umroh ${name} dari Sahabat Qolbu.`;
  return {
    title: `${name} | Sahabat Qolbu`,
    description,
    alternates: { canonical: `/paket/${slug}` },
    openGraph: {
      title: `${name} | Sahabat Qolbu`,
      description,
      url: `https://sahabatqolbu.com/paket/${slug}`,
      images: pkg.image ? [{ url: pkg.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Sahabat Qolbu`,
      description,
      images: pkg.image ? [pkg.image] : undefined,
    },
  };
}

export const viewport = { themeColor: "#0A2C45", width: "device-width", initialScale: 1 };

const num = (value?: string) => {
  const parsed = Number.parseFloat(String(value || "0"));
  return Number.isFinite(parsed) ? parsed : 0;
};
const dayDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

function HotelCard({ label, hotel, distance }: { label: string; hotel: MarketingPackage["hotelMakkah"]; distance?: string }) {
  const inner = (
    <>
      {hotel.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hotel.imageUrl} alt={`Hotel ${hotel.name}`} loading="lazy" />
      ) : (
        <div style={{ aspectRatio: "4/3", borderRadius: 14, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy)" }}>
          <IconHotel width={36} height={36} className="" />
        </div>
      )}
      <div>
        <small>{label}</small>
        <h3>{titleCase(hotel.name)} <Stars count={hotel.starRating} /></h3>
        {distance ? <p><IconWalk />Sekitar {distance}</p> : null}
        {hotel.address ? <p>{hotel.address.trim()}</p> : null}
      </div>
    </>
  );
  return hotel.id ? (
    <Link className="hotelcard" href={`/hotel/${entitySlug(hotel.name, hotel.id)}`}>{inner}</Link>
  ) : (
    <div className="hotelcard">{inner}</div>
  );
}

const Ticks = ({ items, no, two = true }: { items: string[]; no?: boolean; two?: boolean }) => (
  <ul className={`ticks${two ? " two" : ""}${no ? " no" : ""}`}>
    {items.map((item) => (
      <li key={item}>
        {no ? <IconX /> : <IconCheck />}
        <span>{item.replace(/\.$/, "")}</span>
      </li>
    ))}
  </ul>
);

export default async function PackageDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ option?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const base = await getMarketingPackageBySlug(slug);
  if (!base) notFound();

  const options = (base.options || []).filter((o) => o.isActive !== false);
  const defaultOption = options.find((o) => o.isDefault) || options[0];
  const selected = options.find((o) => o.id === Number(query?.option || 0)) || defaultOption;
  const pick = (value: string | undefined, fallback: string) => (num(value) > 0 ? String(value) : fallback);
  const pkg: MarketingPackage = selected
    ? {
        ...base,
        hotelMakkah: selected.hotelMakkah || base.hotelMakkah,
        hotelMadinah: selected.hotelMadinah || base.hotelMadinah,
        priceQuad: pick(selected.priceQuad, base.priceQuad),
        priceTriple: pick(selected.priceTriple, base.priceTriple || base.priceQuad),
        priceDouble: pick(selected.priceDouble, base.priceDouble),
        discountedPrice: pick(selected.priceQuad, base.priceQuad),
        gallery: !selected.isDefault && selected.gallery?.length ? selected.gallery : base.gallery,
        image: (!selected.isDefault && selected.gallery?.[0]) || base.image,
      }
    : base;

  const view = viewPackage(pkg);
  const name = titleCase(pkg.name);
  const rooms: RoomPrice[] = [
    { id: "quad", name: "Quad", note: "Sekamar ber-4", price: num(pkg.priceQuad) },
    { id: "triple", name: "Triple", note: "Sekamar ber-3", price: num(pkg.priceTriple) },
    { id: "double", name: "Double", note: "Sekamar ber-2", price: num(pkg.priceDouble) },
  ].filter((room) => room.price > 0);
  const itinerary = normalizeItinerary(pkg.itinerary || []);
  const preview = itinerary.slice(0, 3);
  const flyer = pkg.gallery?.[0] || pkg.image;
  const highlights = pkg.terms || [];
  const related = (await getMarketingPackages())
    .map(viewPackage)
    .filter((v) => v.open && v.pkg.id !== pkg.id)
    .sort((a, b) => Math.abs(new Date(a.pkg.departureDate).getTime() - new Date(pkg.departureDate).getTime()) - Math.abs(new Date(b.pkg.departureDate).getTime() - new Date(pkg.departureDate).getTime()))
    .slice(0, 3);

  const sections = [
    { id: "ringkasan", label: "Ringkasan" },
    ...(pkg.included?.length || pkg.excluded?.length ? [{ id: "fasilitas", label: "Fasilitas" }] : []),
    { id: "perjalanan", label: "Penerbangan dan hotel" },
    ...(itinerary.length || pkg.itineraryPdf ? [{ id: "itinerary", label: "Itinerary" }] : []),
    ...(pkg.registrationRequirements?.length || pkg.termsConditions?.length ? [{ id: "syarat", label: "Syarat" }] : []),
    ...(pkg.registrationSteps?.length ? [{ id: "cara-daftar", label: "Cara daftar" }] : []),
  ];

  const prices = rooms.map((r) => r.price);
  const schema = {
    "@context": "https://schema.org",
    "@type": ["TouristTrip", "Product"],
    "@id": `https://sahabatqolbu.com/paket/${encodeURIComponent(pkg.slug)}#trip`,
    name,
    description: pkg.description || `Paket perjalanan ibadah umroh ${name} dari Sahabat Qolbu.`,
    image: pkg.image ? [pkg.image] : undefined,
    touristType: "Jamaah Umroh",
    provider: { "@id": "https://sahabatqolbu.com/#organization" },
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "IDR",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: options.length || 1,
            availability: view.open ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            url: `https://sahabatqolbu.com/paket/${encodeURIComponent(pkg.slug)}`,
          },
        }
      : {}),
    ...(pkg.departureDate ? { startDate: pkg.departureDate } : {}),
    ...(pkg.returnDate ? { endDate: pkg.returnDate } : {}),
  };

  return (
    <div className="has-mbar">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <PageHead
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/paket", label: "Paket Umroh" }, { label: name }]}
        eyebrow={typeLabel(pkg)}
        title={name}
      >
        <div className="hchips">
          {view.open ? <span className="ok"><IconCheck />{view.statusLabel}</span> : <span>{view.statusLabel}</span>}
          <span><IconCalendar />{dayDate(pkg.departureDate)}{pkg.returnDate ? ` sampai ${dayDate(pkg.returnDate)}` : ""}</span>
          {view.days ? <span><IconClock />{view.days} hari</span> : null}
          <span><IconPlane />{pkg.airline.name}</span>
        </div>
      </PageHead>

      <SectionNav items={sections} />

      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap layout">
          <div>
            <div className="panel anchor" id="ringkasan">
              {flyer ? (
                <div className="flyerbox">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flyer} alt={`Flyer ${name}`} />
                </div>
              ) : null}
              {options.length > 1 ? (
                <div style={{ marginTop: 22 }}>
                  <h3>Pilihan hotel</h3>
                  <div className="tabs" style={{ marginTop: 12 }}>
                    {options.map((option) => (
                      <Link
                        key={option.id}
                        className="tab"
                        aria-selected={option.id === selected?.id}
                        href={`/paket/${pkg.slug}${option.isDefault ? "" : `?option=${option.id}`}`}
                        style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                        scroll={false}
                      >
                        {option.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <h2 style={{ marginTop: 28 }}>Tentang paket ini</h2>
              <p>{pkg.description}</p>
              {highlights.length ? (
                <>
                  <h3 style={{ marginTop: 24 }}>Keunggulan paket</h3>
                  <Ticks items={highlights} two={false} />
                </>
              ) : null}
            </div>

            {pkg.included?.length || pkg.excluded?.length ? (
              <div className="panel anchor" id="fasilitas">
                <h2>Fasilitas paket</h2>
                {pkg.included?.length ? (
                  <>
                    <h3 style={{ marginTop: 20 }}>Sudah termasuk</h3>
                    <Ticks items={pkg.included} />
                  </>
                ) : null}
                {pkg.excluded?.length ? (
                  <>
                    <h3 style={{ marginTop: 28 }}>Belum termasuk</h3>
                    <Ticks items={pkg.excluded} no />
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="panel anchor" id="perjalanan">
              <h2>Penerbangan dan hotel</h2>
              <div className="route" style={{ marginTop: 22 }}>
                <div><b>ID</b><small>Indonesia, {dayDate(pkg.departureDate)}</small></div>
                <div className="line"><IconPlane className="" /></div>
                <div><b>{pkg.route?.arrivalCode || "KSA"}</b><small>{pkg.route?.arrivalCity || "Arab Saudi"}</small></div>
                {pkg.route?.returnCode && pkg.route.returnCode !== pkg.route.arrivalCode ? (
                  <>
                    <div className="line"><IconPlane className="" /></div>
                    <div><b>{pkg.route.returnCode}</b><small>{pkg.route.returnCity}, pulang {dayDate(pkg.returnDate)}</small></div>
                  </>
                ) : null}
              </div>
              <p style={{ marginTop: 14 }}>Maskapai {pkg.airline.name}{pkg.airline.id ? <> (<Link href={`/maskapai/${entitySlug(pkg.airline.name, pkg.airline.id)}`} style={{ color: "var(--navy)", fontWeight: 600 }}>lihat profil maskapai</Link>)</> : null}.</p>
              <div style={{ marginTop: 24 }}>
                <HotelCard label="HOTEL MAKKAH" hotel={pkg.hotelMakkah} distance={pkg.hotelMakkah.distanceToHaram} />
                {pkg.hotelMadinah ? <HotelCard label="HOTEL MADINAH" hotel={pkg.hotelMadinah} distance={pkg.hotelMadinah.distanceToMasjid} /> : null}
              </div>
            </div>

            {itinerary.length || pkg.itineraryPdf ? (
              <div className="panel anchor" id="itinerary">
                <div className="bar">
                  <h2>Itinerary{itinerary.length ? ` ${itinerary.length} hari` : ""}</h2>
                  <Link className="btn btn-line" href={`/itinerary/${encodeURIComponent(pkg.slug)}`} style={{ minHeight: 44 }}>Lihat itinerary lengkap</Link>
                </div>
                <div style={{ marginTop: 24 }}>
                  {preview.map((day) => (
                    <div className="day" key={day.day}>
                      <div className="dnum"><small>Hari</small><b>{day.day}</b></div>
                      <div className="dcard">
                        <h3>{day.title}</h3>
                        {day.city ? <span className="city">{day.city === "Pulang" ? "Perjalanan pulang" : day.city}</span> : null}
                        <ul className="acts-list">
                          {day.activities.slice(0, 4).map((a, i) => (
                            <li key={i}><time>{a.time}</time><span>{a.text}</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {itinerary.length > 3 ? (
                    <p style={{ color: "var(--muted)", fontSize: 15, background: "var(--sand)", borderRadius: 16, padding: "14px 18px" }}>
                      Masih ada {itinerary.length - 3} hari lagi.{" "}
                      <Link href={`/itinerary/${encodeURIComponent(pkg.slug)}`} style={{ color: "var(--navy)", fontWeight: 600 }}>Lihat semua hari</Link>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {pkg.registrationRequirements?.length || pkg.termsConditions?.length ? (
              <div className="panel anchor" id="syarat">
                {pkg.registrationRequirements?.length ? (
                  <>
                    <h2>Syarat pendaftaran</h2>
                    <Ticks items={pkg.registrationRequirements} />
                  </>
                ) : null}
                {pkg.termsConditions?.length ? (
                  <>
                    <h3 style={{ marginTop: 28 }}>Syarat dan ketentuan</h3>
                    <ul className="ticks">
                      {pkg.termsConditions.map((t) => <li key={t}><IconShield /><span>{t}</span></li>)}
                    </ul>
                  </>
                ) : null}
              </div>
            ) : null}

            {pkg.registrationSteps?.length ? (
              <div className="panel anchor" id="cara-daftar">
                <h2>Cara mendaftar</h2>
                <ol className="numlist">
                  {pkg.registrationSteps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </div>
            ) : null}
          </div>

          <aside className="sticky lift">
            <RoomCalculator
              packageName={name}
              rooms={rooms}
              seats={view.seats}
              totalSeats={pkg.totalSeats}
              open={view.open}
              statusLabel={view.statusLabel}
              registerUrl={getPackageRegistrationUrl(pkg.id, selected && !selected.isDefault ? selected.id : undefined)}
              optionName={selected && !selected.isDefault ? selected.name : undefined}
            />
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="sec sandband">
          <div className="wrap">
            <div className="head">
              <h2 className="h2">Paket lain yang mungkin cocok</h2>
              <Link className="btn btn-line" href="/paket">Lihat semua paket</Link>
            </div>
            <div className="cards">
              {related.map((v) => <PackageCard key={v.pkg.id} view={v} />)}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
