"use client";

import { CalendarDays, Clock3, Plane, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketingPackage } from "@/lib/public-api";

export interface PackageFilters {
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

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  key: keyof PackageFilters;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  value: string;
  placeholder: string;
  options: FilterOption[];
}

const ALL_VALUE = "all";

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const uniqueOptions = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "id"),
  );

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const matchesOtherFilters = (
  pkg: MarketingPackage,
  filters: PackageFilters,
  ignoredFilter: keyof PackageFilters,
) =>
  (ignoredFilter === "departureMonth" ||
    !filters.departureMonth ||
    pkg.departureDate?.startsWith(filters.departureMonth)) &&
  (ignoredFilter === "duration" ||
    !filters.duration ||
    String(pkg.duration) === filters.duration) &&
  (ignoredFilter === "airline" ||
    !filters.airline ||
    pkg.airline?.name === filters.airline);

export default function PackageSearchBar({
  packages,
  filters,
  onChange,
  onSearch,
}: PackageSearchBarProps) {
  const currentMonth = getCurrentMonth();
  const upcomingPackages = packages.filter(
    (pkg) =>
      Boolean(pkg.departureDate) && pkg.departureDate.slice(0, 7) >= currentMonth,
  );

  const monthCandidates = upcomingPackages.filter((pkg) =>
    matchesOtherFilters(pkg, filters, "departureMonth"),
  );
  const durationCandidates = upcomingPackages.filter((pkg) =>
    matchesOtherFilters(pkg, filters, "duration"),
  );
  const airlineCandidates = upcomingPackages.filter((pkg) =>
    matchesOtherFilters(pkg, filters, "airline"),
  );

  const months = uniqueOptions(
    monthCandidates.map((pkg) => pkg.departureDate.slice(0, 7)),
  );
  const durations = Array.from(
    new Set(
      durationCandidates
        .map((pkg) => pkg.duration)
        .filter((value) => value > 0),
    ),
  ).sort((left, right) => left - right);
  const airlines = uniqueOptions(
    airlineCandidates.map((pkg) => pkg.airline?.name || ""),
  );

  const updateFilter = (key: keyof PackageFilters, value: string) => {
    onChange({ ...filters, [key]: value === ALL_VALUE ? "" : value });
  };

  const fields: FilterField[] = [
    {
      key: "departureMonth",
      label: "Tanggal Keberangkatan",
      mobileLabel: "Bulan Keberangkatan",
      icon: CalendarDays,
      value: filters.departureMonth,
      placeholder: "Semua Bulan",
      options: months.map((value) => ({
        value,
        label: monthFormatter.format(new Date(`${value}-01T00:00:00Z`)),
      })),
    },
    {
      key: "duration",
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
      key: "airline",
      label: "Maskapai",
      icon: Plane,
      value: filters.airline,
      placeholder: "Semua Maskapai",
      options: airlines.map((value) => ({ value, label: value })),
    },
  ];

  return (
    <form
      className="package-search-card mx-auto grid w-[calc(100%-2rem)] max-w-[1000px] grid-cols-1 gap-3 rounded-[18px] border border-primary/10 bg-[#fffefb] p-4 shadow-[0_22px_60px_rgba(7,26,51,0.15)] sm:grid-cols-3 sm:p-5 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end xl:w-[68vw] 2xl:w-[62vw]"
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
                {field.mobileLabel || field.label}
              </span>
              <span className="hidden truncate sm:inline">{field.label}</span>
            </span>
            <Select
              value={field.value || ALL_VALUE}
              onValueChange={(value) => updateFilter(field.key, value)}
            >
              <SelectTrigger
                className="h-12 w-full rounded-lg border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-none outline-none transition hover:border-gold/70 focus:border-gold focus:ring-2 focus:ring-gold/15"
                aria-label={field.label}
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                sideOffset={8}
                className="z-[260] min-w-[var(--radix-select-trigger-width)] rounded-xl border border-primary/10 bg-[#fffefb] p-1.5 text-gray-700 shadow-[0_18px_50px_rgba(7,26,51,0.18)]"
              >
                <SelectItem
                  value={ALL_VALUE}
                  className="rounded-lg px-3 py-2.5 font-semibold focus:bg-primary focus:text-white data-[state=checked]:bg-primary/5 data-[state=checked]:text-primary"
                >
                  {field.placeholder}
                </SelectItem>
                {field.options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="rounded-lg px-3 py-2.5 font-semibold focus:bg-primary focus:text-white data-[state=checked]:bg-primary/5 data-[state=checked]:text-primary"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        );
      })}

      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-xs font-extrabold uppercase tracking-[0.08em] text-white shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 sm:col-span-3 lg:col-span-1"
      >
        <Search className="h-4 w-4 text-gold" />
        Cari Paket
      </button>
    </form>
  );
}
