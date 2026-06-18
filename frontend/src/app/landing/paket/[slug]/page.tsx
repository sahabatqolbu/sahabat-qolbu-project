import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Download,
  Hotel,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Train,
  Users,
} from "lucide-react";
import { LandingPackageTabs } from "@/components/marketing/PackageDetail/LandingPackageTabs";
import RelatedPackages from "@/components/marketing/PackageDetail/RelatedPackages";
import {
  getMarketingPackageBySlug,
  getMarketingPackageSlugs,
  type MarketingPackage,
} from "@/lib/public-api";
import CompanySyncRunner from "@/components/landing/CompanySyncRunner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

const WA_NUMBER = "6281255871984";

const toCurrency = (value?: string) => {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return formatCurrency(Number.isFinite(parsed) ? parsed : 0);
};

const getSeatsLeft = (pkg: MarketingPackage) =>
  Math.max(Number(pkg.totalSeats || 0) - Number(pkg.bookedSeats || 0), 0);

const getWhatsappLink = (pkg: MarketingPackage, intent: "consult" | "book") => {
  const action = intent === "book" ? "ingin booking seat" : "tertarik konsultasi";
  const message = `Assalamualaikum, saya lihat di website sahabatqolbu.com dan ${action} paket ${pkg.name}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
};

const getDescriptionItems = (value?: string) =>
  String(value || "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*\s]+/, "").replace(/\*+/g, "").trim())
    .filter(Boolean);

const getPackageTypeLabel = (pkg: MarketingPackage) => {
  const type = String(pkg.backendType || pkg.type || "").toUpperCase();
  const name = pkg.name.toLowerCase();

  if (type.includes("RAMADHAN") || name.includes("ramadhan")) {
    return "Umroh Ramadhan";
  }

  if (
    type.includes("PLUS") ||
    type.includes("EXTREME") ||
    name.includes("plus") ||
    name.includes("turki") ||
    name.includes("dubai")
  ) {
    return "Umroh Plus";
  }

  return "Umroh Reguler";
};

export async function generateStaticParams() {
  const slugs = await getMarketingPackageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = true;
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg) {
    return {
      title: "Paket Tidak Ditemukan | Sahabat Qolbu",
    };
  }

  const description =
    pkg.description?.slice(0, 160) ||
    `Detail paket umroh ${pkg.name} dari Sahabat Qolbu.`;

  return {
    title: `${pkg.name} | Sahabat Qolbu`,
    description,
    openGraph: {
      title: pkg.name,
      description,
      images: pkg.image ? [{ url: pkg.image }] : undefined,
    },
  };
}

export const viewport = {
  themeColor: "#0A2C45",
  width: "device-width",
  initialScale: 1,
};

function LandingHeader() {
  return (
    <header
      className="landing-chrome fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      data-detail-header="true"
      id="header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="flex h-10 w-10 items-center justify-center md:h-12 md:w-12">
              <Image
                src="/landing/images/icon.png"
                alt="Logo Sahabat Qolbu"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-bold md:text-xl">
                <span className="js-logo-sahabat text-white transition-colors duration-300">
                  Sahabat
                </span>{" "}
                <span className="js-logo-qolbu text-gold transition-colors duration-300">
                  Qolbu
                </span>
              </span>
              <span className="js-company-tagline hidden text-xs text-gray-300 transition-colors duration-300 sm:block">
                Tour & Travel
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/#beranda"
              className="nav-link font-medium text-white transition-colors hover:text-gold"
            >
              Beranda
            </Link>
            <Link
              href="/#tentang"
              className="nav-link font-medium text-white transition-colors hover:text-gold"
            >
              Tentang
            </Link>
            <Link
              href="/#paket"
              className="nav-link font-medium text-white transition-colors hover:text-gold"
            >
              Paket
            </Link>
            <Link
              href="/#testimoni"
              className="nav-link font-medium text-white transition-colors hover:text-gold"
            >
              Testimoni
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik konsultasi tentang paket umroh")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[linear-gradient(135deg,#FFC107_0%,#FFD54F_100%)] px-5 py-2.5 font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Hubungi Kami
            </a>
          </div>

          <button
            type="button"
            className="p-2 text-white transition-colors hover:text-gold md:hidden"
            id="mobileMenuBtn"
            aria-label="Buka menu navigasi"
            aria-expanded="false"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>
      </div>

      <div
        className="hidden border-t border-white/10 bg-primary md:hidden"
        id="mobileMenu"
      >
        <div className="space-y-3 px-4 py-4">
          <Link
            href="/#beranda"
            className="block py-2 text-white transition-colors hover:text-gold"
          >
            Beranda
          </Link>
          <Link
            href="/#tentang"
            className="block py-2 text-white transition-colors hover:text-gold"
          >
            Tentang
          </Link>
          <Link
            href="/#paket"
            className="block py-2 text-white transition-colors hover:text-gold"
          >
            Paket
          </Link>
          <Link
            href="/#testimoni"
            className="block py-2 text-white transition-colors hover:text-gold"
          >
            Testimoni
          </Link>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik konsultasi tentang paket umroh")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-full bg-[linear-gradient(135deg,#FFC107_0%,#FFD54F_100%)] px-5 py-3 text-center font-semibold text-primary"
          >
            Hubungi Kami
          </a>
        </div>
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-chrome bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <Image
                src="/landing/images/icon.png"
                alt="Logo Sahabat Qolbu"
                width={48}
                height={48}
                className="h-11 w-11 object-contain"
              />
              <div>
                <span className="text-lg font-bold">
                  Sahabat <span className="text-gold">Qolbu</span>
                </span>
                <span className="block text-xs text-gray-300">Tour & Travel</span>
              </div>
            </Link>
            <p
              id="company-description"
              className="mb-6 max-w-md leading-relaxed text-gray-300"
            >
              Sahabat Qolbu Cahaya Baitullah adalah perusahaan Travel Haji dan
              Umroh yang telah memiliki IZIN RESMI dari Kementrian Agama
              Republik Indonesia (No. PPIU 12112100038690008).
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/sahabatqolbu.ofc/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-gold hover:text-primary"
                aria-label="Instagram Sahabat Qolbu"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/sahabatqolbu.ofc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-gold hover:text-primary"
                aria-label="Facebook Sahabat Qolbu"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-gold hover:text-primary"
                aria-label="WhatsApp Sahabat Qolbu"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Menu</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#beranda" className="text-gray-300 transition-colors hover:text-gold">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/#tentang" className="text-gray-300 transition-colors hover:text-gold">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/#paket" className="text-gray-300 transition-colors hover:text-gold">
                  Paket umroh
                </Link>
              </li>
              <li>
                <Link href="/#testimoni" className="text-gray-300 transition-colors hover:text-gold">
                  Testimoni
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-gold" />
                <span id="company-address" className="text-sm text-gray-300">
                  Ruko Jl. Ebony, Metland Transyogi No.11,{" "}
                  <strong>Kec. Cileungsi, Kab. Bogor</strong>, Jawa Barat 16820
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-gold" />
                <a
                  id="company-whatsapp-text"
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik mendaftar umroh bersama Sahabat Qolbu")}`}
                  className="text-gray-300 transition-colors hover:text-gold"
                >
                  0812-5587-1984
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-gold" />
                <a
                  id="company-email-text"
                  href="mailto:Sahabatqolbucahayabaitullah@gmail.com"
                  className="break-all text-sm text-gray-300 transition-colors hover:text-gold"
                >
                  Sahabatqolbucahayabaitullah@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-sm text-white/45">
          <p id="company-copyright">
          © 2026 Sahabat Qolbu Cahaya Baitullah. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-white/55">
          {label}
        </span>
        <span className="block truncate text-sm font-black text-white">{value}</span>
      </span>
    </div>
  );
}

function BookingPanel({
  pkg,
  seatsLeft,
  bookingLink,
  consultLink,
}: {
  pkg: MarketingPackage;
  seatsLeft: number;
  bookingLink: string;
  consultLink: string;
}) {
  const seatPercent = pkg.totalSeats
    ? Math.round((seatsLeft / pkg.totalSeats) * 100)
    : 0;

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-2xl shadow-primary/15">
        <div className="bg-primary p-6 text-white">
          <p className="text-sm font-semibold text-white/60">Mulai dari</p>
          <p className="mt-1 font-display text-4xl font-black leading-none text-secondary">
            {toCurrency(pkg.priceQuad)}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/65">
            per orang, kamar quad
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                Durasi
              </p>
              <p className="mt-1 font-black text-primary">{pkg.duration || "-"} Hari</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                Seat
              </p>
              <p className="mt-1 font-black text-primary">{seatsLeft} tersisa</p>
            </div>
          </div>

          {pkg.totalSeats ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-black text-neutral-500">
                <span>Ketersediaan</span>
                <span>{seatPercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${seatPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-3 text-sm">
            {[
              ["Kode Paket", pkg.code],
              ["Keberangkatan", pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul"],
              ["Kepulangan", pkg.returnDate ? formatDate(pkg.returnDate) : "Menyusul"],
              ["Maskapai", pkg.airline.name],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3">
                <span className="font-semibold text-neutral-500">{label}</span>
                <span className="text-right font-black text-primary">{value}</span>
              </div>
            ))}
          </div>

          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 font-black text-primary shadow-lg shadow-secondary/25 transition hover:bg-secondary-400"
          >
            <MessageCircle className="h-5 w-5" />
            Booking Seat
          </a>
          <a
            href={consultLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary px-5 py-3.5 font-black text-primary transition hover:bg-primary hover:text-white"
          >
            Konsultasi Dulu
          </a>

          {pkg.itineraryPdf ? (
            <a
              href={pkg.itineraryPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 text-sm font-black text-neutral-600 hover:text-primary"
            >
              <Download className="h-4 w-4" />
              Download Itinerary PDF
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function HotelSummary({ pkg }: { pkg: MarketingPackage }) {
  const hotels = [
    {
      city: "Makkah",
      name: pkg.hotelMakkah.name,
      distance: pkg.hotelMakkah.distanceToHaram,
      rating: pkg.hotelMakkah.starRating,
    },
    pkg.hotelMadinah
      ? {
          city: "Madinah",
          name: pkg.hotelMadinah.name,
          distance: pkg.hotelMadinah.distanceToMasjid,
          rating: pkg.hotelMadinah.starRating,
        }
      : null,
  ].filter(Boolean) as {
    city: string;
    name: string;
    distance?: string;
    rating: number;
  }[];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hotels.map((hotel) => (
        <article
          key={hotel.city}
          className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-lg shadow-primary/5"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary text-secondary">
              <Hotel className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary-700">
                Hotel {hotel.city}
              </p>
              <h3 className="mt-1 font-display text-xl font-black text-primary">
                {hotel.name}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: Math.max(0, Math.min(5, hotel.rating)) }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        className="h-4 w-4 fill-secondary text-secondary"
                      />
                    ),
                  )}
                </div>
                <span className="text-xs font-bold text-neutral-500">
                  {hotel.rating || "-"} Bintang
                </span>
              </div>
              {hotel.distance ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-600">
                  <MapPin className="h-4 w-4 text-secondary-700" />
                  {hotel.distance}
                </p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function LandingPackageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const gallery = pkg.gallery?.length ? pkg.gallery : pkg.image ? [pkg.image] : [];
  const heroImage =
    gallery[0] ||
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80";
  const seatsLeft = getSeatsLeft(pkg);
  const consultLink = getWhatsappLink(pkg, "consult");
  const bookingLink = getWhatsappLink(pkg, "book");
  const descriptionItems = getDescriptionItems(pkg.description);
  const typeLabel = getPackageTypeLabel(pkg);
  const heroDescription =
    descriptionItems[0] ||
    `Paket umroh ${pkg.duration || ""} hari bersama Sahabat Qolbu dengan pendampingan tim berpengalaman.`;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-neutral-800 antialiased">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={pkg.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/55" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7f5ef] to-transparent" />
          </div>

          <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-16">
            <div className="max-w-4xl">
              <Link
                href="/landing/paket"
                className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/75 transition hover:text-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                Semua Paket Umroh
              </Link>

              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  {typeLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur">
                  <BadgeCheck className="h-4 w-4 text-secondary" />
                  PPIU 12112100038690008
                </span>
              </div>

              <h1 className="max-w-4xl font-display text-4xl font-black leading-[1.04] text-white sm:text-5xl lg:text-6xl">
                {pkg.name}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/78 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatPill
                  icon={CalendarDays}
                  label="Berangkat"
                  value={pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul"}
                />
                <StatPill icon={Clock3} label="Durasi" value={`${pkg.duration || "-"} Hari`} />
                <StatPill icon={Plane} label="Maskapai" value={pkg.airline.name} />
                <StatPill icon={Users} label="Seat" value={`${seatsLeft} tersisa`} />
              </div>
            </div>

            <BookingPanel
              pkg={pkg}
              seatsLeft={seatsLeft}
              bookingLink={bookingLink}
              consultLink={consultLink}
            />
          </div>
        </section>

        <section className="relative z-10 -mt-10 pb-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-2xl shadow-primary/10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[320px] bg-primary lg:min-h-[520px]">
                <Image
                  src={gallery[1] || heroImage}
                  alt={pkg.name}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/25 to-transparent" />
              </div>
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary-700">
                  Paket Detail
                </p>
                <h2 className="mt-3 font-display text-3xl font-black leading-tight text-primary">
                  Fokus ke ibadah, detail perjalanan sudah disiapkan.
                </h2>
                <div className="mt-6 grid gap-3">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Travel resmi",
                      text: "Berizin PPIU Kementerian Agama RI.",
                    },
                    {
                      icon: Hotel,
                      title: "Akomodasi jelas",
                      text: "Hotel Makkah dan Madinah tampil transparan.",
                    },
                    {
                      icon: Train,
                      title: "Mobilitas nyaman",
                      text: "Transportasi dan itinerary disiapkan untuk jamaah.",
                    },
                    {
                      icon: Sparkles,
                      title: "Pendampingan",
                      text: "Tim Sahabat Qolbu membantu dari konsultasi sampai keberangkatan.",
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex gap-4 rounded-2xl bg-[#f7f5ef] p-4">
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary text-secondary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-black text-primary">{title}</h3>
                        <p className="mt-1 text-sm font-medium leading-6 text-neutral-600">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
            <div className="space-y-8">
              <HotelSummary pkg={pkg} />

              <LandingPackageTabs pkg={pkg} descriptionItems={descriptionItems} />
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-lg shadow-primary/5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary-700">
                  Harga kamar
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Quad", pkg.priceQuad],
                    ["Triple", pkg.priceTriple || pkg.priceQuad],
                    ["Double", pkg.priceDouble],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <span className="font-bold text-neutral-500">{label}</span>
                      <span className="font-display text-xl font-black text-primary">
                        {toCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-primary p-6 text-white shadow-xl shadow-primary/15">
                <p className="font-display text-2xl font-black">Butuh bantuan pilih paket?</p>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  Konsultasikan jadwal, harga, dan kebutuhan keluarga langsung
                  dengan admin Sahabat Qolbu.
                </p>
                <a
                  href={consultLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3.5 font-black text-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat Admin
                </a>
              </div>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <RelatedPackages
            currentPackageId={pkg.id}
            packageType={pkg.type}
            detailBasePath="/landing/paket"
          />
        </Suspense>
      </main>

      <LandingFooter />
      <CompanySyncRunner />

      <a
        href={consultLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi via WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:bg-green-600"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const mobileMenuBtn = document.getElementById('mobileMenuBtn');
              const mobileMenu = document.getElementById('mobileMenu');
              const header = document.getElementById('header');
              const isDetailHeader = header && header.getAttribute('data-detail-header') === 'true';

              if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.dataset.bound) {
                mobileMenuBtn.dataset.bound = 'true';
                mobileMenuBtn.addEventListener('click', function() {
                  const isOpen = !mobileMenu.classList.contains('hidden');
                  mobileMenu.classList.toggle('hidden');
                  mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
                });

                mobileMenu.querySelectorAll('a').forEach(function(link) {
                  link.addEventListener('click', function() {
                    mobileMenu.classList.add('hidden');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                  });
                });
              }

              function updateHeader() {
                if (!header || !isDetailHeader) return;
                if (window.scrollY > 50) {
                  header.classList.add('bg-primary', 'shadow-lg');
                } else {
                  header.classList.remove('bg-primary', 'shadow-lg');
                }
              }

              if (window.__sqDetailHeaderScrollHandler) {
                window.removeEventListener('scroll', window.__sqDetailHeaderScrollHandler);
              }
              window.__sqDetailHeaderScrollHandler = updateHeader;
              updateHeader();
              window.addEventListener('scroll', window.__sqDetailHeaderScrollHandler, { passive: true });
            })();
          `,
        }}
      />
    </div>
  );
}
