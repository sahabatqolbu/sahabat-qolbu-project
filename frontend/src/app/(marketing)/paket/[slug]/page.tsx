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
  MapPin,
  MessageCircle,
  Plane,
  Star,
  Train,
  XCircle,
} from "lucide-react";
import RelatedPackages from "@/components/marketing/PackageDetail/RelatedPackages";
import {
  getMarketingPackageBySlug,
  getMarketingPackageSlugs,
  getPublicAgentLanding,
  type MarketingPackage,
} from "@/lib/public-api";
import { getCalonJamaahPackageRegisterUrl } from "@/lib/dashboard-url";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

const toCurrency = (value?: string) => {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return formatCurrency(Number.isFinite(parsed) ? parsed : 0);
};

const getNumericPrice = (value?: string) => {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getOriginalPrice = (pkg: MarketingPackage, currentPrice?: string) => {
  const originalPrice = getNumericPrice(pkg.originalPrice);
  const activePrice = getNumericPrice(currentPrice);

  return originalPrice > activePrice ? pkg.originalPrice : undefined;
};

const getSeatsLeft = (pkg: MarketingPackage) =>
  Math.max(Number(pkg.totalSeats || 0) - Number(pkg.bookedSeats || 0), 0);

const getDescriptionItems = (value?: string) =>
  String(value || "")
    .split(/\r?\n/)
    .map((item) =>
      item
        .replace(/^[-*\s]+/, "")
        .replace(/\*+/g, "")
        .trim(),
    )
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
export const revalidate = 60;

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
  const topPrice = pkg.discountedPrice || pkg.priceQuad;
  const originalPrice = getOriginalPrice(pkg, topPrice);

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl shadow-primary/10">
        <div className="border-b border-neutral-200 p-6">
          <h2 className="text-xl font-extrabold leading-tight text-primary">
            Pesan {pkg.name}
          </h2>
          <p className="mt-5 text-sm font-semibold text-neutral-500">From</p>
          {originalPrice ? (
            <p className="mt-1 text-lg font-extrabold text-neutral-400 line-through decoration-2">
              {toCurrency(originalPrice)}
            </p>
          ) : null}
          <p className="mt-1 text-3xl font-extrabold leading-none text-primary">
            {toCurrency(topPrice)}
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
            <p className="mt-1 font-extrabold text-primary">
              {pkg.hotelMakkah.name}
            </p>
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
              <p className="mt-1 font-extrabold text-primary">
                {pkg.hotelMadinah.name}
              </p>
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
              {pkg.departureDate
                ? formatDate(pkg.departureDate, "long")
                : "Waktu pemberangkatan belum tersedia"}
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
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-4 font-extrabold text-white transition hover:bg-primary-700"
          >
            <ClipboardList className="h-5 w-5" />
            Daftar Paket
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
                  {Array.from({
                    length: Math.max(0, Math.min(5, hotel.rating)),
                  }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-gold text-gold" />
                  ))}
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
        <li
          key={`${item}-${index}`}
          className="flex gap-3 leading-7 text-neutral-700"
        >
          <Icon className="mt-1 h-5 w-5 flex-none text-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function LandingPackageDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ agent?: string }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;
  const agentSlug = sParams?.agent || "";

  let waNumber = "6281255871984"; // Default company WA number
  if (agentSlug) {
    const agentLanding = await getPublicAgentLanding(agentSlug);
    if (agentLanding?.cta?.whatsapp) {
      const digits = agentLanding.cta.whatsapp.replace(/\D/g, "");
      if (digits) {
        if (digits.startsWith("0")) {
          waNumber = "62" + digits.slice(1);
        } else if (digits.startsWith("8")) {
          waNumber = "62" + digits;
        } else {
          waNumber = digits;
        }
      }
    }
  }

  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const getWhatsappLink = (
    pkg: MarketingPackage,
    intent: "consult" | "book",
  ) => {
    const action =
      intent === "book" ? "ingin booking seat" : "tertarik konsultasi";
    const message = `Assalamualaikum, saya lihat di website sahabatqolbu.com dan ${action} paket ${pkg.name}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  };

  const gallery = pkg.gallery?.length
    ? pkg.gallery
    : pkg.image
      ? [pkg.image]
      : [];
  const fallbackHeroImage =
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80";
  const heroImageSource = gallery[0];
  const heroImage =
    heroImageSource && !heroImageSource.includes("localhost:5000")
      ? heroImageSource
      : fallbackHeroImage;
  const seatsLeft = getSeatsLeft(pkg);
  const consultLink = getWhatsappLink(pkg, "consult");
  const bookingLink = getCalonJamaahPackageRegisterUrl(pkg.slug);
  const descriptionItems = getDescriptionItems(pkg.description);
  const typeLabel = getPackageTypeLabel(pkg);
  const heroDescription =
    descriptionItems[0] ||
    `Paket umroh ${pkg.duration || ""} hari bersama Sahabat Qolbu dengan pendampingan tim berpengalaman.`;
  const packageDescription =
    String(pkg.description || "").trim() ||
    "Deskripsi paket akan diinformasikan lebih lanjut oleh admin Sahabat Qolbu.";
  const packageAdvantages = pkg.terms?.length ? pkg.terms : undefined;
  const infoNav = [
    ["deskripsi", "Deskripsi"],
    ["termasuk", "Termasuk"],
    ["tidak-termasuk", "Tidak Termasuk"],
    ["keunggulan", "Keunggulan Paket"],
    ["info", "Informasi Lebih Lanjut"],
  ];

  return (
    <div className="landing-detail min-h-screen bg-white font-[var(--font-inter)] text-neutral-800 antialiased">
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
                      value: pkg.departureDate
                        ? formatDate(pkg.departureDate)
                        : "Menyusul",
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
                  fallback="Informasi tidak termasuk belum diisi di dashboard."
                  icon={XCircle}
                />
              </DetailSection>

              <DetailSection id="keunggulan" title="Keunggulan Paket">
                <SimpleList
                  items={packageAdvantages}
                  fallback="Keunggulan paket belum diisi di dashboard."
                  icon={CheckCircle2}
                />
              </DetailSection>

              <DetailSection id="info" title="Informasi Lebih Lanjut">
                <div className="rounded-sm border border-gold/40 bg-gold/10 p-5">
                  <div className="flex gap-3">
                    <Info className="mt-1 h-5 w-5 flex-none text-gold" />
                    <div>
                      <p className="font-extrabold text-primary">
                        Detail harga, jadwal, dan ketersediaan seat bisa berubah
                        mengikuti kondisi maskapai dan hotel.
                      </p>
                      <p className="mt-2 leading-7 text-neutral-700">
                        Hubungi admin Sahabat Qolbu untuk validasi jadwal,
                        pilihan kamar, dokumen, dan arahan pembayaran sebelum
                        booking.
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
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-neutral-100 pb-3"
                    >
                      <span className="font-bold text-neutral-500">
                        {label}
                      </span>
                      <span className="text-right">
                        {getOriginalPrice(pkg, value) ? (
                          <span className="block text-xs font-extrabold text-neutral-400 line-through decoration-2">
                            {toCurrency(getOriginalPrice(pkg, value))}
                          </span>
                        ) : null}
                        <span className="block text-lg font-extrabold text-primary">
                          {toCurrency(value)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm bg-primary p-6 text-white shadow-lg shadow-primary/15">
                <p className="text-xl font-extrabold">
                  Butuh bantuan pilih paket?
                </p>
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
