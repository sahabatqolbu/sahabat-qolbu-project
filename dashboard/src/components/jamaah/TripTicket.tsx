import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronRight, Plane } from "lucide-react";

type TripTicketProps = {
  bookingNumber: string;
  pkg: {
    name: string;
    departureDate: string;
    returnDate?: string | null;
    airline?: { name: string } | null;
    hotelMakkah?: { name: string } | null;
    hotelMadinah?: { name: string } | null;
  } | null;
};

const day = (value?: string | null) => (value ? format(new Date(value), "d MMM yyyy", { locale: id }) : "-");

export default function TripTicket({ bookingNumber, pkg }: TripTicketProps) {
  const daysLeft = pkg?.departureDate ? differenceInCalendarDays(new Date(pkg.departureDate), new Date()) : null;
  const details = [
    ["Maskapai", pkg?.airline?.name],
    ["Hotel Makkah", pkg?.hotelMakkah?.name],
    ["Hotel Madinah", pkg?.hotelMadinah?.name],
  ].filter(([, value]) => value);

  return (
    <section aria-label="Tiket perjalanan" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 bg-[var(--color-secondary)]" />
      <div className="p-5">
        {pkg ? (
          <>
            <p className="text-xs text-gray-500">Paket umroh</p>
            <h2 className="mt-0.5 text-lg font-semibold leading-snug text-gray-900">{pkg.name}</h2>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-xs text-gray-500">Berangkat</p>
                <p className="font-semibold tabular-nums text-gray-900">{day(pkg.departureDate)}</p>
              </div>
              <div className="flex items-center gap-1 text-gray-300" aria-hidden="true">
                <span className="h-px w-6 bg-gray-300" />
                <Plane className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="h-px w-6 bg-gray-300" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Pulang</p>
                <p className="font-semibold tabular-nums text-gray-900">{day(pkg.returnDate)}</p>
              </div>
            </div>
            {details.length > 0 && (
              <dl className="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {details.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="truncate text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500">Paket umroh</p>
            <p className="mt-1 text-sm text-gray-700">Belum ada paket terdaftar. Hubungi admin atau agen Anda.</p>
          </>
        )}
      </div>

      {/* Perforated tear line with half-circle notches, like a ticket stub. */}
      <div className="relative" aria-hidden="true">
        <div className="mx-5 border-t border-dashed border-gray-300" />
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-gray-200 bg-gray-50" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-gray-200 bg-gray-50" />
      </div>

      <div className="flex items-end justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">No. booking</p>
          <p className="truncate font-mono text-base font-semibold tracking-wide text-gray-900">{bookingNumber}</p>
        </div>
        {daysLeft !== null && daysLeft > 0 ? (
          <div className="text-right">
            <p className="text-3xl font-semibold leading-none tabular-nums text-[var(--color-primary)]">H-{daysLeft}</p>
            <p className="mt-1 text-xs text-gray-500">menuju keberangkatan</p>
          </div>
        ) : pkg ? (
          <Link href="/jamaah/packages" className="inline-flex items-center text-sm font-medium text-[var(--color-primary)]">
            Detail paket <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
