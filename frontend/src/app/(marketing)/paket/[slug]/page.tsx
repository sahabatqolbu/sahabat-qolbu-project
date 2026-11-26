import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RoomCalculator, { type RoomPrice } from "@/components/sq/RoomCalculator";
import DetailTabs, { type DetailTab } from "@/components/sq/DetailTabs";
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

function AirlineCard({ pkg, href }: { pkg: MarketingPackage; href: string }) {
  const facts = [pkg.airline.code ? `Kode ${pkg.airline.code}` : "", pkg.route?.code ? `Rute ${pkg.route.code}` : ""].filter(Boolean).join(", ");
  const inner = (
    <>
      <div className="alogo">
        {pkg.airline.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.airline.logo} alt={`Logo ${pkg.airline.name}`} loading="lazy" />
        ) : (
          <IconPlane width={40} height={40} className="" />
        )}
      </div>
      <div>
        <small>MASKAPAI</small>
        <h3>{pkg.airline.name}</h3>
        <p><IconPlane />{facts || "Penerbangan internasional"}</p>
        {pkg.airline.country ? <p>Asal {pkg.airline.country}</p> : null}
        {href ? <p className="more-link">Lihat profil maskapai</p> : null}
      </div>
    </>
  );
  return href ? <Link className="hotelcard" href={href}>{inner}</Link> : <div className="hotelcard">{inner}</div>;
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

  const hasItinerary = itinerary.length > 0 || Boolean(pkg.itineraryPdf);
  const itineraryHref = `/itinerary/${encodeURIComponent(pkg.slug)}`;
  const airlineHref = pkg.airline.id ? `/maskapai/${entitySlug(pkg.airline.name, pkg.airline.id)}` : "";

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

  const tabs: DetailTab[] = [
    {
      id: "ringkasan",
      label: "Ringkasan",
      content: (
        <div className="dsum">
          {flyer ? (
            <a className="dflyer" href={flyer} target="_blank" rel="noopener noreferrer" aria-label="Buka flyer ukuran penuh">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flyer} alt={`Flyer ${name}`} />
            </a>
          ) : null}
          <div>
            {options.length > 1 ? (
              <div style={{ marginBottom: 18 }}>
                <h3>Pilihan hotel</h3>
                <div className="tabs" style={{ marginTop: 10 }}>
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
            <h2>Tentang paket ini</h2>
            <div className="ddesc">{pkg.description}</div>
            {highlights.length ? (
              <>
                <h3 style={{ marginTop: 20 }}>Keunggulan paket</h3>
                <Ticks items={highlights} two={false} />
              </>
            ) : null}
            <div className="dquick">
              {hasItinerary ? <a className="btn btn-navy" href="#itinerary">Lihat itinerary</a> : null}
              <a className="btn btn-line" href="#perjalanan">Hotel dan maskapai</a>
            </div>
          </div>
        </div>
      ),
    },
    ...(pkg.included?.length || pkg.excluded?.length
      ? [
          {
            id: "fasilitas",
            label: "Fasilitas",
            content: (
              <div className="dcols">
                {pkg.included?.length ? (
                  <div>
                    <h3>Sudah termasuk</h3>
                    <Ticks items={pkg.included} two={false} />
                  </div>
                ) : null}
                {pkg.excluded?.length ? (
                  <div>
                    <h3>Belum termasuk</h3>
                    <Ticks items={pkg.excluded} no two={false} />
                  </div>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
    {
      id: "perjalanan",
      label: "Hotel & maskapai",
      content: (
        <>
          <div className="route">
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
          <div style={{ marginTop: 22 }}>
            <AirlineCard pkg={pkg} href={airlineHref} />
            <HotelCard label="HOTEL MAKKAH" hotel={pkg.hotelMakkah} distance={pkg.hotelMakkah.distanceToHaram} />
            {pkg.hotelMadinah ? <HotelCard label="HOTEL MADINAH" hotel={pkg.hotelMadinah} distance={pkg.hotelMadinah.distanceToMasjid} /> : null}
          </div>
        </>
      ),
    },
    ...(hasItinerary
      ? [
          {
            id: "itinerary",
            label: "Itinerary",
            content: (
              <>
                <div className="itin-cta">
                  <div>
                    <b>Jadwal harian lengkap</b>
                    <span>{itinerary.length ? `${itinerary.length} hari, per jam, bisa dicetak` : "Dokumen PDF resmi"}</span>
                  </div>
                  <Link className="btn btn-gold" href={itineraryHref}>Buka itinerary lengkap</Link>
                </div>
                {preview.map((d) => (
                  <div className="day" key={d.day}>
                    <div className="dnum"><small>Hari</small><b>{d.day}</b></div>
                    <div className="dcard">
                      <h3>{d.title}</h3>
                      {d.city ? <span className="city">{d.city === "Pulang" ? "Perjalanan pulang" : d.city}</span> : null}
                      <ul className="acts-list">
                        {d.activities.slice(0, 4).map((a, i) => (
                          <li key={i}><time>{a.time}</time><span>{a.text}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                {itinerary.length > 3 ? (
                  <Link className="btn btn-line" href={itineraryHref} style={{ width: "100%" }}>
                    Lihat {itinerary.length - 3} hari berikutnya
                  </Link>
                ) : null}
              </>
            ),
          },
        ]
      : []),
    ...(pkg.registrationRequirements?.length || pkg.termsConditions?.length || pkg.registrationSteps?.length
      ? [
          {
            id: "syarat",
            label: "Syarat & daftar",
            content: (
              <div className="dcols">
                <div>
                  {pkg.registrationRequirements?.length ? (
                    <>
                      <h3>Syarat pendaftaran</h3>
                      <Ticks items={pkg.registrationRequirements} two={false} />
                    </>
                  ) : null}
                  {pkg.termsConditions?.length ? (
                    <>
                      <h3 style={{ marginTop: 22 }}>Syarat dan ketentuan</h3>
                      <ul className="ticks">
                        {pkg.termsConditions.map((t) => <li key={t}><IconShield /><span>{t}</span></li>)}
                      </ul>
                    </>
                  ) : null}
                </div>
                {pkg.registrationSteps?.length ? (
                  <div>
                    <h3>Cara mendaftar</h3>
                    <ol className="numlist">
                      {pkg.registrationSteps.map((st) => <li key={st}>{st}</li>)}
                    </ol>
                  </div>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="has-mbar">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <PageHead
        crumbs={[{ href: "/", label: "Beranda" }, { href: "/paket", label: "Paket Umroh" }, { label: name }]}
        eyebrow={typeLabel(pkg)}
        title={name}
      >
        <div className="hchips">
          {view.open ? <span className="ok"><IconCheck />{view.statusLabel}</span> : <span className="off">{view.statusLabel}</span>}
          <span><IconCalendar />{dayDate(pkg.departureDate)}{pkg.returnDate ? ` sampai ${dayDate(pkg.returnDate)}` : ""}</span>
          {view.days ? <span><IconClock />{view.days} hari</span> : null}
          <span><IconPlane />{pkg.airline.name}</span>
        </div>
        <div className="hactions">
          {hasItinerary ? <a className="btn btn-gold" href="#itinerary"><IconCalendar />Lihat itinerary</a> : null}
          <a className={`btn ${hasItinerary ? "btn-ghost" : "btn-gold"}`} href="#book">Hitung biaya</a>
        </div>
      </PageHead>

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="wrap layout">
          <DetailTabs tabs={tabs} />
          <aside className="sticky lift" style={{ display: "grid", gap: 14 }}>
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
            {hasItinerary ? (
              <Link className="itin-side" href={itineraryHref}>
                <IconCalendar />
                <span><b>Itinerary perjalanan</b><small>{itinerary.length ? `${itinerary.length} hari, jadwal per jam` : "Dokumen PDF resmi"}</small></span>
              </Link>
            ) : null}
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
