// src/components/marketing/FeaturedPackages.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PackageCard from "./PackageCard";
import { getFeaturedMarketingPackages } from "@/lib/public-api";

function PackageCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-neutral-100 bg-white">
      <Skeleton className="h-56 w-full sm:h-64" />
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedPackages() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-packages", "featured"],
    queryFn: () => getFeaturedMarketingPackages(3),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="bg-gradient-to-b from-white to-neutral-50 py-20 md:py-28">
      <div className="container-custom">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border-2 border-secondary/20 bg-secondary/10 px-6 py-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <span className="text-sm font-bold text-primary">Paket Terpopuler</span>
          </div>

          <h2 className="heading-section mb-6">Paket Umroh Pilihan Terbaik</h2>

          <p className="mx-auto max-w-2xl text-body-large text-neutral-600">
            Pilihan paket umroh dengan fasilitas premium, hotel terbaik, dan
            jadwal keberangkatan yang bisa Anda pilih langsung dari data publik
            terbaru.
          </p>
        </div>

        {isError && (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-error/10">
              <AlertCircle className="h-10 w-10 text-error" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-primary">
              Gagal Memuat Paket
            </h3>
            <p className="mb-6 text-neutral-600">
              {error instanceof Error ? error.message : "Terjadi kesalahan"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              type="button"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <PackageCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <>
            <div className="mb-12 grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {data.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/packages"
                className="inline-flex items-center gap-3 rounded-2xl border-3 border-primary-700 bg-primary px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-primary-600 hover:shadow-2xl sm:px-10 sm:py-5 sm:text-lg"
              >
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Lihat Semua Paket Umroh</span>
              </Link>
            </div>
          </>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="rounded-3xl border-4 border-neutral-100 bg-white px-6 py-12 text-center shadow-lg">
            <h3 className="mb-3 text-2xl font-bold text-primary">
              Belum Ada Paket Publik
            </h3>
            <p className="mx-auto max-w-2xl text-neutral-600">
              Paket yang aktif dan dipublikasikan akan tampil di sini setelah
              tersedia dari backend publik.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
