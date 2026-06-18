import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hotel,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
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

const getWhatsappLink = (pkg: MarketingPackage) => {
  const message = `Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik konsultasi paket ${pkg.name}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
};

const getBookingWhatsappLink = (pkg: MarketingPackage) => {
  const message = `Assalamualaikum, saya lihat di website sahabatqolbu.com dan ingin booking seat paket ${pkg.name}`;
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          <Link href="/landing/" className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              <Image
                src="/landing/images/icon.png"
                alt="Logo Sahabat Qolbu"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-lg md:text-xl font-bold">
                <span className="text-white">Sahabat</span>{" "}
                <span className="text-secondary">Qolbu</span>
              </span>
              <span className="hidden sm:block text-xs text-gray-300">
                Cahaya Baitullah
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/landing/#beranda"
              className="font-medium text-white hover:text-secondary transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/landing/#tentang"
              className="font-medium text-white hover:text-secondary transition-colors"
            >
              Tentang
            </Link>
            <Link
              href="/landing/paket"
              className="font-medium text-secondary"
            >
              Paket
            </Link>
            <Link
              href="/landing/#testimoni"
              className="font-medium text-white hover:text-secondary transition-colors"
            >
              Testimoni
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya ingin konsultasi paket umroh")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gold-gradient text-primary font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Hubungi Kami
            </a>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-white hover:text-secondary transition-colors"
            aria-label="Buka menu navigasi"
            id="mobileMenuBtn"
          >
            <svg
              className="w-6 h-6"
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
        className="md:hidden hidden bg-primary border-t border-white/10"
        id="mobileMenu"
      >
        <div className="px-4 py-4 space-y-3">
          <Link
            href="/landing/#beranda"
            className="block text-white hover:text-secondary py-2 transition-colors"
          >
            Beranda
          </Link>
          <Link
            href="/landing/#tentang"
            className="block text-white hover:text-secondary py-2 transition-colors"
          >
            Tentang
          </Link>
          <Link
            href="/landing/paket"
            className="block text-secondary py-2 font-medium"
          >
            Paket
          </Link>
          <Link
            href="/landing/#testimoni"
            className="block text-white hover:text-secondary py-2 transition-colors"
          >
            Testimoni
          </Link>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamualaikum, saya ingin konsultasi paket umroh")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block gold-gradient text-primary font-semibold px-5 py-3 rounded-full text-center mt-4"
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
        <div className="py-12 md:py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/landing/" className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                  <Image
                    src="/landing/images/icon.png"
                    alt="Logo Sahabat Qolbu"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-lg md:text-xl font-bold">
                    <span className="text-white">Sahabat</span>{" "}
                    <span className="text-secondary">Qolbu</span>
                  </span>
                  <span className="hidden sm:block text-xs text-gray-300">
                    Cahaya Baitullah
                  </span>
                </div>
              </Link>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Sahabat Qolbu Cahaya Baitullah adalah perusahaan Travel Haji dan
              Umroh yang telah memiliki IZIN RESMI dari Kementrian Agama
              Republik Indonesia (No. PPIU 12112100038690008).
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/sahabatqolbu.ofc/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-primary transition-all"
                aria-label="Instagram Sahabat Qolbu"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/sahabatqolbu.ofc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-primary transition-all text-sm font-black"
                aria-label="Facebook Sahabat Qolbu"
              >
                f
              </a>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary hover:text-primary transition-all"
                aria-label="WhatsApp Sahabat Qolbu"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Menu</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/landing/#beranda"
                  className="text-gray-300 hover:text-secondary transition-colors"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/landing/#tentang"
                  className="text-gray-300 hover:text-secondary transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/landing/paket"
                  className="text-gray-300 hover:text-secondary transition-colors"
                >
                  Paket Umroh
                </Link>
              </li>
              <li>
                <Link
                  href="/landing/#testimoni"
                  className="text-gray-300 hover:text-secondary transition-colors"
                >
                  Testimoni
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Ruko Jl. Ebony, Metland Transyogi No.11,{" "}
                  <strong>Kec. Cileungsi, Kab. Bogor</strong>, Jawa Barat 16820
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  className="text-gray-300 hover:text-secondary transition-colors"
                >
                  0812-5587-1984
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                <a
                  href="mailto:Sahabatqolbucahayabaitullah@gmail.com"
                  className="text-gray-300 hover:text-secondary transition-colors text-sm break-all"
                >
                  Sahabatqolbucahayabaitullah@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Sahabat Qolbu Cahaya Baitullah. All rights reserved.
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
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80";
  const seatsLeft = getSeatsLeft(pkg);
  const whatsappLink = getWhatsappLink(pkg);
  const bookingLink = getBookingWhatsappLink(pkg);
  const descriptionItems = getDescriptionItems(pkg.description);
  const typeLabel = getPackageTypeLabel(pkg);
  const price = Number.parseFloat(pkg.priceQuad) || 0;
  const originalPrice = Number.parseFloat(pkg.priceDouble) || 0;
  const seatPercent = pkg.totalSeats
    ? Math.round((seatsLeft / pkg.totalSeats) * 100)
    : 0;
  const heroDescription =
    descriptionItems[0] ||
    `Nikmati perjalanan ibadah umroh ${pkg.duration || ""} hari bersama Sahabat Qolbu Cahaya Baitullah.`;

  return (
    <div className="min-h-screen bg-white text-gray-800 antialiased">
      <LandingHeader />

      <main>
        {/* HERO */}
        <section className="relative min-h-[640px] flex items-center pt-16 md:pt-20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={pkg.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-3xl animate-fade-in">
              <Link
                href="/landing/paket"
                className="inline-flex items-center gap-2 mb-6 text-white/80 hover:text-secondary transition-colors text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Semua Paket
              </Link>

              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">
                  Izin PPIU: 12112100038690008
                </span>
              </div>

              <span className="inline-block gold-gradient text-primary font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                {typeLabel}
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                {pkg.name}
                <span className="text-secondary block mt-2 text-2xl sm:text-3xl md:text-4xl font-bold">
                  Resmi Kemenag & Amanah
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-2xl leading-relaxed">
                {heroDescription}
              </p>

              <div className="mb-6 inline-block bg-white text-primary px-5 py-2.5 rounded-lg font-bold shadow-lg">
                <span className="text-secondary">Mulai dari </span>
                {toCurrency(pkg.priceQuad)}{" "}
                <span className="text-gray-500 text-sm font-semibold">
                  / orang (quad)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-gradient text-primary font-bold px-8 py-4 rounded-full text-center hover:opacity-90 transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Booking Seat Sekarang
                </a>
                <a
                  href="#detail-paket"
                  className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full text-center hover:bg-white hover:text-primary transition-all inline-flex items-center justify-center gap-2"
                >
                  Lihat Detail
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Ratusan</p>
                    <p className="text-gray-400 text-xs">Jamaah Puas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Resmi</p>
                    <p className="text-gray-400 text-xs">Kemenag RI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Profesional</p>
                    <p className="text-gray-400 text-xs">Tim Berpengalaman</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INFO STRIP - Ringkasan paket */}
        <section className="bg-white border-b border-neutral-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
            <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                  label: "Seat Tersisa",
                  value: `${seatsLeft} dari ${pkg.totalSeats || "-"}`,
                  icon: Users,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-semibold">
                      {label}
                    </p>
                    <p className="font-bold text-primary truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 1: GAMBARAN + FLOATING CARD ala Tentang di landing home */}
        <section
          id="detail-paket"
          className="py-16 md:py-24 bg-gray-50"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={gallery[1] || gallery[0] || heroImage}
                    alt={pkg.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-5 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">100%</p>
                      <p className="text-gray-500 text-sm">Amanah & Resmi</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
                  Gambaran Paket
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-6">
                  Detail Perjalanan Ibadah Anda
                </h2>
                <div className="prose text-gray-600 mb-6 leading-relaxed">
                  <p className="mb-4">
                    <strong>{pkg.name}</strong> adalah paket umroh dari Sahabat
                    Qolbu Cahaya Baitullah. Nikmati perjalanan ibadah yang
                    nyaman dengan fasilitas terbaik dan bimbingan tim
                    profesional kami.
                  </p>
                  <p className="mb-4">
                    Selama keberangkatan {pkg.duration || "-"} hari, Anda akan
                    mendapatkan pelayanan prima dalam segi:
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {[
                    "Penerbangan Langsung (Tanpa Transit)",
                    "Akomodasi Hotel Dekat Masjid",
                    "Makan & Transportasi Nyaman",
                    "Muthawif/Pemandu Berpengalaman",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="italic text-gray-600 mb-6">
                  &ldquo;Sehingga Jamaah khusyu dalam menjalankan Ibadah Umroh
                  sesuai Qur&rsquo;an &amp; Sunnah.&rdquo;
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">
                        Izin Resmi PPIU
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Terdaftar di Kemenag
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">
                        Direct Flight
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Langsung ke Jeddah/Madinah
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: KEUNGGULAN ala landing home */}
        <section className="py-16 md:py-24 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
                Keunggulan Paket
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                Mengapa Pilih Paket Ini?
              </h2>
              <p className="text-gray-300">
                KAMI PASTIKAN pelayanan terbaik untuk kenyamanan ibadah Anda
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                {
                  title: "Harga Terbaik",
                  desc: "Fasilitas terbaik di kelasnya dengan harga kompetitif.",
                  icon: ShieldCheck,
                },
                {
                  title: "Sesuai Syariat",
                  desc: "Kegiatan ibadah InsyaAllah sesuai Al-Quran & Sunnah.",
                  icon: BadgeCheck,
                },
                {
                  title: "Hotel Dekat",
                  desc: "Hotel dekat dengan Masjid untuk memudahkan ibadah.",
                  icon: Hotel,
                },
                {
                  title: "Jadwal Tepat",
                  desc: "Tanggal berangkat, nomor pesawat & itinerary tertera.",
                  icon: CalendarDays,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="text-center p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition"
                >
                  <div className="w-16 h-16 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: DETAIL PAKET (Tabs) */}
        <section className="py-16 md:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
                Detail Lengkap
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                Informasi Paket Umroh
              </h2>
              <p className="text-gray-600">
                Pelajari detail perjalanan, hotel, maskapai, dan itinerary
                paket ini sebelum melakukan pendaftaran.
              </p>
            </div>

            <LandingPackageTabs
              pkg={pkg}
              descriptionItems={descriptionItems}
            />
          </div>
        </section>

        {/* SECTION 4: BOOKING CARD ala CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-6 sm:p-8 md:p-10">
                  <span className="inline-block gold-gradient text-primary font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                    Penawaran Terbatas
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
                    Amankan Seat Anda Sekarang
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Kuota setiap keberangkatan terbatas untuk menjaga
                    kenyamanan jamaah. Booking sekarang sebelum seat habis.
                  </p>
                  <ul className="space-y-2 mb-6 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      DP ringan, angsuran fleksibel
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Konsultasi gratis via WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Tim profesional siap membantu 24/7
                    </li>
                  </ul>

                  {pkg.totalSeats ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-2">
                        <span>Ketersediaan Seat</span>
                        <span className="text-primary">
                          {seatPercent}% tersedia
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            seatPercent <= 20
                              ? "bg-error"
                              : seatPercent <= 50
                                ? "bg-warning"
                                : "bg-success"
                          }`}
                          style={{ width: `${seatPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3.5 rounded-full transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Konsultasi WhatsApp
                    </a>
                    <a
                      href={bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 gold-gradient text-primary font-bold px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      Booking Sekarang
                    </a>
                  </div>
                </div>

                <div className="bg-primary text-white p-6 sm:p-8 md:p-10 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full" />
                  <div className="relative">
                    <p className="text-sm text-gray-300 mb-2">
                      Harga Mulai Dari
                    </p>
                    <p className="text-4xl md:text-5xl font-extrabold text-secondary mb-1">
                      {toCurrency(pkg.priceQuad)}
                    </p>
                    {originalPrice > price ? (
                      <p className="text-gray-300 text-sm line-through mb-4">
                        {toCurrency(pkg.priceDouble)}
                      </p>
                    ) : (
                      <div className="mb-4" />
                    )}

                    <div className="space-y-3 mt-6">
                      {[
                        { label: "Kode Paket", value: pkg.code },
                        {
                          label: "Berangkat",
                          value: pkg.departureDate
                            ? formatDate(pkg.departureDate)
                            : "Menyusul",
                        },
                        {
                          label: "Durasi",
                          value: `${pkg.duration || "-"} Hari`,
                        },
                        {
                          label: "Maskapai",
                          value: pkg.airline.name,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between border-b border-white/10 pb-2"
                        >
                          <span className="text-gray-300 text-sm">
                            {row.label}
                          </span>
                          <span className="font-bold text-sm text-white text-right">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {pkg.itineraryPdf ? (
                      <a
                        href={pkg.itineraryPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center justify-center gap-2 w-full border-2 border-secondary text-secondary font-bold px-5 py-3 rounded-full hover:bg-secondary hover:text-primary transition-all"
                      >
                        Download Itinerary PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl max-w-2xl mx-auto text-center">
              <p className="text-red-600 font-bold text-sm">
                ⚠️ Segera booking seat sebelum kehabisan!
              </p>
              <p className="text-xs text-red-500">
                Kuota setiap keberangkatan terbatas untuk menjaga kenyamanan
                jamaah.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: RELATED PAKET */}
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors hover:scale-110"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const btn = document.getElementById('mobileMenuBtn');
              const menu = document.getElementById('mobileMenu');
              if (!btn || !menu) return;
              btn.addEventListener('click', function() {
                menu.classList.toggle('hidden');
              });
              menu.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                  menu.classList.add('hidden');
                });
              });
            })();
          `,
        }}
      />
    </div>
  );
}