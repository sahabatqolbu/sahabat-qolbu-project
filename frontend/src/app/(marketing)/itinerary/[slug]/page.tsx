import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Hotel,
  MessageCircle,
  Plane,
  ShieldCheck,
} from "lucide-react";
import {
  getMarketingPackageBySlug,
  type MarketingPackage,
} from "@/lib/public-api";
import {
  getItineraryDownloadUrl,
  getItineraryPreviewUrl,
} from "@/lib/itinerary-url";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const revalidate = 0;
const SITE_URL =
  process.env.NODE_ENV === "production"
    ? "https://sahabatqolbu.com"
    : "http://localhost:3000";

const toCurrency = (value?: string) => {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return formatCurrency(Number.isFinite(parsed) ? parsed : 0);
};

const getWhatsappLink = (pkg: MarketingPackage) => {
  const message = `Assalamualaikum admin Sahabat Qolbu, saya ingin bertanya tentang itinerary paket ${pkg.name}.`;
  return `https://wa.me/6281240000101?text=${encodeURIComponent(message)}`;
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg || !pkg.itineraryPdf) {
    return { title: "Itinerary Tidak Ditemukan | Sahabat Qolbu" };
  }

  return {
    title: `Itinerary ${pkg.name} | Sahabat Qolbu`,
    description: `Preview itinerary resmi untuk paket ${pkg.name} dari Sahabat Qolbu.`,
    alternates: {
      canonical: getItineraryPreviewUrl(pkg.slug),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ItineraryPreviewPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg?.itineraryPdf) {
    notFound();
  }

  const downloadUrl = getItineraryDownloadUrl(pkg.slug);
  const publicDownloadUrl = `${SITE_URL}${downloadUrl}`;
  const mobilePreviewUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(publicDownloadUrl)}`;
  const consultLink = getWhatsappLink(pkg);

  return (
    <main className="min-h-screen bg-[#f7faf8] pt-24 text-neutral-800">
      <section className="relative overflow-hidden bg-primary py-10 text-white md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.28),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/paket/${pkg.slug}`}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-gold transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Detail Paket
          </Link>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
                <FileText className="h-4 w-4" />
                Preview Itinerary
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight md:text-5xl">
                Itinerary {pkg.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-white/78">
                Lihat jadwal perjalanan umum dalam tampilan resmi Sahabat
                Qolbu. Detail final tetap mengikuti konfirmasi admin, maskapai,
                hotel, dan kondisi operasional keberangkatan.
              </p>
            </div>

            <div className="rounded-sm border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-bold text-white/70">Mulai dari</p>
              <p className="mt-1 text-3xl font-extrabold text-white">
                {toCurrency(pkg.discountedPrice || pkg.priceQuad)}
              </p>
              <div className="mt-4 grid gap-3 text-sm font-bold text-white/80">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  {pkg.departureDate ? formatDate(pkg.departureDate) : "Jadwal menyusul"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Plane className="h-4 w-4 text-gold" />
                  {pkg.airline.name}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-gold" />
                  {pkg.hotelMakkah.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-xl shadow-primary/10">
            <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gold">
                  Dokumen Jadwal
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-primary">
                  Preview PDF Itinerary
                </h2>
              </div>
              <a
                href={downloadUrl}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-700"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
            <div className="block md:hidden">
              <iframe
                src={mobilePreviewUrl}
                title={`Preview itinerary ${pkg.name}`}
                className="h-[70vh] min-h-[520px] w-full bg-neutral-100"
              />
            </div>
            <div className="hidden md:block">
              <iframe
                src={`${downloadUrl}#toolbar=0&navpanes=0`}
                title={`Itinerary ${pkg.name}`}
                className="h-[72vh] min-h-[520px] w-full bg-neutral-100"
              />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-sm border border-neutral-200 bg-white p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-gold" />
              <h2 className="mt-4 text-xl font-extrabold text-primary">
                Catatan Jadwal
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-neutral-600">
                PDF ini berisi jadwal umum. Jam penerbangan, urutan ziarah, dan
                teknis perjalanan bisa menyesuaikan arahan pembimbing serta
                kebijakan operasional di lapangan.
              </p>
            </div>

            <div className="rounded-sm bg-primary p-6 text-white shadow-lg shadow-primary/15">
              <h2 className="text-xl font-extrabold">
                Ingin validasi itinerary?
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-white/75">
                Admin Sahabat Qolbu bisa bantu jelaskan jadwal, hotel, pilihan
                kamar, dan estimasi pembayaran.
              </p>
              <a
                href={consultLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-5 py-3 font-extrabold text-primary transition hover:bg-white"
              >
                <MessageCircle className="h-5 w-5" />
                Tanya Admin
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
