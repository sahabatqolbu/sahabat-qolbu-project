"use client";

import Link from "next/link";
import { Building2, Clock3, Plane } from "lucide-react";
import type { PackageFilters } from "@/components/marketing/PackageSearchBar";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  slugifyPackageName,
  type PublicPackageScheduleItem,
  type PublicPackageScheduleList,
} from "@/lib/public-api";

interface Props {
  lists: PublicPackageScheduleList[];
  filters: PackageFilters;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );

const formatMoney = (value: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

const entityHref = (kind: "hotel" | "maskapai", name: string, id?: number | null) =>
  id ? `/${kind}/${slugifyPackageName(name)}-${id}` : null;

function HotelLabel({ kind, item }: { kind: "makkah" | "madinah"; item: PublicPackageScheduleItem }) {
  const hotel = kind === "makkah" ? item.hotelMakkah : item.hotelMadinah;
  const label = kind === "makkah" ? item.hotelMakkahLabel : item.hotelMadinahLabel;
  const href = entityHref("hotel", hotel?.name || label, hotel?.id);
  return href ? (
    <Link href={href} className="font-semibold text-primary underline decoration-gold/60 underline-offset-4 hover:text-gold-dark">
      {label}
    </Link>
  ) : <span>{label}</span>;
}

function StatusAction({ item, listName, whatsapp }: { item: PublicPackageScheduleItem; listName: string; whatsapp: string }) {
  const soldOut = item.effectiveStatus === "SOLD_OUT";
  const closed = item.effectiveStatus === "CLOSED";
  if (closed) {
    return <span className="inline-flex h-9 items-center rounded-md bg-slate-200 px-3 text-xs font-extrabold uppercase text-slate-600">Paket Close</span>;
  }
  const message = encodeURIComponent(
    soldOut
      ? `Assalamualaikum, saya ingin masuk daftar tunggu ${listName} keberangkatan ${formatDate(item.departureDate)}.`
      : `Assalamualaikum, saya ingin cek sisa seat ${listName} keberangkatan ${formatDate(item.departureDate)} (${item.route}).`,
  );
  return (
    <a href={`https://wa.me/${whatsapp}?text=${message}`} target="_blank" rel="noopener noreferrer"
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-extrabold uppercase transition ${soldOut ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-primary text-white hover:bg-secondary"}`}>
      {soldOut ? "Daftar Tunggu" : "Cek Seat"}
    </a>
  );
}

export default function PackageScheduleLists({ lists, filters }: Props) {
  const branding = useBranding();
  const visibleLists = lists
    .map((list) => ({
      ...list,
      items: list.items.filter((item) =>
        (!filters.departureMonth || item.departureDate.startsWith(filters.departureMonth)) &&
        (!filters.duration || String(item.duration) === filters.duration) &&
        (!filters.airline || item.airline?.name === filters.airline)),
    }))
    .filter((list) => list.items.length > 0);

  if (!visibleLists.length) return null;
  return (
    <div className="mt-14 space-y-10">
      {visibleLists.map((list) => (
        <section key={list.id} className="overflow-hidden border border-primary/10 bg-white shadow-[0_18px_45px_rgba(7,26,51,0.08)]">
          <header className="bg-primary px-5 py-5 text-white sm:px-7">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">Jadwal Keberangkatan {list.month}</p>
                <h3 className="mt-1 text-2xl font-extrabold">{list.name}</h3>
              </div>
              {list.subtitle ? <p className="max-w-xl text-sm text-white/75">{list.subtitle}</p> : null}
            </div>
          </header>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-primary/10 bg-[#f8f6ef] text-[11px] uppercase tracking-wide text-primary">
                <tr>{["Tanggal", "Durasi", "Maskapai", "Rute", "Hotel Makkah", "Hotel Madinah", "Quad", "Triple", "Double", "Status"].map((head) => <th key={head} className="px-4 py-3 font-extrabold">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((item) => (
                  <tr key={item.id} className="align-top transition hover:bg-gold/[0.04]">
                    <td className="px-4 py-4 font-bold text-primary">{formatDate(item.departureDate)}{item.note ? <span className="mt-1 block max-w-[160px] text-[11px] font-semibold leading-4 text-gold-dark">{item.note}</span> : null}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{item.duration ? `${item.duration} Hari` : "Durasi menyusul"}</td>
                    <td className="px-4 py-4 font-semibold">{item.airline?.name || "-"}</td>
                    <td className="px-4 py-4 font-bold text-primary">{item.route}</td>
                    <td className="max-w-[190px] px-4 py-4"><HotelLabel kind="makkah" item={item} /></td>
                    <td className="max-w-[190px] px-4 py-4"><HotelLabel kind="madinah" item={item} /></td>
                    <td className="px-4 py-4 font-bold">{formatMoney(item.priceQuad)}</td>
                    <td className="px-4 py-4 font-bold">{formatMoney(item.priceTriple)}</td>
                    <td className="px-4 py-4 font-bold">{formatMoney(item.priceDouble)}</td>
                    <td className="px-4 py-4"><StatusAction item={item} listName={list.name} whatsapp={branding.whatsappNumber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-primary/10 lg:hidden">
            {list.items.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-extrabold text-primary">{formatDate(item.departureDate)}</p>{item.note ? <p className="mt-1 text-xs font-bold text-gold-dark">{item.note}</p> : null}</div>
                  <span className="rounded bg-primary/5 px-2.5 py-1 text-xs font-extrabold text-primary">{item.route}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" />{item.duration ? `${item.duration} Hari` : "Durasi menyusul"}</p>
                  <p className="flex items-center gap-2"><Plane className="h-4 w-4 text-gold" />{item.airline?.name || "-"}</p>
                  <p className="col-span-2 flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span><b>Makkah:</b> <HotelLabel kind="makkah" item={item} /></span></p>
                  <p className="col-span-2 flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span><b>Madinah:</b> <HotelLabel kind="madinah" item={item} /></span></p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center">
                  {[['Quad', item.priceQuad], ['Triple', item.priceTriple], ['Double', item.priceDouble]].map(([label, price]) => <div key={label}><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-extrabold text-primary">{formatMoney(price)}</p></div>)}
                </div>
                <div className="mt-4 flex justify-end"><StatusAction item={item} listName={list.name} whatsapp={branding.whatsappNumber} /></div>
              </article>
            ))}
          </div>
          {list.note ? <p className="border-t border-primary/10 bg-[#f8f6ef] px-5 py-3 text-xs leading-5 text-slate-500">* {list.note}</p> : null}
        </section>
      ))}
    </div>
  );
}
