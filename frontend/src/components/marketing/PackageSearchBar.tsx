"use client";

import { CalendarDays, Clock3, MapPin, Plane, Search } from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";

export interface PackageFilters {
  destination: string;
  departureMonth: string;
  duration: string;
  airline: string;
}

interface PackageSearchBarProps {
  packages: MarketingPackage[];
  filters: PackageFilters;
  onChange: (filters: PackageFilters) => void;
  onSearch: () => void;
}

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const uniqueOptions = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "id"),
  );

export default function PackageSearchBar({
  packages,
  filters,
  onChange,
  onSearch,
}: PackageSearchBarProps) {
  const destinations = uniqueOptions(
    packages.map(
      (pkg) =>
        pkg.route?.arrivalCity ||
        pkg.route?.arrivalCode ||
        pkg.route?.code ||
        "",
    ),
  );
  const months = uniqueOptions(
    packages.map((pkg) => pkg.departureDate?.slice(0, 7) || ""),
  );
  const durations = Array.from(
    new Set(packages.map((pkg) => pkg.duration).filter((value) => value > 0)),
  ).sort((left, right) => left - right);
  const airlines = uniqueOptions(packages.map((pkg) => pkg.airline?.name || ""));

  const updateFilter = (key: keyof PackageFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const fields = [
    {
      key: "destination" as const,
      label: "Tujuan",
      icon: MapPin,
      value: filters.destination,
      placeholder: "Semua Tujuan",
      options: destinations.map((value) => ({ value, label: value })),
    },
    {
      key: "departureMonth" as const,
      label: "Tanggal Keberangkatan",
      mobileLabel: "Tgl. Keberangkatan",
      icon: CalendarDays,
      value: filters.departureMonth,
      placeholder: "Semua Bulan",
      options: months.map((value) => ({
        value,
        label: monthFormatter.format(new Date(`${value}-01T00:00:00Z`)),
      })),
    },
    {
      key: "duration" as const,
      label: "Durasi",
      icon: Clock3,
      value: filters.duration,
      placeholder: "Semua Durasi",
      options: durations.map((value) => ({
        value: String(value),
        label: `${value} Hari`,
      })),
    },
    {
      key: "airline" as const,
      label: "Maskapai",
      icon: Plane,
      value: filters.airline,
      placeholder: "Semua Maskapai",
      options: airlines.map((value) => ({ value, label: value })),
    },
  ];

  return (
    <form
      className="package-search-card mx-auto grid w-[calc(100%-2rem)] max-w-[1120px] grid-cols-2 gap-3 rounded-[18px] border border-primary/10 bg-[#fffefb] p-4 shadow-[0_22px_60px_rgba(7,26,51,0.15)] sm:p-5 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end xl:w-[72vw] 2xl:w-[65vw]"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
      aria-label="Cari paket umroh"
    >
      {fields.map((field) => {
        const Icon = field.icon;
        return (
          <label key={field.key} className="min-w-0">
            <span className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-primary sm:text-[11px]">
              <Icon className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="sm:hidden">
                {"mobileLabel" in field ? field.mobileLabel : field.label}
              </span>
              <span className="hidden truncate sm:inline">{field.label}</span>
            </span>
            <select
              value={field.value}
              onChange={(event) => updateFilter(field.key, event.target.value)}
              className="h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition hover:border-gold/70 focus:border-gold focus:ring-2 focus:ring-gold/15"
            >
              <option value="">{field.placeholder}</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}

      <button
        type="submit"
        className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-xs font-extrabold uppercase tracking-[0.08em] text-white shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 lg:col-span-1"
      >
        <Search className="h-4 w-4 text-gold" />
        Cari Paket
      </button>
    </form>
  );
}
