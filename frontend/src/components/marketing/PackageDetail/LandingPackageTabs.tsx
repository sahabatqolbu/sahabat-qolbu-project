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

const tabs: { key: TabKey; label: string; icon: typeof Info }[] = [
  { key: "program", label: "Program", icon: ClipboardList },
  { key: "summary", label: "Ringkasan", icon: Info },
  { key: "hotels", label: "Hotel", icon: Hotel },
  { key: "facilities", label: "Fasilitas", icon: CheckCircle2 },
  { key: "notes", label: "Catatan", icon: CalendarDays },
];

function InfoBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: typeof Info;
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary/45">
        {Icon ? <Icon className="h-4 w-4 text-secondary" /> : null}
        {label}
      </div>
      <div className="text-base font-extrabold leading-relaxed text-primary">
        {value}
      </div>
    </div>
  );
}

function ItemList({
  items,
  emptyText,
}: {
  items?: string[];
  emptyText: string;
}) {
  if (!items?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-primary/15 bg-white p-5 text-sm font-semibold text-primary/55">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-500" />
          <span className="text-sm font-semibold leading-relaxed text-primary/75">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

function HotelPanel({
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
    <div className="rounded-[1.6rem] border border-primary/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-secondary">
          <Hotel className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">
            {title}
          </p>
          <h3 className="mt-1 text-lg font-black text-primary">{name}</h3>
        </div>
      </div>
      {distance ? (
        <p className="mb-4 rounded-xl bg-secondary/15 px-3 py-2 text-sm font-bold text-primary">
          {distance}
        </p>
      ) : null}
      {facilities?.length ? (
        <div className="flex flex-wrap gap-2">
          {facilities.map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary/70"
            >
              {facility}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold text-primary/50">
          Detail fasilitas hotel menyusul.
        </p>
      )}
    </div>
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
    <section className="overflow-hidden rounded-[2rem] border border-primary/10 bg-[#F7F2E8] shadow-sm">
      <div className="border-b border-primary/10 bg-primary px-3 py-3 sm:px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`inline-flex flex-none items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  isActive
                    ? "bg-secondary text-primary shadow-lg shadow-black/15"
                    : "bg-white/8 text-white/75 hover:bg-white/15 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-secondary">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/45">
              Detail Paket
            </p>
            <h2 className="text-2xl font-black tracking-tight text-primary">
              {activeTabMeta.label}
            </h2>
          </div>
        </div>

        {activeTab === "program" ? (
          <div className="space-y-3">
            {descriptionItems.length ? (
              descriptionItems.map((item, index) => (
                <p
                  key={`${item}-${index}`}
                  className="rounded-2xl bg-white p-4 text-base font-semibold leading-relaxed text-primary/75 shadow-sm"
                >
                  {item}
                </p>
              ))
            ) : (
              <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-primary/55">
                Detail program akan diinformasikan oleh tim Sahabat Qolbu.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "summary" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBox label="Kode Paket" value={pkg.code} />
            <InfoBox
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
            <InfoBox label="Maskapai" icon={Plane} value={pkg.airline.name} />
            <InfoBox label="Tipe" value={pkg.backendType || pkg.type} />
          </div>
        ) : null}

        {activeTab === "hotels" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <HotelPanel
              title="Hotel Makkah"
              name={pkg.hotelMakkah.name}
              distance={pkg.hotelMakkah.distanceToHaram}
              facilities={pkg.hotelMakkah.facilities}
            />
            {pkg.hotelMadinah ? (
              <HotelPanel
                title="Hotel Madinah"
                name={pkg.hotelMadinah.name}
                distance={pkg.hotelMadinah.distanceToMasjid}
                facilities={pkg.hotelMadinah.facilities}
              />
            ) : (
              <p className="rounded-[1.6rem] border border-dashed border-primary/15 bg-white p-5 text-sm font-semibold text-primary/55">
                Detail hotel Madinah menyusul.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "facilities" ? (
          <ItemList
            items={pkg.included}
            emptyText="Fasilitas paket belum tersedia di database."
          />
        ) : null}

        {activeTab === "notes" ? (
          <ItemList
            items={pkg.terms}
            emptyText="Syarat dan catatan belum tersedia di database."
          />
        ) : null}
      </div>
    </section>
  );
}
