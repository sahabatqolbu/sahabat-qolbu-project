"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Bed,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hotel,
  Info,
  MapPin,
  Plane,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";
import { formatCurrency, formatDate } from "@/lib/utils";

type TabKey = "program" | "summary" | "hotels" | "facilities" | "terms";

type LandingPackageTabsProps = {
  pkg: MarketingPackage;
  descriptionItems: string[];
};

const tabs: {
  key: TabKey;
  label: string;
  helper: string;
  icon: typeof Info;
}[] = [
  {
    key: "program",
    label: "Deskripsi",
    helper: "Cerita paket",
    icon: ClipboardList,
  },
  { key: "summary", label: "Ringkasan", helper: "Info utama", icon: Info },
  { key: "hotels", label: "Hotel", helper: "Akomodasi", icon: Hotel },
  {
    key: "facilities",
    label: "Fasilitas",
    helper: "Termasuk paket",
    icon: CheckCircle2,
  },
  { key: "terms", label: "Syarat", helper: "Ketentuan", icon: ShieldCheck },
];

function Stars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < safeRating
              ? "fill-secondary text-secondary"
              : "fill-neutral-200 text-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 p-6 text-center text-sm font-semibold text-neutral-500">
      {children}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: typeof Info;
}) {
  return (
    <div className="group rounded-2xl border-2 border-neutral-100 bg-white p-5 transition hover:border-secondary hover:shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        {label}
      </div>
      <div className="text-base font-bold leading-relaxed text-primary">
        {value}
      </div>
    </div>
  );
}

function Checklist({
  items,
  emptyText,
  columns = 2,
}: {
  items?: string[];
  emptyText: string;
  columns?: 1 | 2;
}) {
  if (!items?.length) {
    return <EmptyState>{emptyText}</EmptyState>;
  }

  return (
    <div
      className={`grid gap-3 ${
        columns === 2 ? "sm:grid-cols-2" : ""
      }`}
    >
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border-2 border-neutral-100 bg-white p-4 transition hover:border-secondary"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium leading-relaxed text-neutral-700">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function HotelCard({
  title,
  city,
  name,
  starRating,
  distance,
  facilities,
}: {
  title: string;
  city: string;
  name: string;
  starRating: number;
  distance?: string;
  facilities?: string[];
}) {
  return (
    <article className="overflow-hidden rounded-3xl border-2 border-neutral-100 bg-white transition hover:border-secondary hover:shadow-xl">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-secondary shadow-lg shadow-primary/20">
          <Hotel className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            {title}
          </p>
          <h3 className="mt-1 font-display text-xl font-black text-primary">
            {name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={starRating} />
            <span className="text-xs font-semibold text-neutral-500">
              {starRating || "-"} Bintang
            </span>
          </div>
        </div>
      </div>
      {distance ? (
        <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl bg-secondary/15 px-4 py-2.5 text-sm font-bold text-primary">
          <MapPin className="h-4 w-4 text-secondary-600" />
          {distance}
        </div>
      ) : null}
      {facilities?.length ? (
        <div className="border-t-2 border-neutral-100 bg-neutral-50/60 px-5 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
            Fasilitas
          </p>
          <div className="flex flex-wrap gap-2">
            {facilities.map((facility) => (
              <span
                key={facility}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
              >
                {facility}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t-2 border-neutral-100 bg-neutral-50/60 px-5 py-4 text-sm font-medium text-neutral-500">
          Detail fasilitas hotel menyusul.
        </div>
      )}
      <div className="px-5 pb-5 text-xs text-neutral-400">
        <span className="font-bold text-neutral-500">{city}</span>
      </div>
    </article>
  );
}

export function LandingPackageTabs({
  pkg,
  descriptionItems,
}: LandingPackageTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("program");
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab) || tabs[0];
  const ActiveIcon = activeTabMeta.icon;

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-neutral-100 bg-white shadow-2xl shadow-primary/10">
      <div className="border-b-2 border-neutral-100 bg-gradient-to-r from-neutral-50 to-white p-3 sm:p-4">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Detail paket"
        >
          {tabs.map(({ key, label, helper, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(key)}
                className={`group flex min-w-[150px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? "bg-gradient-to-br from-primary to-primary-700 text-white shadow-lg shadow-primary/30"
                    : "bg-white text-neutral-600 hover:bg-secondary/10 hover:text-primary border-2 border-transparent hover:border-secondary/30"
                }`}
              >
                <span
                  className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-secondary text-primary"
                      : "bg-secondary/15 text-primary group-hover:bg-secondary group-hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{label}</span>
                  <span
                    className={`hidden text-xs sm:block ${
                      isActive ? "text-white/70" : "text-neutral-400"
                    }`}
                  >
                    {helper}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-secondary shadow-lg shadow-primary/20">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {activeTabMeta.helper}
            </p>
            <h2 className="font-display text-2xl font-black tracking-tight text-primary sm:text-3xl">
              {activeTabMeta.label}
            </h2>
          </div>
        </div>

        {activeTab === "program" ? (
          <article className="rounded-3xl border-2 border-neutral-100 bg-neutral-50/50 p-5 sm:p-7">
            {descriptionItems.length ? (
              <div className="space-y-4">
                {descriptionItems.map((item, index) => (
                  <p
                    key={`${item}-${index}`}
                    className="text-base font-medium leading-8 text-neutral-700"
                  >
                    {item}
                  </p>
                ))}
              </div>
            ) : (
              <EmptyState>
                Detail program akan diinformasikan oleh tim Sahabat Qolbu.
              </EmptyState>
            )}
          </article>
        ) : null}

        {activeTab === "summary" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryItem label="Kode Paket" value={pkg.code} />
            <SummaryItem
              label="Tanggal Keberangkatan"
              icon={CalendarDays}
              value={
                pkg.departureDate
                  ? formatDate(pkg.departureDate, "long")
                  : "Menyusul"
              }
            />
            <SummaryItem
              label="Tanggal Kepulangan"
              icon={CalendarDays}
              value={
                pkg.returnDate ? formatDate(pkg.returnDate, "long") : "Menyusul"
              }
            />
            <SummaryItem
              label="Maskapai"
              icon={Plane}
              value={pkg.airline.name}
            />
            <SummaryItem
              label="Durasi"
              icon={Bed}
              value={`${pkg.duration || "-"} Hari`}
            />
            <SummaryItem
              label="Tipe Paket"
              value={pkg.backendType || pkg.type}
            />
            <SummaryItem
              label="Harga Quad"
              value={formatCurrency(Number.parseFloat(pkg.priceQuad) || 0)}
            />
            <SummaryItem
              label="Harga Double"
              value={formatCurrency(Number.parseFloat(pkg.priceDouble) || 0)}
            />
          </div>
        ) : null}

        {activeTab === "hotels" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <HotelCard
              title="Hotel Makkah"
              city="Makkah Al-Mukarramah"
              name={pkg.hotelMakkah.name}
              starRating={pkg.hotelMakkah.starRating}
              distance={pkg.hotelMakkah.distanceToHaram}
              facilities={pkg.hotelMakkah.facilities}
            />
            {pkg.hotelMadinah ? (
              <HotelCard
                title="Hotel Madinah"
                city="Madinah Al-Munawwarah"
                name={pkg.hotelMadinah.name}
                starRating={pkg.hotelMadinah.starRating}
                distance={pkg.hotelMadinah.distanceToMasjid}
                facilities={pkg.hotelMadinah.facilities}
              />
            ) : (
              <EmptyState>Detail hotel Madinah menyusul.</EmptyState>
            )}
          </div>
        ) : null}

        {activeTab === "facilities" ? (
          <Checklist
            items={pkg.included}
            emptyText="Fasilitas paket belum tersedia di database."
          />
        ) : null}

        {activeTab === "terms" ? (
          <Checklist
            items={pkg.terms}
            emptyText="Syarat dan catatan belum tersedia di database."
            columns={1}
          />
        ) : null}
      </div>
    </section>
  );
}