import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { LandingBookingCard } from "@/components/marketing/PackageDetail/LandingBookingCard";
import { LandingGallery } from "@/components/marketing/PackageDetail/LandingGallery";
import { LandingItinerary } from "@/components/marketing/PackageDetail/LandingItinerary";
import { LandingPackageTabs } from "@/components/marketing/PackageDetail/LandingPackageTabs";
import {
  LandingTrustBar,
  LandingTrustStrip,
} from "@/components/marketing/PackageDetail/LandingTrustBar";
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

const getWhatsappLink = (pkg: MarketingPackage) => {
  const message = `Assalamualaikum, saya lihat di website sahabatqolbu.com dan ingin konsultasi detail paket ${pkg.name}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
};

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
  const type = String(pkg.backendType || pkg.type || "").toUpperCase();
  if (type.includes("RAMADHAN") || pkg.name.toLowerCase().includes("ramadhan")) {
    return "Umroh Ramadhan";
  }
  if (
    type.includes("PLUS") ||
    type.includes("EXTREME") ||
    pkg.name.toLowerCase().includes("plus") ||
    pkg.name.toLowerCase().includes("turki") ||
    pkg.name.toLowerCase().includes("dubai")
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
    <header className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between md:h-20">
          <Link href="/landing/" className="flex items-center gap-2 md:gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12">
              <div
                aria-label="Logo Sahabat Qolbu"
                className="h-full w-full bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/landing/images/icon.png')" }}
              />
            </div>
            <div>
              <span className="text-lg font-bold md:text-xl">
                <span className="text-white">Sahabat</span>{" "}
                <span className="text-secondary">Qolbu</span>
              </span>
              <span className="hidden text-xs text-gray-300 sm:block">
                Cahaya Baitullah
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/landing/#beranda" className="font-medium text-white hover:text-secondary">
              Beranda
            </Link>
            <Link href="/landing/#tentang" className="font-medium text-white hover:text-secondary">
              Tentang
            </Link>
            <Link href="/landing/paket" className="font-medium text-secondary">
              Paket
            </Link>
            <Link href="/landing/#testimoni" className="font-medium text-white hover:text-secondary">
              Testimoni
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya ingin konsultasi paket umroh")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-secondary px-5 py-2.5 font-semibold text-primary transition hover:opacity-90"
            >
              Hubungi Kami
            </a>
          </div>

          <Link
            href="/landing/paket"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Paket
          </Link>
        </nav>
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
            <Link href="/landing/" className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12">
                <div
                  aria-label="Logo Sahabat Qolbu"
                  className="h-full w-full bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/landing/images/icon.png')" }}
                />
              </div>
              <div>
                <span className="text-xl font-bold">
                  <span className="text-white">Sahabat</span>{" "}
                  <span className="text-secondary">Qolbu</span>
                </span>
                <span className="block text-xs text-gray-300">Cahaya Baitullah</span>
              </div>
            </Link>
            <p className="mb-6 max-w-md leading-relaxed text-gray-300">
              Sahabat Qolbu Cahaya Baitullah adalah perusahaan Travel Haji dan
              Umroh yang telah memiliki IZIN RESMI dari Kementrian Agama
              Republik Indonesia (No. PPIU 12112100038690008).
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/sahabatqolbu.ofc/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Sahabat Qolbu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-secondary hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/sahabatqolbu.ofc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Sahabat Qolbu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-black transition hover:bg-secondary hover:text-primary"
              >
                f
              </a>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Sahabat Qolbu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-secondary hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Menu</h3>
            <ul className="space-y-3">
              {[
                ["Beranda", "/landing/#beranda"],
                ["Tentang Kami", "/landing/#tentang"],
                ["Paket Umroh", "/landing/paket"],
                ["Testimoni", "/landing/#testimoni"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-300 transition-colors hover:text-secondary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-none text-secondary" />
                <span className="text-sm text-gray-300">
                  Ruko Jl. Ebony, Metland Transyogi No.11,{" "}
                  <strong>Kec. Cileungsi, Kab. Bogor</strong>, Jawa Barat 16820
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-none text-secondary" />
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  className="text-gray-300 transition-colors hover:text-secondary"
                >
                  0812-5587-1984
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-none text-secondary" />
                <a
                  href="mailto:Sahabatqolbucahayabaitullah@gmail.com"
                  className="break-all text-sm text-gray-300 transition-colors hover:text-secondary"
                >
                  Sahabatqolbucahayabaitullah@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center">
          <p className="text-sm text-gray-400">
            Copyright 2026 Sahabat Qolbu Cahaya Baitullah. All rights reserved.
          </p>
        </div>
      </div>
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
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80";
  const seatsLeft = getSeatsLeft(pkg);
  const whatsappLink = getWhatsappLink(pkg);
  const descriptionItems = getDescriptionItems(pkg.description);
  const typeLabel = getPackageTypeLabel(pkg);
  const price = Number.parseFloat(pkg.priceQuad) || 0;
  const originalPrice = Number.parseFloat(pkg.priceDouble) || 0;
  const seatPercent = pkg.totalSeats
    ? Math.round((seatsLeft / pkg.totalSeats) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white font-sans text-primary">
      <LandingHeader />

      <main className="bg-neutral-50">
        <section className="relative isolate overflow-hidden bg-primary text-white">
          <Image
            src={heroImage}
            alt={pkg.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,193,7,0.22),transparent_30%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_78%,rgba(255,193,7,0.16),transparent_30%)]" />

          <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8">
            <Link
              href="/landing/paket"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Semua Paket
            </Link>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Resmi Kemenag RI
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-secondary" />
                    {typeLabel}
                  </span>
                </div>

                <h1 className="font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                  {pkg.name}
                </h1>
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <span className="font-mono text-secondary">{pkg.code}</span>
                  <span className="text-white/30">•</span>
                  <span>Detail paket umroh dari Sahabat Qolbu</span>
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Mulai Dari",
                      value: toCurrency(pkg.priceQuad),
                      icon: ShieldCheck,
                    },
                    {
                      label: "Berangkat",
                      value: pkg.departureDate
                        ? formatDate(pkg.departureDate)
                        : "Menyusul",
                      icon: CalendarDays,
                    },
                    {
                      label: "Durasi",
                      value: `${pkg.duration || "-"} Hari`,
                      icon: Clock3,
                    },
                    {
                      label: "Seat",
                      value: `${seatsLeft} Tersisa`,
                      icon: Users,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                    >
                      <Icon className="mb-3 h-5 w-5 text-secondary" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                        {label}
                      </p>
                      <p className="mt-1 text-base font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="rounded-[2rem] border border-white/15 bg-white/5 p-6 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                    <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    Ringkasan Cepat
                  </div>
                  <ul className="mt-4 space-y-3 text-sm font-medium text-white/85">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success" />
                      Hotel dekat Masjidil Haram &amp; Masjid Nabawi
                    </li>
                    <li className="flex items-start gap-2">
                      <Plane className="mt-0.5 h-4 w-4 flex-none text-secondary" />
                      Penerbangan langsung (tanpa transit)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success" />
                      Muthawif &amp; tim berpengalaman
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-secondary" />
                      DP ringan, booking seat mudah
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <LandingTrustBar />
          </div>
        </section>

        <LandingTrustStrip />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-8">
              <section className="rounded-[2rem] border-2 border-neutral-100 bg-white p-6 shadow-xl shadow-primary/5 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                  Overview
                </p>
                <h2 className="mt-3 font-display text-3xl font-black text-primary">
                  Sekilas Perjalanan
                </h2>
                <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-neutral-700">
                  {descriptionItems.slice(0, 2).join(" ") ||
                    `Nikmati perjalanan ibadah umroh ${pkg.duration || ""} hari dengan akomodasi terbaik dan bimbingan tim Sahabat Qolbu yang berpengalaman.`}
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "Data Real-time",
                      desc: "Harga, seat, dan itinerary selalu sinkron dengan database.",
                    },
                    {
                      title: "Detail Lengkap",
                      desc: "Hotel, maskapai, jadwal keberangkatan, dan fasilitas tersedia.",
                    },
                    {
                      title: "Tim Siap Bantu",
                      desc: "Konsultasi seat & kebutuhan jamaah via WhatsApp 24/7.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border-2 border-neutral-100 bg-neutral-50/60 p-4 transition hover:border-secondary"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="font-display text-base font-black text-primary">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <LandingPackageTabs pkg={pkg} descriptionItems={descriptionItems} />

              <LandingItinerary pkg={pkg} />

              <LandingGallery pkg={pkg} />
            </div>

            <LandingBookingCard pkg={pkg} whatsappLink={whatsappLink} />
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

      <a
        href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya ingin konsultasi umroh")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi via WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-110 hover:bg-green-600"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}