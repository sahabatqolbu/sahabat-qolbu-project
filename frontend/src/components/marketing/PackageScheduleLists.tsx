"use client";

import Link from "next/link";
import { Clock3, MapPin, Plane } from "lucide-react";
import type { PackageFilters } from "@/components/marketing/PackageSearchBar";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  resolveAssetUrl,
  slugifyPackageName,
  type PublicPackageScheduleItem,
  type PublicPackageScheduleList,
} from "@/lib/public-api";

interface Props {
  lists: PublicPackageScheduleList[];
  filters: PackageFilters;
}

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const asDate = (value: string) => new Date(`${value}T00:00:00Z`);
const formatShortDate = (value: string) => shortDateFormatter.format(asDate(value));
const formatFullDate = (value: string) => fullDateFormatter.format(asDate(value));
const formatMonth = (value: string) => monthFormatter.format(new Date(`${value}-01T00:00:00Z`));

const formatCompactMoney = (value: string) => {
  const millions = Number(value) / 1_000_000;
  const amount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: Number.isInteger(millions) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(millions);
  return `Rp ${amount} JT`;
};

const entityHref = (name: string, id?: number | null) =>
  id ? `/hotel/${slugifyPackageName(name)}-${id}` : null;

function HotelLabel({ kind, item }: { kind: "makkah" | "madinah"; item: PublicPackageScheduleItem }) {
  const hotel = kind === "makkah" ? item.hotelMakkah : item.hotelMadinah;
  const label = kind === "makkah" ? item.hotelMakkahLabel : item.hotelMadinahLabel;
  const href = entityHref(hotel?.name || label, hotel?.id);

  return href ? (
    <Link href={href} className="font-medium text-slate-700 transition hover:text-gold-dark">
      {label}
    </Link>
  ) : (
    <span className="font-medium text-slate-700">{label}</span>
  );
}

function AirlineMark({ item }: { item: PublicPackageScheduleItem }) {
  const logo = resolveAssetUrl(item.airline?.logo);
  return (
    <div className="flex items-center justify-center gap-2 lg:flex-col lg:gap-1">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`Logo ${item.airline?.name || "maskapai"}`}
          className="h-7 w-10 object-contain"
        />
      ) : (
        <span className="flex h-7 min-w-9 items-center justify-center rounded border border-gold/40 bg-gold/10 px-1.5 text-[10px] font-black text-primary">
          {item.airline?.code || <Plane className="h-3.5 w-3.5" />}
        </span>
      )}
      <span className="max-w-20 text-center text-[10px] font-bold leading-tight text-slate-600">
        {item.airline?.name || "-"}
      </span>
    </div>
  );
}

function StatusAction({ item, listName, whatsapp }: { item: PublicPackageScheduleItem; listName: string; whatsapp: string }) {
  const soldOut = item.effectiveStatus === "SOLD_OUT";
  const closed = item.effectiveStatus === "CLOSED";

  if (closed) {
    return <span className="inline-flex h-7 items-center rounded-full bg-slate-200 px-2.5 text-[10px] font-extrabold uppercase text-slate-600">Paket Close</span>;
  }

  const message = encodeURIComponent(
    soldOut
      ? `Assalamualaikum, saya ingin masuk daftar tunggu ${listName} keberangkatan ${formatFullDate(item.departureDate)}.`
      : `Assalamualaikum, saya ingin cek sisa seat ${listName} keberangkatan ${formatFullDate(item.departureDate)} (${item.route}).`,
  );

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-extrabold uppercase tracking-wide transition ${soldOut ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-primary text-white hover:bg-secondary hover:text-primary"}`}
    >
      {soldOut ? "Daftar Tunggu" : "Cek Seat"}
    </a>
  );
}

function ProgramDetails({ item, listName }: { item: PublicPackageScheduleItem; listName: string }) {
  const programName = listName.replace(/^paket\s+/i, "");
  return (
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex rounded bg-gold px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary">
          {programName}{item.duration ? ` (${item.duration}D)` : ""}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{item.route}</span>
        {item.note ? <span className="text-[9px] font-bold text-gold-dark">{item.note}</span> : null}
      </div>
      <p className="text-[11px] leading-[1.35] text-slate-600">
        <span className="font-bold text-primary">Makkah:</span> <HotelLabel kind="makkah" item={item} />
      </p>
      <p className="text-[11px] leading-[1.35] text-slate-600">
        <span className="font-bold text-primary">Madinah:</span> <HotelLabel kind="madinah" item={item} />
      </p>
    </div>
  );
}

export default function PackageScheduleLists({ lists, filters }: Props) {
  const branding = useBranding();
  const visibleLists = lists
    .map((list) => ({
      ...list,
      items: list.items.filter(
        (item) =>
          (!filters.departureMonth || item.departureDate.startsWith(filters.departureMonth)) &&
          (!filters.duration || String(item.duration) === filters.duration) &&
          (!filters.airline || item.airline?.name === filters.airline),
      ),
    }))
    .filter((list) => list.items.length > 0);

  if (!visibleLists.length) return null;

  return (
    <div className="mt-12 space-y-7">
      {visibleLists.map((list) => (
        <section key={list.id} className="overflow-hidden rounded-lg border border-primary/15 bg-white shadow-[0_14px_36px_rgba(7,26,51,0.08)]">
          <header className="flex min-h-16 flex-col justify-center gap-1 border-b-2 border-gold bg-[#f8f6ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <span className="hidden h-9 w-1 rounded-full bg-gold sm:block" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gold-dark">Jadwal Keberangkatan · {formatMonth(list.month)}</p>
                <h3 className="text-lg font-black uppercase leading-tight text-primary">{list.name}</h3>
              </div>
            </div>
            {list.subtitle ? <p className="max-w-md text-[11px] leading-4 text-slate-500 sm:text-right">{list.subtitle}</p> : null}
          </header>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] table-fixed text-left">
              <colgroup>
                <col className="w-[9%]" /><col className="w-[11%]" /><col className="w-[36%]" />
                <col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[14%]" />
              </colgroup>
              <thead className="h-9 bg-primary text-[10px] uppercase tracking-[0.08em] text-white">
                <tr>
                  {["Tanggal", "Maskapai", "Program & Hotel", "Quad", "Triple", "Double", "Status"].map((head, index) => (
                    <th key={head} className={`px-2.5 py-2 font-extrabold ${index > 0 ? "border-l border-white/10" : ""} ${index >= 3 ? "text-center" : ""}`}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {list.items.map((item) => (
                  <tr key={item.id} className="h-[66px] align-middle transition hover:bg-gold/[0.045]">
                    <td className="px-2.5 py-2">
                      <p className="text-sm font-black leading-none text-primary">{formatShortDate(item.departureDate)}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500"><Clock3 className="h-3 w-3 text-gold-dark" />{item.duration ? `${item.duration} Hari` : "Menyusul"}</p>
                    </td>
                    <td className="border-l border-primary/10 px-2 py-1.5 text-center"><AirlineMark item={item} /></td>
                    <td className="border-l border-primary/10 px-2.5 py-1.5"><ProgramDetails item={item} listName={list.name} /></td>
                    {[item.priceQuad, item.priceTriple, item.priceDouble].map((price, index) => (
                      <td key={`${item.id}-price-${index}`} className="whitespace-nowrap border-l border-primary/10 px-2 py-2 text-center text-xs font-extrabold text-primary">{formatCompactMoney(price)}</td>
                    ))}
                    <td className="border-l border-primary/10 px-2 py-2 text-center"><StatusAction item={item} listName={list.name} whatsapp={branding.whatsappNumber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-primary/10 lg:hidden">
            {list.items.map((item) => (
              <article key={item.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black leading-none text-primary">{formatShortDate(item.departureDate)}<span className="ml-2 text-xs font-semibold text-slate-500">· {item.duration ? `${item.duration} Hari` : "Durasi menyusul"}</span></p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600"><AirlineMark item={item} /></div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-primary/5 px-2 py-1 text-[10px] font-extrabold text-primary"><MapPin className="h-3 w-3 text-gold-dark" /> {item.route}</span>
                </div>
                <div className="mt-3 rounded border border-gold/25 bg-gold/[0.06] p-2.5"><ProgramDetails item={item} listName={list.name} /></div>
                <div className="mt-3 grid grid-cols-3 divide-x divide-primary/10 border-y border-primary/10 py-2 text-center">
                  {[["Quad", item.priceQuad], ["Triple", item.priceTriple], ["Double", item.priceDouble]].map(([label, price]) => (
                    <div key={label} className="px-1"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 whitespace-nowrap text-[11px] font-black text-primary">{formatCompactMoney(price)}</p></div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end"><StatusAction item={item} listName={list.name} whatsapp={branding.whatsappNumber} /></div>
              </article>
            ))}
          </div>

          {list.note ? <p className="border-t border-primary/10 bg-[#f8f6ef] px-4 py-2 text-[10px] leading-4 text-slate-500">* {list.note}</p> : null}
        </section>
      ))}
    </div>
  );
}
