import { CalendarDays, FileText, MessageCircle, ShieldCheck, Users } from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Props = {
  pkg: MarketingPackage;
  whatsappLink: string;
};

const WA_NUMBER = "6281255871984";

export function LandingBookingCard({ pkg, whatsappLink }: Props) {
  const seatsLeft = Math.max(Number(pkg.totalSeats || 0) - Number(pkg.bookedSeats || 0), 0);
  const seatPercent = pkg.totalSeats
    ? Math.round((seatsLeft / pkg.totalSeats) * 100)
    : 0;
  const price = Number.parseFloat(pkg.priceQuad) || 0;
  const originalPrice = Number.parseFloat(pkg.priceDouble) || 0;

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="overflow-hidden rounded-[2rem] border-2 border-neutral-100 bg-white shadow-2xl shadow-primary/15">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-primary-800 p-7 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-secondary/10 blur-2xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Harga Mulai Dari
            </div>
            <p className="font-display text-4xl font-black text-secondary sm:text-5xl">
              {formatCurrency(price)}
            </p>
            {originalPrice > price ? (
              <p className="mt-2 text-sm font-semibold text-white/60 line-through">
                {formatCurrency(originalPrice)}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Per jamaah (Quad). Konsultasikan konfigurasi kamar & seat
              sebelum booking.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 px-5 py-4 font-bold text-white shadow-lg shadow-green-500/30 transition hover:shadow-xl hover:shadow-green-500/40"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Konsultasi WhatsApp</span>
          </a>

          {pkg.itineraryPdf ? (
            <a
              href={pkg.itineraryPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary bg-secondary/10 px-5 py-4 font-bold text-primary transition hover:bg-secondary hover:text-primary"
            >
              <FileText className="h-5 w-5" />
              <span>Download Itinerary PDF</span>
            </a>
          ) : null}

          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
              `Assalamualaikum, saya ingin booking paket ${pkg.name}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-white px-5 py-4 font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            Booking Sekarang
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t-2 border-neutral-100 bg-neutral-50/60 p-5 sm:p-6">
          <div className="rounded-2xl border-2 border-white bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              <Users className="h-3.5 w-3.5 text-secondary" />
              Seat Tersisa
            </div>
            <p className="font-display text-2xl font-black text-primary">
              {seatsLeft}
            </p>
            {pkg.totalSeats ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full rounded-full ${
                    seatPercent <= 20
                      ? "bg-error"
                      : seatPercent <= 50
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{ width: `${seatPercent}%` }}
                />
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border-2 border-white bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              <CalendarDays className="h-3.5 w-3.5 text-secondary" />
              Berangkat
            </div>
            <p className="font-display text-base font-black leading-tight text-primary">
              {pkg.departureDate ? formatDate(pkg.departureDate) : "Menyusul"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-secondary/30 bg-secondary/10 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Resmi Kemenag RI
        </p>
        <p className="mt-1 font-display text-sm font-black text-primary">
          PPIU 12112100038690008
        </p>
      </div>
    </aside>
  );
}