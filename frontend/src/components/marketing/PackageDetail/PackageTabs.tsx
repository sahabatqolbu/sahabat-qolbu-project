// src/components/marketing/PackageDetail/PackageTabs.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, FileText, Hotel, Info, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingPackage } from "@/lib/public-api";
import { getItineraryPreviewUrl } from "@/lib/itinerary-url";

interface Props {
  pkg: MarketingPackage;
}

type TabType = "overview" | "itinerary" | "hotels" | "terms";

export default function PackageTabs({ pkg }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Info },
    { id: "itinerary" as TabType, label: "Itinerary", icon: MapPin },
    { id: "hotels" as TabType, label: "Hotel", icon: Hotel },
    { id: "terms" as TabType, label: "Syarat", icon: FileText },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border-4 border-neutral-100 bg-white">
      <div className="border-b-2 border-neutral-100 bg-neutral-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-4 px-6 py-4 text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "border-secondary bg-white text-primary"
                  : "border-transparent text-neutral-600",
              )}
              type="button"
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {activeTab === "overview" && (
          <div>
            <h3 className="mb-4 text-2xl font-bold text-primary">Deskripsi</h3>
            <p className="text-neutral-700">{pkg.description}</p>

            {pkg.included && pkg.included.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 text-xl font-bold text-primary">Termasuk:</h4>
                <div className="space-y-2">
                  {pkg.included.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "itinerary" && (
          <div>
            <h3 className="mb-4 text-2xl font-bold text-primary">Itinerary</h3>

            {pkg.itinerary && pkg.itinerary.length > 0 ? (
              pkg.itinerary.map((day) => (
                <div
                  key={`${day.day}-${day.title}`}
                  className="mb-4 rounded-xl bg-neutral-50 p-4"
                >
                  <h4 className="mb-2 text-lg font-bold text-primary">
                    Hari {day.day}: {day.title}
                  </h4>
                  <ul className="space-y-1">
                    {day.activities.map((activity, index) => (
                      <li key={`${day.day}-${index}`} className="text-sm text-neutral-700">
                        • {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : pkg.itineraryPdf ? (
              <div className="rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-5">
                <p className="mb-3 font-semibold text-primary">
                  Itinerary lengkap tersedia dalam dokumen PDF.
                </p>
                <Link
                  href={getItineraryPreviewUrl(pkg.slug)}
                  className="inline-flex items-center gap-2 font-bold text-secondary hover:text-secondary-600"
                >
                  <FileText className="h-5 w-5" />
                  <span>Lihat preview itinerary</span>
                </Link>
              </div>
            ) : (
              <p className="text-neutral-600">
                Itinerary paket belum dipublikasikan.
              </p>
            )}
          </div>
        )}

        {activeTab === "hotels" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-2xl font-bold text-primary">Hotel Makkah</h3>
              <p className="mb-2 text-xl font-bold">{pkg.hotelMakkah.name}</p>
              <p className="text-sm text-neutral-600">
                ⭐ {pkg.hotelMakkah.starRating} Bintang
              </p>
              {pkg.hotelMakkah.distanceToHaram && (
                <p className="mt-1 text-sm text-neutral-600">
                  {pkg.hotelMakkah.distanceToHaram}
                </p>
              )}
            </div>

            {pkg.hotelMadinah && (
              <div>
                <h3 className="mb-4 text-2xl font-bold text-primary">Hotel Madinah</h3>
                <p className="mb-2 text-xl font-bold">{pkg.hotelMadinah.name}</p>
                <p className="text-sm text-neutral-600">
                  ⭐ {pkg.hotelMadinah.starRating} Bintang
                </p>
                {pkg.hotelMadinah.distanceToMasjid && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {pkg.hotelMadinah.distanceToMasjid}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "terms" && (
          <div>
            <h3 className="mb-4 text-2xl font-bold text-primary">
              Syarat & Ketentuan
            </h3>
            {pkg.terms && pkg.terms.length > 0 ? (
              pkg.terms.map((term, index) => (
                <p key={`${term}-${index}`} className="mb-2 text-sm text-neutral-700">
                  • {term}
                </p>
              ))
            ) : (
              <p className="text-neutral-600">
                Syarat dan ketentuan paket belum dipublikasikan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
