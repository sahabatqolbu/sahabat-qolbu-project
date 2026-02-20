// src/components/marketing/PackageFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageFiltersProps {
  onClose?: () => void;
}

export default function PackageFilters({ onClose }: PackageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");

  const hasFilters = search || type || month;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (month) params.set("month", month);

    router.push(`/packages?${params.toString()}`);
    onClose?.();
  }, [month, onClose, router, search, type]);

  const clearFilters = () => {
    setSearch("");
    setType("");
    setMonth("");
    router.push("/packages");
    onClose?.();
  };

  // Auto-apply on mobile when user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.innerWidth < 1024) {
        // Mobile only
        applyFilters();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, applyFilters]);

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-6 border-4 border-neutral-100 lg:sticky lg:top-24 shadow-xl lg:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-primary">
              Filter Paket
            </h3>
            {hasFilters && (
              <p className="text-xs text-secondary font-semibold">
                {[search, type, month].filter(Boolean).length} filter aktif
              </p>
            )}
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-10 h-10 bg-neutral-100 hover:bg-error/10 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Tutup filter"
          >
            <X className="w-5 h-5 text-neutral-600 hover:text-error" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-bold text-primary mb-3">
            🔍 Pencarian
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari paket umroh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-secondary outline-none font-medium text-base placeholder:text-neutral-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-neutral-200 hover:bg-error/10 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600 hover:text-error" />
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-medium">
            Contoh: &quot;Ramadhan&quot;, &quot;Plus Turki&quot;, &quot;Hemat&quot;
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-bold text-primary mb-3">
            📦 Tipe Paket
          </label>
          <div className="space-y-2">
            {[
              { value: "", label: "Semua Tipe", icon: "🌟" },
              { value: "UMRAH", label: "Umroh Reguler", icon: "🕌" },
              { value: "UMRAH_RAMADHAN", label: "Umroh Ramadhan", icon: "🌙" },
              { value: "UMRAH_PLUS", label: "Umroh Plus", icon: "✈️" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setType(option.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all border-2",
                  type === option.value
                    ? "bg-secondary/10 border-secondary text-primary shadow-md"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="flex-1">{option.label}</span>
                {type === option.value && (
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Month */}
        <div>
          <label className="block text-sm font-bold text-primary mb-3">
            📅 Bulan Keberangkatan
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-secondary outline-none font-bold text-base appearance-none bg-white cursor-pointer hover:border-neutral-300 transition-colors"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="">Semua Bulan</option>
            {[
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
            ].map((m, i) => (
              <option key={i} value={String(i + 1)}>
                {m} 2024
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 space-y-3 border-t-2 border-neutral-100">
          <button
            onClick={applyFilters}
            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Filter className="w-5 h-5" />
            <span>Terapkan Filter</span>
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-full bg-white hover:bg-error/5 text-error font-bold py-4 rounded-xl transition-all border-2 border-error/20 hover:border-error flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-secondary/5 border-2 border-secondary/20 rounded-2xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary mb-1">
                💡 Tips Pencarian
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Gunakan kombinasi filter untuk hasil yang lebih spesifik.
                Hubungi kami jika butuh bantuan memilih paket.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
