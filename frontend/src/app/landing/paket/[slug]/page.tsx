import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { LandingPackageTabs } from "@/components/marketing/PackageDetail/LandingPackageTabs";
import { getMarketingPackageBySlug } from "@/lib/public-api";
import type { MarketingPackage } from "@/lib/public-api";
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
              className="rounded-full bg-secondary px-5 py-2.5 font-semibold text-primary hover:opacity-90"
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
  const heroDescription =
    descriptionItems.slice(0, 2).join(" ") ||
    "Detail paket tersedia dari database Sahabat Qolbu.";

  return (
    <div className="min-h-screen bg-white font-sans text-primary">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,193,7,0.18),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.16),transparent_26%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white [clip-path:polygon(0_55%,100%_0,100%_100%,0_100%)]" />
          <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-16">
            <div className="relative">
              <Link
                href="/landing/paket"
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Semua Paket
              </Link>
              <div className="mb-5 inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary shadow-lg shadow-black/10">
                Paket resmi Sahabat Qolbu
              </div>
              <h1 className="max-w-4xl font-sans text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                {pkg.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-200">
                {heroDescription}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Berangkat",
                    value: pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul",
                    icon: CalendarDays,
                  },
                  { label: "Durasi", value: `${pkg.duration || "-"} Hari`, icon: Clock3 },
                  { label: "Seat", value: `${seatsLeft} Tersisa`, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                  >
                    <Icon className="mb-3 h-6 w-6 text-secondary" />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                      {label}
                    </p>
                    <p className="mt-1 font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/25 backdrop-blur">
              <div
                aria-label={pkg.name}
                className="aspect-[4/3] w-full rounded-[1.45rem] bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute -bottom-5 left-6 right-6 rounded-2xl bg-white p-4 text-primary shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                  Harga mulai dari
                </p>
                <p className="mt-1 text-2xl font-black">{toCurrency(pkg.priceQuad)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-14">
          <div className="space-y-8">
            {gallery.length > 1 ? (
              <section className="rounded-3xl border border-neutral-100 bg-white p-4 shadow-xl shadow-primary/5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 6).map((image, index) => (
                    <div
                      key={image}
                      aria-label={`${pkg.name} ${index + 1}`}
                      className="aspect-[4/3] w-full rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <LandingPackageTabs pkg={pkg} descriptionItems={descriptionItems} />
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-2xl shadow-primary/10">
              <div className="bg-primary p-6 text-white">
                <p className="text-sm font-semibold text-gray-300">Harga mulai dari</p>
                <p className="mt-2 text-4xl font-black text-secondary">
                  {toCurrency(pkg.priceQuad)}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  per jamaah, sesuai ketersediaan kamar
                </p>
              </div>

              <div className="p-6">
                <div className="mb-6 rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Seat tersedia</p>
                  <p className="mt-1 text-2xl font-black text-primary">{seatsLeft}</p>
                </div>
                <div className="grid gap-3">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-4 font-bold text-white transition hover:bg-green-600"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Tanya Paket Ini
                  </a>
                  {pkg.itineraryPdf ? (
                    <a
                      href={pkg.itineraryPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-white transition hover:bg-secondary hover:text-primary"
                    >
                      <FileText className="h-5 w-5" />
                      Lihat Itinerary PDF
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </section>
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
