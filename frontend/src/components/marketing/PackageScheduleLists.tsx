"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  MapPin,
  MessageCircle,
  Plane,
  Sparkles,
  Users,
} from "lucide-react";
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

// Extended item structure with parent list context
interface FlattenedScheduleItem extends PublicPackageScheduleItem {
  listName: string;
  listMonth: string;
  listSubtitle?: string | null;
  listNote?: string | null;
}

export default function PackageScheduleLists({ lists, filters }: Props) {
  const branding = useBranding();

  // 1. Extract all available months
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(lists.map((l) => l.month))).sort();
    return months;
  }, [lists]);

  // Level 1: Selected Month (defaults to first available or filter prop)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (filters.departureMonth && availableMonths.includes(filters.departureMonth)) {
      return filters.departureMonth;
    }
    return availableMonths[0] || "";
  });

  // Sync when filters prop changes
  useEffect(() => {
    const matchingMonth = lists.find((list) => list.items.some((item) =>
      (!filters.duration || String(item.duration) === filters.duration) &&
      (!filters.airline || item.airline?.name === filters.airline)
    ))?.month;
    const nextMonth = filters.departureMonth && availableMonths.includes(filters.departureMonth)
      ? filters.departureMonth
      : matchingMonth || availableMonths[0] || "";
    if (nextMonth) {
      setSelectedMonth(nextMonth);
      setSelectedPackage("ALL");
      setSelectedAirline("ALL");
      setExpandedId(null);
      setShowAll(false);
    }
  }, [filters.departureMonth, filters.duration, filters.airline, availableMonths, lists]);

  // Level 2: Selected Package Type for the active month ("ALL" or specific name)
  const [selectedPackage, setSelectedPackage] = useState<string>("ALL");

  // Filter & Sort state
  const [selectedAirline, setSelectedAirline] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date_asc" | "price_asc">("date_asc");

  // Accordion Expand state (one or none)
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Pagination / Limit state (default show 5)
  const [showAll, setShowAll] = useState<boolean>(false);
  const activeMonth = availableMonths.includes(selectedMonth) ? selectedMonth : availableMonths[0] || "";

  // When month changes, reset package tab & expanded state
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedPackage("ALL");
    setSelectedAirline("ALL");
    setExpandedId(null);
    setShowAll(false);
  };

  // Lists matching the selected month
  const currentMonthLists = useMemo(() => {
    return lists.filter((l) => l.month === activeMonth);
  }, [lists, activeMonth]);

  // Available package names in current month
  const availablePackagesInMonth = useMemo(() => {
    const names = Array.from(new Set(currentMonthLists.map((l) => l.name)));
    return names;
  }, [currentMonthLists]);

  // Available airlines in current month
  const availableAirlinesInMonth = useMemo(() => {
    const set = new Set<string>();
    currentMonthLists.forEach((l) => {
      l.items.forEach((it) => {
        if (it.airline?.name) set.add(it.airline.name);
      });
    });
    return Array.from(set).sort();
  }, [currentMonthLists]);

  // Flatten and filter items for active month & package
  const processedItems = useMemo(() => {
    let items: FlattenedScheduleItem[] = [];

    currentMonthLists.forEach((l) => {
      if (selectedPackage !== "ALL" && l.name !== selectedPackage) {
        return;
      }
      l.items.forEach((it) => {
        items.push({
          ...it,
          listName: l.name,
          listMonth: l.month,
          listSubtitle: l.subtitle,
          listNote: l.note,
        });
      });
    });

    // Apply airline filter
    if (selectedAirline !== "ALL") {
      items = items.filter((it) => it.airline?.name === selectedAirline);
    }

    // Apply external props filters
    if (filters.duration) {
      items = items.filter((it) => String(it.duration) === filters.duration);
    }
    if (filters.airline) {
      items = items.filter((it) => it.airline?.name === filters.airline);
    }

    // Sort items
    items.sort((a, b) => {
      if (sortBy === "price_asc") {
        return Number(a.priceQuad) - Number(b.priceQuad);
      }
      return a.departureDate.localeCompare(b.departureDate);
    });

    return items;
  }, [
    currentMonthLists,
    selectedPackage,
    selectedAirline,
    filters.duration,
    filters.airline,
    sortBy,
  ]);

  // Summary statistics for the active month
  const monthStats = useMemo(() => {
    let totalItems = 0;
    let minPrice = Infinity;
    currentMonthLists.forEach((l) => {
      l.items.forEach((it) => {
        totalItems++;
        const price = Number(it.priceQuad);
        if (price < minPrice) minPrice = price;
      });
    });
    return {
      totalSchedules: totalItems,
      totalPrograms: currentMonthLists.length,
      lowestPrice: minPrice !== Infinity ? formatCompactMoney(String(minPrice)) : null,
      subtitle: currentMonthLists.find((l) => l.subtitle)?.subtitle || null,
    };
  }, [currentMonthLists]);

  if (!lists.length) return null;

  // Visible items based on pagination limit
  const visibleItems = showAll ? processedItems : processedItems.slice(0, 5);
  const remainingCount = processedItems.length - 5;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mt-12 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 text-gold-dark" />
            Jadwal Resmi Keberangkatan
          </div>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-primary md:text-3xl">
            Jadwal Paket Umroh
          </h2>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            Pilih bulan dan program keberangkatan sesuai kebutuhan keluarga Anda.
          </p>
        </div>

        {/* LEVEL 1 NAVIGATION: TABS BULAN */}
        {availableMonths.length > 1 && (
          <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1.5 shadow-inner">
            {availableMonths.map((month) => {
              const isActive = month === activeMonth;
              const count = lists
                .filter((l) => l.month === month)
                .reduce((acc, curr) => acc + curr.items.length, 0);

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthChange(month)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:text-primary"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatMonth(month)}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive ? "bg-gold text-primary" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SUMMARY BANNER PER BULAN */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary via-[#0f385c] to-primary p-5 text-white shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold">
              Ringkasan Program Bulan {formatMonth(activeMonth)}
            </p>
            <h3 className="mt-0.5 text-xl font-black md:text-2xl">
              {formatMonth(activeMonth)}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="font-semibold text-white">{monthStats.totalSchedules} Keberangkatan</span>
              <span>•</span>
              <span>{monthStats.totalPrograms} Jenis Program</span>
              {monthStats.lowestPrice && (
                <>
                  <span>•</span>
                  <span>Mulai <strong className="text-gold">{monthStats.lowestPrice}</strong></span>
                </>
              )}
            </p>
          </div>

          {monthStats.subtitle && (
            <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200 backdrop-blur-sm">
              <p className="font-medium">✨ {monthStats.subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 2 NAVIGATION: TABS JENIS PAKET & QUICK FILTER */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
        {/* TABS PROGRAM PAKET */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedPackage("ALL");
              setSelectedAirline("ALL");
              setShowAll(false);
              setExpandedId(null);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
              selectedPackage === "ALL"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Program ({currentMonthLists.reduce((acc, curr) => acc + curr.items.length, 0)})
          </button>

          {availablePackagesInMonth.map((pkgName) => {
            const isActive = selectedPackage === pkgName;
            const count = currentMonthLists
              .filter((l) => l.name === pkgName)
              .reduce((acc, curr) => acc + curr.items.length, 0);
            const cleanName = pkgName.replace(/^paket\s+/i, "");

            return (
              <button
                key={pkgName}
                type="button"
                onClick={() => {
                  setSelectedPackage(pkgName);
                  setSelectedAirline("ALL");
                  setShowAll(false);
                  setExpandedId(null);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cleanName} ({count})
              </button>
            );
          })}
        </div>

        {/* QUICK FILTERS & SORTER */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FILTER MASKAPAI */}
          {availableAirlinesInMonth.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedAirline}
                onChange={(e) => {
                  setSelectedAirline(e.target.value);
                  setExpandedId(null);
                  setShowAll(false);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="ALL">Semua Maskapai</option>
                {availableAirlinesInMonth.map((airline) => (
                  <option key={airline} value={airline}>
                    {airline}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* URUTKAN */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date_asc" | "price_asc")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="date_asc">Tanggal Terdekat</option>
            <option value="price_asc">Harga Termurah</option>
          </select>
        </div>
      </div>

      {/* COMPACT LIST ROWS */}
      {processedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Tidak ada jadwal yang sesuai dengan filter yang dipilih. Silakan reset filter maskapai atau pilih program lain.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const programName = item.listName.replace(/^paket\s+/i, "");
            const logo = resolveAssetUrl(item.airline?.logo);
            const isKhalid = item.note?.toLowerCase().includes("khalid basalamah");
            const isPelataran = item.listName.toLowerCase().includes("pelataran");
            const isClosed = item.effectiveStatus === "CLOSED";
            const isSoldOut = item.effectiveStatus === "SOLD_OUT";

            const waMessage = encodeURIComponent(
              isSoldOut
                ? `Assalamualaikum, saya ingin masuk daftar tunggu ${item.listName} keberangkatan ${formatFullDate(item.departureDate)}.`
                : `Assalamualaikum, saya tertarik konsultasi paket ${item.listName} keberangkatan ${formatFullDate(item.departureDate)} (${item.route}) pilihan tipe kamar Quad/Triple/Double. Mohon info ketersediaan sisa seat.`
            );
            const waUrl = `https://wa.me/${branding.whatsappNumber}?text=${waMessage}`;

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border transition-all duration-200 ${
                  isExpanded
                    ? "border-primary/40 bg-white shadow-md ring-1 ring-primary/10"
                    : "border-slate-200/90 bg-white hover:border-gold/60 hover:shadow-sm"
                }`}
              >
                {/* COMPACT MAIN ROW */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* KIRI: TANGGAL & DURASI */}
                  <div className="flex items-center gap-3.5 sm:w-36 sm:shrink-0">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 font-black text-primary group-hover:border-gold/30">
                      <span className="text-base leading-none">
                        {formatShortDate(item.departureDate).split(" ")[0]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                        {formatShortDate(item.departureDate).split(" ")[1]}
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black text-primary">
                        <Clock3 className="h-3 w-3 text-gold-dark" />
                        {item.duration ? `${item.duration} Hari` : "Durasi menyusul"}
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {asDate(item.departureDate).getUTCFullYear()}
                      </p>
                    </div>
                  </div>

                  {/* TENGAH: NAMA PAKET, AIRLINE, HOTEL SINGKAT */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* BARIS ATAS: PROGRAM, AIRLINE, ROUTE & SPECIAL BADGE */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        {programName}
                      </span>

                      {/* AIRLINE LOGO / CODE */}
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logo}
                            alt={item.airline?.name || "Maskapai"}
                            className="h-4 w-6 object-contain"
                          />
                        ) : (
                          <Plane className="h-3.5 w-3.5 text-gold-dark" />
                        )}
                        <span>{item.airline?.name || item.airline?.code}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {item.route}
                      </span>

                      {/* SPECIAL BADGES */}
                      {isKhalid && (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          ⭐ Ustadz Khalid Basalamah
                        </span>
                      )}
                      {isPelataran && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          🕌 Dekat Pelataran
                        </span>
                      )}
                    </div>

                    {/* BARIS BAWAH: HOTEL SINGKAT */}
                    <p className="truncate text-xs font-medium text-slate-500">
                      <span className="font-semibold text-slate-700">Makkah:</span>{" "}
                      {item.hotelMakkahLabel.split("/")[0].trim()}
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-semibold text-slate-700">Madinah:</span>{" "}
                      {item.hotelMadinahLabel.split("/")[0].trim()}
                    </p>
                  </div>

                  {/* KANAN: HARGA MULAI & TOMBOL LIHAT DETAIL */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0 sm:shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Mulai Dari
                      </p>
                      <p className="text-base font-black text-primary md:text-lg">
                        {formatCompactMoney(item.priceQuad)}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400">/pax (Quad)</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                        isExpanded
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{isExpanded ? "Tutup" : "Detail"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE DETAIL DRAWER (ACCORDION) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-[#faf9f5] p-4 sm:p-5">
                    {/* 3 PILIHAN HARGA KAMAR */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Pilihan Tipe Kamar & Harga Per Orang:
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {/* QUAD */}
                        <div className="relative rounded-xl border border-primary/20 bg-white p-3 shadow-xs">
                          <span className="absolute right-2 top-2 rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-black text-primary">
                            Termurah
                          </span>
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Quad (Kamar Ber-4)</span>
                          </div>
                          <p className="mt-1 text-lg font-black text-primary">
                            {formatCompactMoney(item.priceQuad)}
                          </p>
                        </div>

                        {/* TRIPLE */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Triple (Kamar Ber-3)</span>
                          </div>
                          <p className="mt-1 text-lg font-black text-primary">
                            {formatCompactMoney(item.priceTriple)}
                          </p>
                        </div>

                        {/* DOUBLE */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Double (Kamar Ber-2)</span>
                          </div>
                          <p className="mt-1 text-lg font-black text-primary">
                            {formatCompactMoney(item.priceDouble)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DETAIL HOTEL LENGKAP & RUTE */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* HOTEL MAKKAH */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Building2 className="h-4 w-4 text-gold-dark" />
                          <span>Hotel Makkah:</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {entityHref(item.hotelMakkah?.name || item.hotelMakkahLabel, item.hotelMakkah?.id) ? (
                            <Link
                              href={entityHref(item.hotelMakkah?.name || item.hotelMakkahLabel, item.hotelMakkah?.id)!}
                              className="font-bold text-primary hover:text-gold-dark hover:underline"
                            >
                              {item.hotelMakkahLabel}
                            </Link>
                          ) : (
                            item.hotelMakkahLabel
                          )}
                        </p>
                      </div>

                      {/* HOTEL MADINAH */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Building2 className="h-4 w-4 text-gold-dark" />
                          <span>Hotel Madinah:</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-700">
                          {entityHref(item.hotelMadinah?.name || item.hotelMadinahLabel, item.hotelMadinah?.id) ? (
                            <Link
                              href={entityHref(item.hotelMadinah?.name || item.hotelMadinahLabel, item.hotelMadinah?.id)!}
                              className="font-bold text-primary hover:text-gold-dark hover:underline"
                            >
                              {item.hotelMadinahLabel}
                            </Link>
                          ) : (
                            item.hotelMadinahLabel
                          )}
                        </p>
                      </div>
                    </div>

                    {/* INFORMASI TAMBAHAN / CATATAN */}
                    {item.note && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs font-semibold text-amber-900">
                        📌 <strong>Catatan:</strong> {item.note}
                      </div>
                    )}
                    {item.listNote && (
                      <p className="mt-3 break-words text-xs leading-relaxed text-slate-600">{item.listNote}</p>
                    )}

                    {/* CTA ACTION */}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/60 pt-3">
                      <p className="text-[11px] text-slate-500">
                        * Harga & ketersediaan seat dapat berubah. Konfirmasi program sebelum pembayaran.
                      </p>

                      {isClosed ? (
                        <span className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-200 px-5 text-xs font-extrabold uppercase text-slate-600">
                          Program Closed
                        </span>
                      ) : (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#1EBE5D] hover:shadow-md"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{isSoldOut ? "Masuk Daftar Tunggu via WA" : "Konsultasi & Cek Sisa Seat"}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION / SHOW MORE BUTTON */}
      {processedItems.length > 5 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-6 py-2.5 text-xs font-extrabold text-primary shadow-xs transition hover:border-primary hover:bg-slate-50"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Tampilkan Lebih Sedikit</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Lihat Semua {processedItems.length} Jadwal ({remainingCount} lagi)</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
