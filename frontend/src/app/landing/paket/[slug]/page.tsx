import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  MessageCircle,
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
    <div className="min-h-screen bg-[#F9F5EC] font-sans text-primary">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#FFC107_0,transparent_28%),radial-gradient(circle_at_80%_10%,#ffffff_0,transparent_22%)]" />
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
            <div className="relative">
              <Link
                href="/landing/paket"
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Semua Paket
              </Link>
              <div className="mb-5 inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                Data dari database
              </div>
              <h1 className="max-w-4xl font-sans text-4xl font-black leading-[0.96] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {pkg.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
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
                    className="rounded-2xl border border-white/15 bg-white/10 p-4"
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

            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/25">
              <div
                aria-label={pkg.name}
                className="aspect-[4/3] w-full rounded-[1.45rem] bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-14">
          <div className="space-y-8">
            {gallery.length > 1 ? (
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 6).map((image, index) => (
                    <div
                      key={image}
                      aria-label={`${pkg.name} ${index + 1}`}
                      className="aspect-[4/3] w-full rounded-xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <LandingPackageTabs pkg={pkg} descriptionItems={descriptionItems} />
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <p className="text-sm font-semibold text-gray-500">Harga mulai dari</p>
              <p className="mt-2 text-4xl font-black text-primary">
                {toCurrency(pkg.priceQuad)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                per jamaah, sesuai ketersediaan kamar
              </p>

              <div className="mt-6 grid gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-4 font-bold text-white hover:bg-green-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  Tanya Paket Ini
                </a>
                {pkg.itineraryPdf ? (
                  <a
                    href={pkg.itineraryPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-white hover:bg-secondary"
                  >
                    <FileText className="h-5 w-5" />
                    Lihat Itinerary PDF
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
