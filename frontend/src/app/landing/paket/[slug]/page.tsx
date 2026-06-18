import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
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

      <main className="bg-[#F7F5EF]">
        <section className="relative min-h-[680px] overflow-hidden bg-primary text-white">
          <Image
            src={heroImage}
            alt={pkg.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/88 to-primary/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,193,7,0.22),transparent_28%)]" />

          <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-end px-4 pb-10 pt-10 sm:px-6 lg:px-8">
            <Link
              href="/landing/paket"
              className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Semua Paket
            </Link>

            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="h-4 w-4" />
                Detail Paket Umroh
              </div>
              <h1 className="font-sans text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                {pkg.name}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-100">
                {heroDescription}
              </p>
            </div>

            <div className="mt-10 grid gap-3 rounded-[2rem] border border-white/15 bg-white/10 p-3 backdrop-blur md:grid-cols-4">
              {[
                {
                  label: "Mulai Dari",
                  value: toCurrency(pkg.priceQuad),
                  icon: ShieldCheck,
                },
                {
                  label: "Berangkat",
                  value: pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul",
                  icon: CalendarDays,
                },
                { label: "Durasi", value: `${pkg.duration || "-"} Hari`, icon: Clock3 },
                { label: "Seat", value: `${seatsLeft} Tersisa`, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl bg-white p-5 text-primary">
                  <Icon className="mb-4 h-6 w-6 text-secondary" />
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-8">
              <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-primary/5 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                  Overview
                </p>
                <h2 className="mt-3 font-sans text-3xl font-black text-primary">
                  Gambaran perjalanan
                </h2>
                <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-neutral-700">
                  {heroDescription}
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    "Data paket langsung dari database Sahabat Qolbu.",
                    "Detail hotel, maskapai, jadwal, dan fasilitas tersedia di tab.",
                    "Tim kami siap bantu validasi seat dan kebutuhan jamaah.",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-neutral-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
                      <p className="text-sm font-semibold leading-relaxed text-neutral-700">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <LandingPackageTabs pkg={pkg} descriptionItems={descriptionItems} />

              {gallery.length > 1 ? (
                <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-primary/5 sm:p-6">
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                      Galeri
                    </p>
                    <h2 className="mt-2 font-sans text-3xl font-black text-primary">
                      Visual paket
                    </h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {gallery.slice(0, 6).map((image, index) => (
                      <div
                        key={image}
                        className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-primary/10"
                      >
                        <Image
                          src={image}
                          alt={`${pkg.name} ${index + 1}`}
                          fill
                          sizes="(min-width: 1024px) 20vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-primary/15">
                <div className="bg-primary p-7 text-white">
                  <p className="text-sm font-semibold text-gray-300">Harga mulai dari</p>
                  <p className="mt-3 text-4xl font-black text-secondary">
                    {toCurrency(pkg.priceQuad)}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    Konsultasikan konfigurasi kamar dan ketersediaan seat sebelum booking.
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-4 font-bold text-white transition hover:bg-green-600"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Konsultasi via WhatsApp
                  </a>

                  {pkg.itineraryPdf ? (
                    <a
                      href={pkg.itineraryPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 font-bold text-primary transition hover:bg-secondary-600"
                    >
                      <FileText className="h-5 w-5" />
                      Lihat Itinerary PDF
                    </a>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                        Seat
                      </p>
                      <p className="mt-1 text-2xl font-black text-primary">{seatsLeft}</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                        Durasi
                      </p>
                      <p className="mt-1 text-2xl font-black text-primary">
                        {pkg.duration || "-"}H
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
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
