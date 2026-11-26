import Link from "next/link";
import type { ReactNode } from "react";
import type { MarketingPackage } from "@/lib/public-api";
import { WaLink } from "./chrome";
import { IconHotel, IconPlane, IconWa } from "./icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export const shortDate = (value?: string | null) => {
  if (!value) return "Tanggal menyusul";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal menyusul";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

const num = (value?: string | number | null) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TYPE_LABELS: Record<string, string> = {
  FULL_SERVICE: "Full Service",
  KONSORSIUM: "Konsorsium",
  SEMI_MANDIRI: "Semi Mandiri",
  UMRAH_PLUS: "Umroh Plus",
  UMRAH_RAMADHAN: "Umroh Ramadhan",
  LAND_ARRANGEMENT: "Land Arrangement",
  FLEKSIBILITAS: "Fleksibel",
};

export const typeLabel = (pkg: MarketingPackage) => {
  const raw = String(pkg.backendType || "").toUpperCase();
  return TYPE_LABELS[raw] || raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "Umroh";
};

/** Ringkasan paket yang dipakai kartu, tabel, dan filter. */
export const viewPackage = (pkg: MarketingPackage) => {
  const status = String(pkg.bookingStatus || "").toUpperCase();
  const seats = Math.max(
    Number(pkg.remainingSeats ?? Number(pkg.totalSeats || 0) - Number(pkg.bookedSeats || 0)),
    0,
  );
  const open =
    pkg.isBookable !== false && seats > 0 && !["SOLD_OUT", "CLOSED", "DEPARTED"].includes(status);
  const quad = num(pkg.priceQuad);
  const triple = num(pkg.priceTriple);
  const double = num(pkg.priceDouble);
  const price = quad || triple || double;
  const original = num(pkg.originalPrice);
  return {
    pkg,
    href: `/paket/${pkg.slug}`,
    open,
    seats,
    statusLabel: open ? "Tersedia" : pkg.bookingStatusLabel || "Seat penuh",
    price,
    quad,
    triple,
    double,
    oldPrice: original > price && price > 0 ? original : 0,
    date: shortDate(pkg.departureDate),
    month: String(pkg.departureDate || "").slice(0, 7),
    days: pkg.duration || 0,
    ramadhan: pkg.type === "UMRAH_RAMADHAN" || /ramadhan|ramadan|lailatul/i.test(pkg.name),
    backendType: String(pkg.backendType || "").toUpperCase(),
  };
};

export type PackageView = ReturnType<typeof viewPackage>;

export const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase())
    .replace(/\b(Di|Dan|Ke|Dari|Bersama|Plus|Dengan)\b/g, (word) => word.toLowerCase())
    .replace(/\bSq\b/g, "SQ")
    .replace(/\b(\d+)x\b/gi, "$1x")
    .replace(/^./, (c) => c.toUpperCase());

export function PackageCard({ view }: { view: PackageView }) {
  const { pkg } = view;
  const name = titleCase(pkg.name);
  const badge = !view.open ? (
    <span className="pbadge soldb">{view.statusLabel}</span>
  ) : view.oldPrice ? (
    <span className="pbadge hot">Promo</span>
  ) : view.seats <= 10 ? (
    <span className="pbadge">Sisa {view.seats} seat</span>
  ) : null;
  return (
    <article className={`pcard${view.open ? "" : " sold"}`}>
      <Link className="thumb" href={view.href} aria-label={`Detail ${name}`}>
        {pkg.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.image} alt={`Flyer ${name}`} loading="lazy" width={600} height={600} />
        ) : null}
        {badge}
      </Link>
      <div className="body">
        <div className="when">
          <span>Berangkat <b>{view.date}</b></span>
          {view.days ? <span>{view.days} hari</span> : null}
        </div>
        <h3><Link href={view.href} style={{ textDecoration: "none" }}>{name}</Link></h3>
        <ul className="meta">
          <li><IconPlane />{pkg.airline.name}</li>
          <li>
            <IconHotel />
            <span>
              Makkah: {titleCase(pkg.hotelMakkah.name)}
              {pkg.hotelMakkah.starRating >= 5 ? " (bintang 5)" : ""}
              {pkg.hotelMadinah ? <><br />Madinah: {titleCase(pkg.hotelMadinah.name)}</> : null}
            </span>
          </li>
        </ul>
        <div className="foot">
          <div className="cost">
            <div>
              <small>Mulai dari {view.oldPrice ? <s>{rupiah(view.oldPrice)}</s> : null}</small>
              <b>{view.price ? rupiah(view.price) : "Hubungi admin"}</b>
            </div>
            <span className="seat">{view.open ? `Sisa ${view.seats} seat` : view.statusLabel}</span>
          </div>
          <div className="acts">
            <Link className="btn btn-line" href={view.href}>Detail</Link>
            {view.open ? (
              <WaLink
                className="btn btn-wa"
                message={`Assalamualaikum, saya ingin booking ${name} (${view.date})`}
              >
                <IconWa />Booking
              </WaLink>
            ) : (
              <WaLink className="btn btn-line" message={`Assalamualaikum, saya ingin masuk daftar tunggu ${name}`}>
                Daftar tunggu
              </WaLink>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AskCard({ title, text }: { title: string; text: string }) {
  return (
    <aside className="pcard ask">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin dicarikan jadwal umroh lain">
        <IconWa />Tanya admin
      </WaLink>
    </aside>
  );
}

export const Arc = ({ stroke = "#FFC107" }: { stroke?: string }) => (
  <svg className="arc" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 56V20Q720 76 1440 20V56Z" fill="#fff" />
    <path d="M0 20Q720 76 1440 20" fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg>
);

export function PageHead({
  image = "/sq/hero-haram-desktop.webp",
  crumbs,
  title,
  lead,
  busy,
  eyebrow,
  logo,
  children,
}: {
  logo?: string;
  image?: string;
  crumbs: { href?: string; label: string }[];
  title: ReactNode;
  lead?: ReactNode;
  busy?: boolean;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`pagehead${busy ? " busy" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" />
      <div className="shade" />
      <div className="wrap">
        <ol className="crumb">
          {crumbs.map((crumb) => (
            <li key={crumb.label}>
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            </li>
          ))}
        </ol>
        {logo ? (
          <div className="ph-row">
            <div className="logo-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="" width={92} height={92} />
            </div>
            <div>
              {eyebrow ? <span className="cat gold">{eyebrow}</span> : null}
              <h1 style={eyebrow ? { marginTop: 12 } : undefined}>{title}</h1>
              {lead ? <p className="lead">{lead}</p> : null}
              {children}
            </div>
          </div>
        ) : (
          <>
            {eyebrow ? <span className="cat gold">{eyebrow}</span> : null}
            <h1 style={eyebrow ? { marginTop: 14 } : undefined}>{title}</h1>
            {lead ? <p className="lead">{lead}</p> : null}
            {children}
          </>
        )}
      </div>
      <Arc />
    </section>
  );
}

export function Closing({
  image = "/sq/hero-haram-desktop.webp",
  title,
  text,
  primary,
  secondary,
}: {
  image?: string;
  title: string;
  text: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <section className="closing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" loading="lazy" />
      <div className="shade" />
      <div className="wrap">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="cta">
          {primary}
          {secondary}
        </div>
      </div>
    </section>
  );
}
