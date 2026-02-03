"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Package, ArrowRight } from "lucide-react";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const packageTypes = [
  { value: "all", label: "Semua Paket" },
  { value: "regular", label: "Umroh Reguler" },
  { value: "ramadhan", label: "Umroh Ramadhan" },
  { value: "plus", label: "Umroh Plus" },
];

export default function SearchWidget() {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [packageType, setPackageType] = useState("all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (packageType !== "all") params.append("type", packageType);
    router.push(`/packages?${params.toString()}`);
  };

  return (
    <div className="relative -mt-24 z-20 mb-20">
      <div className="container-custom">
        <div className="max-w-6xl mx-auto">
          {/* Main Search Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-secondary/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-700 px-6 md:px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
                    Cari Paket Umroh
                  </h2>
                  <p className="text-white/80 font-medium text-sm md:text-base">
                    Temukan paket terbaik sesuai kebutuhan Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Search Form */}
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Bulan Keberangkatan */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Calendar className="w-5 h-5 text-secondary" />
                    Bulan Keberangkatan
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-5 py-4 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                  >
                    <option value="">Pilih Bulan</option>
                    {months.map((m, index) => (
                      <option key={m} value={index + 1}>
                        {m} 2024
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipe Paket */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Package className="w-5 h-5 text-secondary" />
                    Tipe Paket
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full px-5 py-4 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                  >
                    {packageTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <div className="space-y-3">
                  <label className="block text-transparent text-sm">
                    Action
                  </label>
                  <button
                    onClick={handleSearch}
                    className="w-full bg-secondary hover:bg-secondary-600 text-primary font-black text-base px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 border-3 border-secondary-700"
                  >
                    <Search className="w-5 h-5" />
                    <span>Cari Paket</span>
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="pt-6 border-t-2 border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-primary font-bold text-sm">
                    Pencarian Populer
                  </p>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Umroh Ramadhan 2024",
                    "Umroh Plus Turki",
                    "Umroh Hemat",
                    "Umroh Desember",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => router.push("/packages")}
                      className="px-5 py-2.5 bg-primary/5 hover:bg-secondary/10 text-primary hover:text-secondary font-semibold text-sm rounded-xl border-2 border-primary/10 hover:border-secondary/30 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
