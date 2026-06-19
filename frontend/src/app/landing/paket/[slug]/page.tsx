import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Hotel,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Star,
  Train,
  XCircle,
} from "lucide-react";
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
  const rawType = String(pkg.backendType || "").trim();

  if (rawType) {
    return rawType
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return String(pkg.type || "UMRAH")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\bumrah\b/g, "umroh")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      className="landing-chrome fixed left-0 right-0 top-0 z-50 bg-primary shadow-lg transition-all duration-300"
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
    <aside className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl shadow-primary/10">
        <div className="border-b border-neutral-200 p-6">
          <h2 className="text-xl font-extrabold leading-tight text-primary">
            Pesan {pkg.name}
          </h2>
          <p className="mt-5 text-sm font-semibold text-neutral-500">From</p>
          <p className="mt-1 text-3xl font-extrabold leading-none text-primary">
            {toCurrency(pkg.priceQuad)}
          </p>
          <p className="mt-2 text-sm font-semibold text-neutral-500">
            per orang, kamar quad
          </p>
        </div>

        <div className="divide-y divide-neutral-200 px-6">
          <div className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Tour Type
            </p>
            <p className="mt-1 font-extrabold text-primary">
              {getPackageTypeLabel(pkg)}
            </p>
          </div>
          <div className="py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Hotel Makkah
            </p>
            <p className="mt-1 font-extrabold text-primary">{pkg.hotelMakkah.name}</p>
            {pkg.hotelMakkah.distanceToHaram ? (
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                {pkg.hotelMakkah.distanceToHaram}
              </p>
            ) : null}
          </div>
          {pkg.hotelMadinah ? (
            <div className="py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                Hotel Madinah
              </p>
              <p className="mt-1 font-extrabold text-primary">{pkg.hotelMadinah.name}</p>
              {pkg.hotelMadinah.distanceToMasjid ? (
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  {pkg.hotelMadinah.distanceToMasjid}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-3 py-4">
            <p className="flex items-center gap-2 font-extrabold text-primary">
              <Plane className="h-4 w-4 text-gold" />
              By {pkg.airline.name}
            </p>
            <p className="flex items-center gap-2 font-extrabold text-primary">
              <Train className="h-4 w-4 text-gold" />
              Kereta / bus sesuai program
            </p>
            <p className="text-sm font-semibold text-neutral-500">
              Makkah - Madinah
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="font-extrabold leading-snug text-primary">
              Pilih waktu pemberangkatan {pkg.name}
            </p>
            <div className="mt-3 rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-primary">
              {pkg.departureDate ? formatDate(pkg.departureDate, "long") : "Waktu pemberangkatan belum tersedia"}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-neutral-500">
              <span>{seatsLeft} seat tersisa</span>
              <span>{seatPercent}% tersedia</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${seatPercent}%` }}
              />
            </div>
          </div>
          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-4 font-extrabold text-white transition hover:bg-primary-700"
          >
            <MessageCircle className="h-5 w-5" />
            Pesan via WhatsApp
          </a>
          <a
            href={consultLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-primary px-5 py-3.5 font-extrabold text-primary transition hover:bg-primary hover:text-white"
          >
            Konsultasi Dulu
          </a>

          {pkg.itineraryPdf ? (
            <a
              href={pkg.itineraryPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 text-sm font-extrabold text-neutral-600 hover:text-primary"
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
    <div className="grid gap-4">
      {hotels.map((hotel) => (
        <article
          key={hotel.city}
          className="rounded-sm border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-sm bg-gold/10 text-gold">
              <Hotel className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                Hotel {hotel.city}
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-primary">
                {hotel.name}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: Math.max(0, Math.min(5, hotel.rating)) }).map(
                    (_, index) => (
                      <Star
                        key={index}
                        className="h-4 w-4 fill-gold text-gold"
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
                  <MapPin className="h-4 w-4 text-gold" />
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

function DetailSection({
  id,
  title,
  children,
  defaultActive = false,
}: {
  id: string;
  title: string;
  children: ReactNode;
  defaultActive?: boolean;
}) {
  return (
    <section
      id={`tab-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-button-${id}`}
      data-package-panel={id}
      className={`scroll-mt-28 py-8 ${defaultActive ? "" : "hidden"}`}
    >
      <h2 className="mb-5 text-2xl font-extrabold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SimpleList({
  items,
  fallback,
  icon: Icon,
}: {
  items?: string[];
  fallback: string;
  icon: typeof CheckCircle2;
}) {
  const listItems = items?.length ? items : [fallback];

  return (
    <ul className="space-y-3">
      {listItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 leading-7 text-neutral-700">
          <Icon className="mt-1 h-5 w-5 flex-none text-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
  const fallbackHeroImage =
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80";
  const heroImageSource = gallery[0];
  const heroImage =
    heroImageSource && !heroImageSource.includes("localhost:5000")
      ? heroImageSource
      : fallbackHeroImage;
  const seatsLeft = getSeatsLeft(pkg);
  const consultLink = getWhatsappLink(pkg, "consult");
  const bookingLink = getWhatsappLink(pkg, "book");
  const descriptionItems = getDescriptionItems(pkg.description);
  const typeLabel = getPackageTypeLabel(pkg);
  const heroDescription =
    descriptionItems[0] ||
    `Paket umroh ${pkg.duration || ""} hari bersama Sahabat Qolbu dengan pendampingan tim berpengalaman.`;
  const packageDescription =
    String(pkg.description || "").trim() ||
    "Deskripsi paket akan diinformasikan lebih lanjut oleh admin Sahabat Qolbu.";
  const packageAdvantages = [
    `${pkg.duration || "-"} hari perjalanan dengan jadwal keberangkatan yang jelas.`,
    `Menggunakan ${pkg.airline.name} untuk kenyamanan perjalanan jamaah.`,
    `Hotel Makkah ${pkg.hotelMakkah.name}${pkg.hotelMakkah.distanceToHaram ? `, ${pkg.hotelMakkah.distanceToHaram}` : ""}.`,
    pkg.hotelMadinah
      ? `Hotel Madinah ${pkg.hotelMadinah.name}${pkg.hotelMadinah.distanceToMasjid ? `, ${pkg.hotelMadinah.distanceToMasjid}` : ""}.`
      : "Akomodasi disesuaikan dengan program paket.",
    "Pendampingan admin Sahabat Qolbu dari konsultasi sampai proses keberangkatan.",
  ];
  const infoNav = [
    ["deskripsi", "Deskripsi"],
    ["termasuk", "Termasuk"],
    ["tidak-termasuk", "Tidak Termasuk"],
    ["keunggulan", "Keunggulan Paket"],
    ["info", "Informasi Lebih Lanjut"],
  ];

  return (
    <div className="landing-detail min-h-screen bg-white font-[var(--font-inter)] text-neutral-800 antialiased">
      <LandingHeader />

      <main className="bg-white pt-20">
        <section className="border-b border-neutral-200 bg-neutral-50 py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/paket"
              className="mb-5 inline-flex items-center gap-2 text-sm font-extrabold text-primary transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Semua Paket Umroh
            </Link>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
              <div>
                <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-lg shadow-primary/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImage}
                    alt={pkg.name}
                    className="block h-auto w-full bg-primary object-contain"
                  />
                </div>

                <div className="mt-7 max-w-4xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-gold">
                    {typeLabel}
                  </p>
                  <h1 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl lg:text-5xl">
                    {pkg.name}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-neutral-600">
                    {heroDescription}
                  </p>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: CalendarDays,
                      label: "Berangkat",
                      value: pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul",
                    },
                    {
                      icon: ClipboardList,
                      label: "Durasi",
                      value: `${pkg.duration || "-"} Hari`,
                    },
                    {
                      icon: Plane,
                      label: "Maskapai",
                      value: pkg.airline.name,
                    },
                    {
                      icon: Hotel,
                      label: "Akomodasi",
                      value: `${pkg.hotelMakkah.starRating || "-"} Bintang`,
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-sm border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <Icon className="h-5 w-5 text-gold" />
                      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-500">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-sm font-extrabold text-primary">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <BookingPanel
                pkg={pkg}
                seatsLeft={seatsLeft}
                bookingLink={bookingLink}
                consultLink={consultLink}
              />
            </div>
          </div>
        </section>

        <nav className="sticky top-20 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div
            className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8"
            role="tablist"
            aria-label="Detail paket"
          >
            {infoNav.map(([id, label], index) => (
              <button
                type="button"
                key={id}
                id={`tab-button-${id}`}
                role="tab"
                data-package-tab={id}
                aria-controls={`tab-${id}`}
                aria-selected={index === 0}
                className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-extrabold transition first:pl-0 ${
                  index === 0
                    ? "border-gold text-gold"
                    : "border-transparent text-primary hover:border-gold hover:text-gold"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <section className="bg-white pb-16 pt-4 md:pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
            <article className="rounded-sm border border-neutral-200 bg-white px-5 py-2 shadow-sm sm:px-8 lg:self-start">
              <DetailSection id="deskripsi" title="Deskripsi" defaultActive>
                <div className="whitespace-pre-line text-sm font-medium leading-6 text-neutral-700 sm:text-base">
                  {packageDescription}
                </div>
              </DetailSection>

              <DetailSection id="termasuk" title="Termasuk">
                <SimpleList
                  items={pkg.included}
                  fallback="Fasilitas paket akan dikonfirmasi oleh admin Sahabat Qolbu."
                  icon={CheckCircle2}
                />
              </DetailSection>

              <DetailSection id="tidak-termasuk" title="Tidak Termasuk">
                <SimpleList
                  items={pkg.excluded}
                  fallback="Pengeluaran pribadi, laundry, kelebihan bagasi, dan biaya lain di luar program."
                  icon={XCircle}
                />
              </DetailSection>

              <DetailSection id="keunggulan" title="Keunggulan Paket">
                <SimpleList items={packageAdvantages} fallback="" icon={CheckCircle2} />
              </DetailSection>

              <DetailSection id="info" title="Informasi Lebih Lanjut">
                <div className="rounded-sm border border-gold/40 bg-gold/10 p-5">
                  <div className="flex gap-3">
                    <Info className="mt-1 h-5 w-5 flex-none text-gold" />
                    <div>
                      <p className="font-extrabold text-primary">
                        Detail harga, jadwal, dan ketersediaan seat bisa berubah mengikuti kondisi maskapai dan hotel.
                      </p>
                      <p className="mt-2 leading-7 text-neutral-700">
                        Hubungi admin Sahabat Qolbu untuk validasi jadwal, pilihan kamar,
                        dokumen, dan arahan pembayaran sebelum booking.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={consultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 font-extrabold text-white transition hover:bg-primary-700"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Tanya Admin
                    </a>
                    {pkg.itineraryPdf ? (
                      <a
                        href={pkg.itineraryPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-primary px-5 py-3 font-extrabold text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Download className="h-5 w-5" />
                        Download Itinerary
                      </a>
                    ) : null}
                  </div>
                </div>
              </DetailSection>
            </article>

            <aside className="space-y-5 lg:sticky lg:top-40 lg:self-start">
              <HotelSummary pkg={pkg} />

              <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
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
                      <span className="text-lg font-extrabold text-primary">
                        {toCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm bg-primary p-6 text-white shadow-lg shadow-primary/15">
                <p className="text-xl font-extrabold">Butuh bantuan pilih paket?</p>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-300">
                  Konsultasikan jadwal, harga, dan kebutuhan keluarga langsung
                  dengan admin Sahabat Qolbu.
                </p>
                <a
                  href={consultLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-sm bg-gold px-5 py-3.5 font-extrabold text-primary transition hover:opacity-90"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat Admin
                </a>
              </div>
            </aside>
          </div>
        </section>

        <Suspense fallback={null}>
          <RelatedPackages
            currentPackageId={pkg.id}
            packageType={pkg.type}
            detailBasePath="/paket"
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
                header.classList.add('bg-primary', 'shadow-lg');
              }

              if (window.__sqDetailHeaderScrollHandler) {
                window.removeEventListener('scroll', window.__sqDetailHeaderScrollHandler);
              }
              window.__sqDetailHeaderScrollHandler = updateHeader;
              updateHeader();
              window.addEventListener('scroll', window.__sqDetailHeaderScrollHandler, { passive: true });

              const tabButtons = Array.from(document.querySelectorAll('[data-package-tab]'));
              const tabPanels = Array.from(document.querySelectorAll('[data-package-panel]'));

              function activatePackageTab(tabId) {
                tabButtons.forEach(function(button) {
                  const isActive = button.getAttribute('data-package-tab') === tabId;
                  button.setAttribute('aria-selected', String(isActive));
                  button.classList.toggle('border-gold', isActive);
                  button.classList.toggle('text-gold', isActive);
                  button.classList.toggle('border-transparent', !isActive);
                  button.classList.toggle('text-primary', !isActive);
                });

                tabPanels.forEach(function(panel) {
                  panel.classList.toggle('hidden', panel.getAttribute('data-package-panel') !== tabId);
                });
              }

              tabButtons.forEach(function(button) {
                if (button.dataset.bound === 'true') return;
                button.dataset.bound = 'true';
                button.addEventListener('click', function() {
                  activatePackageTab(button.getAttribute('data-package-tab'));
                });
              });

              const initialTab = window.location.hash ? window.location.hash.replace('#', '').replace('tab-', '') : 'deskripsi';
              if (tabButtons.some(function(button) { return button.getAttribute('data-package-tab') === initialTab; })) {
                activatePackageTab(initialTab);
              }
            })();
          `,
        }}
      />
    </div>
  );
}
