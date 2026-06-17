import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Hotel,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getMarketingPackageById } from "@/lib/public-api";
import type { MarketingPackage } from "@/lib/public-api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

const WA_NUMBER = "6281255871984";

const toCurrency = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return formatCurrency(Number.isFinite(parsed) ? parsed : 0);
};

const getDateRange = (pkg: MarketingPackage) => {
  if (!pkg.departureDate) return "Jadwal menyusul";
  if (!pkg.returnDate) return formatDate(pkg.departureDate, "long");
  return `${formatDate(pkg.departureDate, "long")} - ${formatDate(pkg.returnDate, "long")}`;
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
          <Link href="/landing/" className="flex items-center gap-3">
            <img
              src="/landing/images/icon.png"
              alt="Logo Sahabat Qolbu"
              className="h-10 w-10 object-contain md:h-12 md:w-12"
            />
            <div>
              <span className="text-lg font-bold md:text-xl">
                <span className="text-white">Sahabat</span>{" "}
                <span className="text-secondary">Qolbu</span>
              </span>
              <span className="hidden text-xs text-white/70 sm:block">
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
              className="rounded-full bg-secondary px-5 py-2.5 font-semibold text-primary transition-opacity hover:opacity-90"
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        {label}
      </p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-black text-primary">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-success" />
            <span className="text-sm font-medium text-neutral-700">{item}</span>
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
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-secondary">
          <Hotel className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-500">{title}</p>
          <h3 className="font-bold text-primary">{name}</h3>
        </div>
      </div>
      {distance ? (
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-600">
          <MapPin className="h-4 w-4 text-secondary" />
          {distance}
        </p>
      ) : null}
      {facilities?.length ? (
        <div className="flex flex-wrap gap-2">
          {facilities.slice(0, 5).map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold text-primary"
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
    <div className="min-h-screen bg-neutral-50 text-primary">
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,193,7,0.22),transparent_34%),linear-gradient(135deg,rgba(10,44,69,0.96),rgba(6,26,42,0.98))]" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
            <Link
              href="/landing/paket"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Semua Paket
            </Link>

            <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Paket database resmi
                </div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  {pkg.name}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
                  {pkg.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <StatCard
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Keberangkatan"
                    value={pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul"}
                  />
                  <StatCard
                    icon={<Clock3 className="h-5 w-5" />}
                    label="Durasi"
                    value={`${pkg.duration || "-"} Hari`}
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5" />}
                    label="Seat Tersisa"
                    value={`${seatsLeft} Seat`}
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur">
                <img
                  src={heroImage}
                  alt={pkg.name}
                  className="aspect-[4/3] w-full rounded-[1.45rem] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-14">
          <div className="space-y-8">
            {gallery.length > 1 ? (
              <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 6).map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${pkg.name} ${index + 1}`}
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-black text-primary">Ringkasan Paket</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Kode Paket</p>
                  <p className="mt-1 font-bold text-primary">{pkg.code}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Tanggal</p>
                  <p className="mt-1 font-bold text-primary">{getDateRange(pkg)}</p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Maskapai</p>
                  <p className="mt-1 flex items-center gap-2 font-bold text-primary">
                    <Plane className="h-4 w-4 text-secondary" />
                    {pkg.airline.name}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-500">Tipe</p>
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

            {pkg.itinerary?.length ? (
              <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-black text-primary">Rencana Perjalanan</h2>
                <div className="space-y-4">
                  {pkg.itinerary.map((item) => (
                    <div key={`${item.day}-${item.title}`} className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-secondary">
                        Hari {item.day}
                      </p>
                      <h3 className="mt-1 font-bold text-primary">{item.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {item.activities.map((activity) => (
                          <li key={activity} className="flex gap-2 text-sm text-neutral-700">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success" />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-xl">
              <p className="text-sm font-semibold text-neutral-500">Harga mulai dari</p>
              <p className="mt-2 text-4xl font-black text-primary">
                {toCurrency(pkg.priceQuad)}
              </p>
              <p className="mt-1 text-sm text-neutral-500">per jamaah, sesuai ketersediaan kamar</p>

              <div className="mt-6 space-y-3 rounded-2xl bg-neutral-50 p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">Double</span>
                  <span className="font-bold text-primary">{toCurrency(pkg.priceDouble)}</span>
                </div>
                {pkg.priceTriple ? (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-neutral-500">Triple</span>
                    <span className="font-bold text-primary">{toCurrency(pkg.priceTriple)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">Quad</span>
                  <span className="font-bold text-primary">{toCurrency(pkg.priceQuad)}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-success px-5 py-4 font-bold text-white transition hover:bg-green-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  Tanya Paket Ini
                </a>
                {pkg.itineraryPdf ? (
                  <a
                    href={pkg.itineraryPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-bold text-white transition hover:bg-primary-600"
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
