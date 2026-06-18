import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Hotel,
  Info,
  MapPin,
  MessageCircle,
  Plane,
  Train,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
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

const sectionLinks = [
  { href: "#rincian", label: "Rincian Perjalanan" },
  { href: "#termasuk", label: "Termasuk" },
  { href: "#tidak-termasuk", label: "Tidak Termasuk" },
  { href: "#persyaratan", label: "Pendaftaran & Persyaratan" },
  { href: "#info", label: "Informasi Lebih Lanjut" },
];

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

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200 py-4 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <div className="mt-1 font-bold leading-relaxed text-primary">{children}</div>
    </div>
  );
}

function PackageOrderPanel({
  pkg,
  seatsLeft,
  bookingLink,
}: {
  pkg: MarketingPackage;
  seatsLeft: number;
  bookingLink: string;
}) {
  return (
    <aside className="rounded-sm border border-neutral-200 bg-white shadow-xl shadow-primary/10">
      <div className="border-b border-neutral-200 p-6">
        <h2 className="text-xl font-black text-primary">Pesan {pkg.name}</h2>
        <p className="mt-4 text-sm font-semibold text-neutral-500">From</p>
        <p className="mt-1 text-3xl font-black text-primary">
          {toCurrency(pkg.priceQuad)}
        </p>
      </div>

      <div className="px-6">
        <InfoRow label="Tour Type">{getPackageTypeLabel(pkg)}</InfoRow>
        <InfoRow label={`Hotel Makkah${pkg.duration ? " (Program)" : ""}`}>
          {pkg.hotelMakkah.name}
        </InfoRow>
        {pkg.hotelMadinah ? (
          <InfoRow label="Hotel Madinah">{pkg.hotelMadinah.name}</InfoRow>
        ) : null}
        <InfoRow label="Maskapai">
          <span className="inline-flex items-center gap-2">
            <Plane className="h-4 w-4 text-secondary" />
            {pkg.airline.name}
          </span>
        </InfoRow>
        <InfoRow label="Transportasi">
          <span className="inline-flex items-center gap-2">
            <Train className="h-4 w-4 text-secondary" />
            Kereta / bus sesuai program
          </span>
        </InfoRow>
      </div>

      <div className="border-t border-neutral-200 p-6">
        <p className="mb-3 font-bold text-primary">
          Pilih waktu pemberangkatan {pkg.name}
        </p>
        <div className="rounded-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
          {pkg.departureDate ? formatDate(pkg.departureDate, "long") : "Waktu pemberangkatan belum tersedia"}
        </div>
        <p className="mt-3 text-sm font-bold text-red-600">
          {seatsLeft > 0 ? `${seatsLeft} seat tersisa` : "Seat sedang dikonfirmasi"}
        </p>

        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-4 font-black text-white transition hover:bg-primary-700"
        >
          <MessageCircle className="h-5 w-5" />
          Booking via WhatsApp
        </a>
      </div>
    </aside>
  );
}

function ContentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-neutral-200 py-8 last:border-b-0">
      <h2 className="mb-5 text-2xl font-black text-primary">{title}</h2>
      {children}
    </section>
  );
}

function PlainList({
  items,
  fallback,
  icon: Icon = CheckCircle2,
}: {
  items?: string[];
  fallback: string;
  icon?: LucideIcon;
}) {
  const safeItems = items?.length ? items : [fallback];

  return (
    <ul className="space-y-3">
      {safeItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3 leading-7 text-neutral-700">
          <Icon className="mt-1 h-5 w-5 flex-none text-secondary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Footer() {
  return (
    <footer className="bg-primary py-8 text-center text-sm text-white/60">
      <p>(c) 2026 Sahabat Qolbu Cahaya Baitullah. All rights reserved.</p>
    </footer>
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
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1600&q=80";
  const seatsLeft = getSeatsLeft(pkg);
  const consultLink = getWhatsappLink(pkg, "consult");
  const bookingLink = getWhatsappLink(pkg, "book");
  const descriptionItems = getDescriptionItems(pkg.description);
  const heroDescription =
    descriptionItems[0] ||
    `Paket umroh ${pkg.duration || ""} hari bersama Sahabat Qolbu dengan pendampingan tim berpengalaman.`;

  return (
    <div className="min-h-screen bg-white text-neutral-800 antialiased">
      <Navbar />

      <main className="pt-32">
        <section className="bg-neutral-50 pb-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-sm font-semibold text-neutral-500">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/paket" className="hover:text-primary">
                Paket Umroh
              </Link>
              <span className="mx-2">/</span>
              <span className="text-primary">{pkg.name}</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div>
                <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl shadow-primary/10">
                  <div className="relative aspect-[16/9] min-h-[300px]">
                    <Image
                      src={heroImage}
                      alt={pkg.name}
                      fill
                      priority
                      sizes="(min-width: 1024px) 760px, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="mt-7">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-secondary">
                    {getPackageTypeLabel(pkg)}
                  </p>
                  <h1 className="mt-2 text-3xl font-black leading-tight text-primary sm:text-4xl lg:text-5xl">
                    {pkg.name}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-neutral-600">
                    {heroDescription}
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: CalendarDays,
                      label: "Berangkat",
                      value: pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul",
                    },
                    {
                      icon: CalendarDays,
                      label: "Durasi",
                      value: `${pkg.duration || "-"} Hari`,
                    },
                    { icon: Plane, label: "Maskapai", value: pkg.airline.name },
                    { icon: Hotel, label: "Hotel", value: pkg.hotelMakkah.name },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-sm border border-neutral-200 bg-white p-4">
                      <Icon className="h-5 w-5 text-secondary" />
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                        {label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-primary">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <PackageOrderPanel
                pkg={pkg}
                seatsLeft={seatsLeft}
                bookingLink={bookingLink}
              />
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-6 overflow-x-auto py-5 text-sm font-black text-primary">
              {sectionLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap transition hover:text-secondary"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="pb-14 pt-4">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8">
            <article className="bg-white">
              <ContentSection id="rincian" title="Rincian Perjalanan">
                {pkg.itinerary?.length ? (
                  <div className="space-y-6">
                    {pkg.itinerary.map((item) => (
                      <div key={`${item.day}-${item.title}`}>
                        <h3 className="text-lg font-black text-primary">
                          Day {String(item.day).padStart(2, "0")}: {item.title}
                        </h3>
                        <div className="mt-2 space-y-2 text-base leading-8 text-neutral-700">
                          {item.activities.map((activity, index) => (
                            <p key={`${activity}-${index}`}>{activity}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 leading-8 text-neutral-700">
                    {descriptionItems.length ? (
                      descriptionItems.map((item, index) => (
                        <p key={`${item}-${index}`}>{item}</p>
                      ))
                    ) : (
                      <p>Rincian perjalanan akan diinformasikan oleh tim Sahabat Qolbu.</p>
                    )}
                  </div>
                )}
              </ContentSection>

              <ContentSection id="termasuk" title="Termasuk">
                <p className="mb-4 font-bold text-primary">Harga paket sudah termasuk:</p>
                <PlainList
                  items={pkg.included}
                  fallback="Tiket pesawat, akomodasi, transportasi, konsumsi, dan pendampingan sesuai program."
                />
              </ContentSection>

              <ContentSection id="tidak-termasuk" title="Tidak Termasuk">
                <p className="mb-4 font-bold text-primary">Harga paket tidak termasuk:</p>
                <PlainList
                  items={pkg.excluded}
                  fallback="Biaya paspor, vaksin, kelebihan bagasi, dan pengeluaran pribadi di luar program."
                  icon={XCircle}
                />
              </ContentSection>

              <ContentSection id="persyaratan" title="Pendaftaran & Persyaratan">
                <PlainList
                  items={pkg.terms}
                  fallback="Paspor aktif, KTP, KK, foto, dokumen pendukung, serta deposit sesuai ketentuan paket."
                  icon={ClipboardList}
                />
              </ContentSection>

              <ContentSection id="info" title="Informasi Lebih Lanjut">
                <div className="space-y-4 leading-8 text-neutral-700">
                  <p>
                    Untuk informasi lebih lanjut dan pendampingan konsultasi hingga pendaftaran,
                    silakan hubungi admin resmi Sahabat Qolbu melalui WhatsApp.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={consultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 font-black text-white transition hover:bg-primary-700"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Hubungi Admin
                    </a>
                    {pkg.itineraryPdf ? (
                      <a
                        href={pkg.itineraryPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-primary px-6 py-3 font-black text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Download className="h-5 w-5" />
                        Download Itinerary
                      </a>
                    ) : null}
                  </div>
                </div>
              </ContentSection>
            </article>

            <aside className="space-y-5 lg:pt-8">
              <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="flex items-center gap-2 font-black text-primary">
                  <Hotel className="h-5 w-5 text-secondary" />
                  Akomodasi
                </h3>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="font-black text-primary">Hotel Makkah</p>
                    <p className="mt-1 text-neutral-600">{pkg.hotelMakkah.name}</p>
                    {pkg.hotelMakkah.distanceToHaram ? (
                      <p className="mt-1 flex items-center gap-1 text-neutral-500">
                        <MapPin className="h-4 w-4" />
                        {pkg.hotelMakkah.distanceToHaram}
                      </p>
                    ) : null}
                  </div>
                  {pkg.hotelMadinah ? (
                    <div>
                      <p className="font-black text-primary">Hotel Madinah</p>
                      <p className="mt-1 text-neutral-600">{pkg.hotelMadinah.name}</p>
                      {pkg.hotelMadinah.distanceToMasjid ? (
                        <p className="mt-1 flex items-center gap-1 text-neutral-500">
                          <MapPin className="h-4 w-4" />
                          {pkg.hotelMadinah.distanceToMasjid}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-sm border border-neutral-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-black text-primary">
                  <Info className="h-5 w-5 text-secondary" />
                  Harga Kamar
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Quad", pkg.priceQuad],
                    ["Triple", pkg.priceTriple || pkg.priceQuad],
                    ["Double", pkg.priceDouble],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-neutral-100 pb-3">
                      <span className="font-bold text-neutral-500">{label}</span>
                      <span className="font-black text-primary">{toCurrency(value)}</span>
                    </div>
                  ))}
                </div>
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

      <Footer />

      <a
        href={consultLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi via WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:bg-green-600"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
