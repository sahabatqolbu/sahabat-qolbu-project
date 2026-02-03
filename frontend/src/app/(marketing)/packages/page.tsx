// src/app/(marketing)/packages/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PackageCard from "@/components/marketing/PackageCard";
import PackageFilters from "@/components/marketing/PackageFilters";
import { mockPackages, filterPackages } from "@/lib/mock-data";
import {
  Search,
  SlidersHorizontal,
  X,
  Grid3x3,
  List,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Calendar,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type SortOption = "price-asc" | "price-desc" | "date" | "popular";

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  // Get filters from URL params
  const filters = {
    type: searchParams.get("type") || undefined,
    month: searchParams.get("month") || undefined,
    search: searchParams.get("search") || undefined,
  };

  // Filter packages
  const filteredPackages = useMemo(() => {
    let packages = filterPackages(filters);

    // Sort
    switch (sortBy) {
      case "price-asc":
        packages.sort((a, b) => parseInt(a.priceQuad) - parseInt(b.priceQuad));
        break;
      case "price-desc":
        packages.sort((a, b) => parseInt(b.priceQuad) - parseInt(a.priceQuad));
        break;
      case "date":
        packages.sort(
          (a, b) =>
            new Date(a.departureDate).getTime() -
            new Date(b.departureDate).getTime()
        );
        break;
      case "popular":
        packages.sort((a, b) => {
          const aPopularity = a.bookedSeats / a.totalSeats;
          const bPopularity = b.bookedSeats / b.totalSeats;
          return bPopularity - aPopularity;
        });
        break;
    }

    return packages;
  }, [filters, sortBy]);

  const hasActiveFilters = filters.type || filters.month || filters.search;

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/pattern-islamic.svg')] bg-repeat"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border-2 border-secondary/30 px-6 py-3 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-secondary" />
              <span className="text-secondary font-bold text-sm">
                {mockPackages.length} Paket Tersedia
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight">
              Paket Umroh
              <br />
              <span className="text-secondary">Terbaik untuk Anda</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium">
              Pilih paket umroh yang sesuai dengan kebutuhan dan budget Anda.
              Hotel bintang 5, dekat Masjidil Haram, harga terjangkau.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              {[
                { icon: Star, label: "Hotel Bintang 5", value: "Premium" },
                { icon: Calendar, label: "Keberangkatan", value: "Fleksibel" },
                {
                  icon: TrendingDown,
                  label: "Harga Mulai",
                  value: "18 Juta",
                },
                { icon: Sparkles, label: "Pelayanan", value: "Terbaik" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all"
                >
                  <stat.icon className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <div className="text-xs text-white/70 mb-1">{stat.label}</div>
                  <div className="font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg",
                showFilters
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-3 border-primary"
              )}
            >
              {showFilters ? (
                <>
                  <X className="w-5 h-5" />
                  <span>Tutup Filter</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Filter & Pencarian</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                  )}
                </>
              )}
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar Filters */}
            <aside
              className={cn(
                "lg:col-span-3",
                "transition-all duration-300",
                showFilters
                  ? "block fixed lg:relative inset-0 z-50 lg:z-auto bg-black/50 lg:bg-transparent p-4 lg:p-0"
                  : "hidden lg:block"
              )}
              onClick={(e) => {
                if (e.target === e.currentTarget && showFilters) {
                  setShowFilters(false);
                }
              }}
            >
              <div
                className={cn(
                  "bg-white rounded-3xl max-h-[90vh] lg:max-h-none overflow-y-auto",
                  showFilters &&
                    "animate-in slide-in-from-bottom lg:animate-none"
                )}
              >
                <PackageFilters onClose={() => setShowFilters(false)} />
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9">
              {/* Toolbar */}
              <div className="bg-white border-3 border-neutral-100 rounded-2xl p-4 md:p-6 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Results Count */}
                  <div>
                    <p className="text-neutral-600 font-semibold">
                      Menampilkan{" "}
                      <span className="text-primary font-black text-xl">
                        {filteredPackages.length}
                      </span>{" "}
                      dari{" "}
                      <span className="text-neutral-800 font-bold">
                        {mockPackages.length}
                      </span>{" "}
                      paket
                    </p>
                    {hasActiveFilters && (
                      <p className="text-xs text-secondary font-semibold mt-1">
                        Filter aktif diterapkan
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="hidden md:flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                          "p-2.5 rounded-lg transition-all",
                          viewMode === "grid"
                            ? "bg-white text-primary shadow-md"
                            : "text-neutral-500 hover:text-primary"
                        )}
                        aria-label="Grid View"
                      >
                        <Grid3x3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "p-2.5 rounded-lg transition-all",
                          viewMode === "list"
                            ? "bg-white text-primary shadow-md"
                            : "text-neutral-500 hover:text-primary"
                        )}
                        aria-label="List View"
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as SortOption)
                        }
                        className="appearance-none pl-4 pr-10 py-3 border-2 border-neutral-200 rounded-xl font-bold text-sm focus:border-secondary outline-none bg-white cursor-pointer hover:border-neutral-300 transition-colors"
                      >
                        <option value="popular">Terpopuler</option>
                        <option value="price-asc">Harga Terendah</option>
                        <option value="price-desc">Harga Tertinggi</option>
                        <option value="date">Tanggal Terdekat</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packages Grid/List */}
              {filteredPackages.length > 0 ? (
                <div
                  className={cn(
                    "grid gap-6 md:gap-8",
                    viewMode === "grid"
                      ? "sm:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {filteredPackages.map((pkg, index) => (
                    <div
                      key={pkg.id}
                      className="animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <PackageCard pkg={pkg} viewMode={viewMode} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState hasFilters={hasActiveFilters} />
              )}

              {/* Pagination (if needed) */}
              {filteredPackages.length > 12 && (
                <div className="mt-12 flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-white border-3 border-neutral-100 rounded-2xl p-2 shadow-lg">
                    <button className="px-4 py-2 rounded-xl font-bold text-neutral-400 hover:text-primary hover:bg-neutral-50 transition-colors">
                      Previous
                    </button>
                    {[1, 2, 3].map((page) => (
                      <button
                        key={page}
                        className={cn(
                          "w-10 h-10 rounded-xl font-bold transition-all",
                          page === 1
                            ? "bg-primary text-white shadow-md"
                            : "text-neutral-600 hover:bg-neutral-50"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button className="px-4 py-2 rounded-xl font-bold text-primary hover:bg-neutral-50 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary to-primary-700">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl mb-4">
              Tidak Menemukan Paket yang Cocok?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Hubungi tim kami untuk konsultasi dan custom paket sesuai
              kebutuhan Anda
            </p>
            <a
              href="https://wa.me/6282121453311?text=Assalamualaikum%2C%20saya%20ingin%20konsultasi%20paket%20umroh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-secondary hover:bg-secondary-600 text-primary font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:shadow-gold transition-all hover:scale-105"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Hubungi Kami via WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// Empty State Component
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Search className="w-12 h-12 text-neutral-400" />
      </div>
      <h3 className="font-display font-bold text-2xl md:text-3xl text-primary mb-3">
        {hasFilters ? "Paket Tidak Ditemukan" : "Belum Ada Paket"}
      </h3>
      <p className="text-neutral-600 text-lg mb-8 max-w-md mx-auto">
        {hasFilters
          ? "Coba ubah filter atau kata kunci pencarian Anda"
          : "Paket umroh akan segera tersedia"}
      </p>
      {hasFilters && (
        <button
          onClick={() => (window.location.href = "/packages")}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          <span>Reset Semua Filter</span>
        </button>
      )}
    </div>
  );
}
