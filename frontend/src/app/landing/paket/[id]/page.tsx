import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Hotel,
  MessageCircle,
  Plane,
  Users,
} from "lucide-react";
import { getMarketingPackageById } from "@/lib/public-api";
import type { MarketingPackage } from "@/lib/public-api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

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

function InfoList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold text-primary">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
            <span className="text-sm font-medium text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HotelCard({
  title,
  name,
  distance,
  facilities,
}: {
  title: string;
  name: string;
  distance?: string;
  facilities?: string[];
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-secondary">
          <Hotel className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <h3 className="font-bold text-primary">{name}</h3>
        </div>
      </div>
      {distance ? <p className="mb-3 text-sm font-semibold text-gray-600">{distance}</p> : null}
      {facilities?.length ? (
        <div className="flex flex-wrap gap-2">
          {facilities.slice(0, 5).map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-primary"
            >
              {facility}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default async function LandingPackageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pkg = await getMarketingPackageById(id);

  if (!pkg) {
    notFound();
  }

  const gallery = pkg.gallery?.length ? pkg.gallery : pkg.image ? [pkg.image] : [];
  const heroImage =
    gallery[0] ||
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80";
  const seatsLeft = getSeatsLeft(pkg);
  const whatsappLink = getWhatsappLink(pkg);

  return (
    <div className="min-h-screen bg-gray-50 text-primary">
      <LandingHeader />

      <main>
        <section className="bg-primary text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
            <div>
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
              <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {pkg.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
                {pkg.description}
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

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/25">
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

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-primary">Ringkasan Paket</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Kode Paket</p>
                  <p className="mt-1 font-bold text-primary">{pkg.code}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Tanggal</p>
                  <p className="mt-1 font-bold text-primary">
                    {pkg.departureDate ? formatDate(pkg.departureDate, "long") : "Menyusul"}
                    {pkg.returnDate ? ` - ${formatDate(pkg.returnDate, "long")}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Maskapai</p>
                  <p className="mt-1 flex items-center gap-2 font-bold text-primary">
                    <Plane className="h-4 w-4 text-secondary" />
                    {pkg.airline.name}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-500">Tipe</p>
                  <p className="mt-1 font-bold text-primary">{pkg.backendType || pkg.type}</p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <HotelCard
                title="Hotel Makkah"
                name={pkg.hotelMakkah.name}
                distance={pkg.hotelMakkah.distanceToHaram}
                facilities={pkg.hotelMakkah.facilities}
              />
              {pkg.hotelMadinah ? (
                <HotelCard
                  title="Hotel Madinah"
                  name={pkg.hotelMadinah.name}
                  distance={pkg.hotelMadinah.distanceToMasjid}
                  facilities={pkg.hotelMadinah.facilities}
                />
              ) : null}
            </div>

            <InfoList title="Fasilitas Termasuk" items={pkg.included} />
            <InfoList title="Syarat & Catatan" items={pkg.terms} />
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
