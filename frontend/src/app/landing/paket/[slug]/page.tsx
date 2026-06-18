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
  Instagram,
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
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
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
                <span className="js-logo-qolbu text-secondary transition-colors duration-300">
                  Qolbu
                </span>
              </span>
              <span className="js-company-tagline hidden text-xs text-gray-300 transition-colors duration-300 sm:block">
                Cahaya Baitullah
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/#beranda"
              className="nav-link font-medium text-white transition-colors hover:text-secondary"
            >
              Beranda
            </Link>
            <Link
              href="/#tentang"
              className="nav-link font-medium text-white transition-colors hover:text-secondary"
            >
              Tentang
            </Link>
            <Link
              href="/paket"
              className="nav-link font-medium text-white transition-colors hover:text-secondary"
            >
              Paket
            </Link>
            <Link
              href="/#testimoni"
              className="nav-link font-medium text-white transition-colors hover:text-secondary"
            >
              Testimoni
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik konsultasi tentang paket umroh")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gradient-to-r from-secondary to-secondary-400 px-5 py-2.5 font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Hubungi Kami
            </a>
          </div>

          <button
            type="button"
            className="p-2 text-white transition-colors hover:text-secondary md:hidden"
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
            className="block py-2 text-white transition-colors hover:text-secondary"
          >
            Beranda
          </Link>
          <Link
            href="/#tentang"
            className="block py-2 text-white transition-colors hover:text-secondary"
          >
            Tentang
          </Link>
          <Link
            href="/paket"
            className="block py-2 text-white transition-colors hover:text-secondary"
          >
            Paket
          </Link>
          <Link
            href="/#testimoni"
            className="block py-2 text-white transition-colors hover:text-secondary"
          >
            Testimoni
          </Link>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik konsultasi tentang paket umroh")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-full bg-gradient-to-r from-secondary to-secondary-400 px-5 py-3 text-center font-semibold text-primary"
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
    <footer className="bg-primary text-white">
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
                  Sahabat <span className="text-secondary">Qolbu</span>
                </span>
                <span className="block text-xs text-white/60">Cahaya Baitullah</span>
              </div>
            </Link>
            <p className="max-w-md leading-relaxed text-white/70">
              Travel Haji dan Umroh berizin resmi Kementerian Agama Republik
              Indonesia No. PPIU 12112100038690008.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/sahabatqolbu.ofc/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-secondary hover:text-primary"
                aria-label="Instagram Sahabat Qolbu"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-secondary hover:text-primary"
                aria-label="WhatsApp Sahabat Qolbu"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Menu</h3>
            <ul className="space-y-3 text-white/70">
              <li>
                <Link href="/#beranda" className="hover:text-secondary">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/#tentang" className="hover:text-secondary">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/paket" className="hover:text-secondary">
                  Paket Umroh
                </Link>
              </li>
              <li>
                <Link href="/#testimoni" className="hover:text-secondary">
                  Testimoni
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Kontak</h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-secondary" />
                <span>
                  Ruko Jl. Ebony, Metland Transyogi No.11, Cileungsi, Kab.
                  Bogor, Jawa Barat 16820
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-secondary" />
                <a href={`https://wa.me/${WA_NUMBER}`} className="hover:text-secondary">
                  0812-5587-1984
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-secondary" />
                <a
                  href="mailto:Sahabatqolbucahayabaitullah@gmail.com"
                  className="break-all hover:text-secondary"
                >
                  Sahabatqolbucahayabaitullah@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-sm text-white/45">
          © 2026 Sahabat Qolbu Cahaya Baitullah. All rights reserved.
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
          <p className="mt-1 font-sans text-4xl font-black leading-none text-secondary">
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
              <h3 className="mt-1 font-sans text-xl font-black text-primary">
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
    <div className="landing-detail min-h-screen bg-white font-[var(--font-inter)] text-neutral-800 antialiased">
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
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-16">
            <div className="max-w-4xl">
              <Link
                href="/paket"
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

              <h1 className="max-w-4xl font-sans text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
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
                <h2 className="mt-3 font-sans text-3xl font-extrabold leading-tight text-primary">
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
                    <div key={title} className="flex gap-4 rounded-2xl bg-gray-50 p-4">
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
                      <span className="font-sans text-xl font-black text-primary">
                        {toCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-primary p-6 text-white shadow-xl shadow-primary/15">
                <p className="font-sans text-2xl font-black">Butuh bantuan pilih paket?</p>
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
            detailBasePath="/paket"
          />
        </Suspense>
      </main>

      <LandingFooter />

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

              if (mobileMenuBtn && mobileMenu) {
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
                if (!header) return;
                if (window.scrollY > 50) {
                  header.classList.add('bg-primary', 'shadow-lg');
                } else {
                  header.classList.remove('bg-primary', 'shadow-lg');
                }
              }

              updateHeader();
              window.addEventListener('scroll', updateHeader, { passive: true });
            })();
          `,
        }}
      />
    </div>
  );
}
