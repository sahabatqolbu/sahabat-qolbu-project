// src/components/marketing/PackageDetail/PackageTabs.tsx
"use client";

import { useState } from "react";
import { Package } from "@/lib/mock-data";
import { Info, MapPin, Hotel, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pkg: Package;
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
    <div className="bg-white rounded-3xl border-4 border-neutral-100 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b-2 border-neutral-100 bg-neutral-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-4",
                activeTab === tab.id
                  ? "border-secondary text-primary bg-white"
                  : "border-transparent text-neutral-600"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 sm:p-8">
        {activeTab === "overview" && (
          <div>
            <h3 className="font-bold text-2xl text-primary mb-4">Deskripsi</h3>
            <p className="text-neutral-700">{pkg.description}</p>

            {pkg.included && (
              <div className="mt-6">
                <h4 className="font-bold text-xl text-primary mb-3">
                  Termasuk:
                </h4>
                <div className="space-y-2">
                  {pkg.included.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
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
            <h3 className="font-bold text-2xl text-primary mb-4">Itinerary</h3>
            {pkg.itinerary?.map((day) => (
              <div key={day.day} className="mb-4 p-4 bg-neutral-50 rounded-xl">
                <h4 className="font-bold text-lg text-primary mb-2">
                  Hari {day.day}: {day.title}
                </h4>
                <ul className="space-y-1">
                  {day.activities.map((activity, i) => (
                    <li key={i} className="text-sm text-neutral-700">
                      • {activity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === "hotels" && (
          <div>
            <h3 className="font-bold text-2xl text-primary mb-4">
              Hotel Makkah
            </h3>
            <p className="font-bold text-xl mb-2">{pkg.hotelMakkah.name}</p>
            <p className="text-sm text-neutral-600">
              ⭐ {pkg.hotelMakkah.starRating} Bintang
            </p>
          </div>
        )}

        {activeTab === "terms" && (
          <div>
            <h3 className="font-bold text-2xl text-primary mb-4">
              Syarat & Ketentuan
            </h3>
            {pkg.terms?.map((term, i) => (
              <p key={i} className="text-sm text-neutral-700 mb-2">
                • {term}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
