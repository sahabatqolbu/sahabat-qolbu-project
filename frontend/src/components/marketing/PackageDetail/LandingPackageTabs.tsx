"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hotel,
  Info,
  Plane,
} from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";
import { formatDate } from "@/lib/utils";

type TabKey = "program" | "summary" | "hotels" | "facilities" | "notes";

type LandingPackageTabsProps = {
  pkg: MarketingPackage;
  descriptionItems: string[];
};

const tabs: { key: TabKey; label: string; helper: string; icon: typeof Info }[] = [
  {
    key: "program",
    label: "Program",
    helper: "Alur perjalanan",
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
  { key: "notes", label: "Catatan", helper: "Syarat paket", icon: CalendarDays },
];

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm font-semibold text-neutral-500">
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
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
        {Icon ? <Icon className="h-4 w-4 text-secondary" /> : null}
        {label}
      </div>
      <div className="text-base font-bold leading-relaxed text-primary">{value}</div>
    </div>
  );
}

function Checklist({
  items,
  emptyText,
}: {
  items?: string[];
  emptyText: string;
}) {
  if (!items?.length) {
    return <EmptyState>{emptyText}</EmptyState>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
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
    <article className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary">
          <Hotel className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
            {title}
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-primary">{name}</h3>
        </div>
      </div>
      {distance ? (
        <p className="mb-4 rounded-xl bg-secondary/20 px-3 py-2 text-sm font-bold text-primary">
          {distance}
        </p>
      ) : null}
      {facilities?.length ? (
        <div className="flex flex-wrap gap-2">
          {facilities.map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700"
            >
              {facility}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-neutral-500">
          Detail fasilitas hotel menyusul.
        </p>
      )}
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
    <section className="rounded-[1.75rem] border border-neutral-100 bg-neutral-50 p-3 shadow-xl shadow-primary/5">
      <div className="grid gap-2 rounded-[1.35rem] bg-white p-2 sm:grid-cols-5">
        {tabs.map(({ key, label, helper, icon: Icon }) => {
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-neutral-600 hover:bg-secondary/20 hover:text-primary"
              }`}
            >
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
                  isActive ? "bg-secondary text-primary" : "bg-neutral-50 text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">{label}</span>
                <span
                  className={`hidden text-xs sm:block ${
                    isActive ? "text-white/65" : "text-neutral-400"
                  }`}
                >
                  {helper}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
              Detail Paket
            </p>
            <h2 className="font-sans text-2xl font-black tracking-tight text-primary">
              {activeTabMeta.label}
            </h2>
          </div>
        </div>

        {activeTab === "program" ? (
          <div className="space-y-3">
            {descriptionItems.length ? (
              descriptionItems.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="grid gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:grid-cols-[44px_1fr]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-secondary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base font-medium leading-relaxed text-neutral-700">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState>
                Detail program akan diinformasikan oleh tim Sahabat Qolbu.
              </EmptyState>
            )}
          </div>
        ) : null}

        {activeTab === "summary" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryItem label="Kode Paket" value={pkg.code} />
            <SummaryItem
              label="Tanggal"
              icon={CalendarDays}
              value={
                <>
                  {pkg.departureDate
                    ? formatDate(pkg.departureDate, "long")
                    : "Menyusul"}
                  {pkg.returnDate ? ` - ${formatDate(pkg.returnDate, "long")}` : ""}
                </>
              }
            />
            <SummaryItem label="Maskapai" icon={Plane} value={pkg.airline.name} />
            <SummaryItem label="Tipe Paket" value={pkg.backendType || pkg.type} />
          </div>
        ) : null}

        {activeTab === "hotels" ? (
          <div className="grid gap-4 md:grid-cols-2">
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

        {activeTab === "notes" ? (
          <Checklist
            items={pkg.terms}
            emptyText="Syarat dan catatan belum tersedia di database."
          />
        ) : null}
      </div>
    </section>
  );
}
