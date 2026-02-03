// src/components/marketing/FeaturedPackages.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import PackageCard from "./PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { mockPackages } from "@/lib/mock-data"; // ✅ Import dari source tunggal

function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border-4 border-neutral-100">
      <Skeleton className="h-56 sm:h-64 w-full" />
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-4 space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedPackages() {
  // ✅ Use TanStack Query (bisa diganti dengan real API nanti)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["packages", "featured"],
    queryFn: async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockPackages; // ✅ Dari single source
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 bg-secondary/10 px-6 py-3 rounded-full mb-6 border-2 border-secondary/20">
            <Sparkles className="w-5 h-5 text-secondary" />
            <span className="text-primary font-bold text-sm">
              Paket Terpopuler
            </span>
          </div>

          <h2 className="heading-section mb-6">Paket Umroh Pilihan Terbaik</h2>

          <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
            Pilihan paket umroh dengan fasilitas premium, hotel bintang 5 dekat
            Masjidil Haram, dan harga terjangkau
          </p>
        </div>

        {/* Error State */}
        {isError && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-error" />
            </div>
            <h3 className="font-bold text-2xl text-primary mb-3">
              Gagal Memuat Paket
            </h3>
            <p className="text-neutral-600 mb-6">
              {error instanceof Error ? error.message : "Terjadi kesalahan"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, index) => (
              <PackageCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Success State */}
        {!isLoading && !isError && data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {data.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            {/* CTA to All Packages */}
            <div className="text-center">
              <Link
                href="/packages"
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary-600 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-3 border-primary-700"
              >
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Lihat Semua Paket Umroh</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
