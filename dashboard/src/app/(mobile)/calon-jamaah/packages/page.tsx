"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Package, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { getImageUrl } from "@/lib/utils";
import { packageSlug, prospectService, type PublicPackage } from "@/services/prospectService";

const money = (value: unknown) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "Tanggal menyusul";

export default function CalonJamaahPackagesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["prospect-public-packages"],
    queryFn: () => prospectService.getPublicPackages({ limit: 100 }),
    staleTime: 60_000,
  });

  const packages: PublicPackage[] = data?.data?.packages || [];
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return packages;
    return packages.filter((pkg) =>
      [pkg.name, pkg.code, pkg.type].some((value) =>
        String(value || "").toLowerCase().includes(needle),
      ),
    );
  }, [packages, search]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <header className="border-b bg-white px-4 py-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold text-gray-900">Pilih Paket Umrah</h1>
          <p className="mt-1 text-sm text-gray-500">
            Simpan paket dulu, konsultasi, atau daftar saat sudah cocok.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Cari nama paket, kode, atau tipe..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 md:px-8 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-sm md:col-span-2 lg:col-span-3">
            <CardContent className="p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-800">Paket tidak ditemukan</p>
              <p className="mt-1 text-sm text-gray-500">Coba ubah kata kunci pencarian.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((pkg) => {
            const primaryImage = pkg.images?.find((img) => img.isPrimary) || pkg.images?.[0];
            return (
              <Link key={pkg.id} href={`/calon-jamaah/packages/${packageSlug(pkg)}`}>
                <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-sm transition hover:shadow-md">
                  <div className="h-40 bg-gray-100">
                    {primaryImage?.imageUrl ? (
                      <img
                        src={getImageUrl(primaryImage.imageUrl)}
                        alt={pkg.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{pkg.type || "UMROH"}</Badge>
                      <span className="text-xs text-gray-500">{pkg.code || "-"}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 min-h-12 font-semibold text-gray-900">{pkg.name}</h2>
                    <div className="mt-3 grid gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> {date(pkg.departureDate)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {pkg.duration || "-"} hari
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> {pkg.remainingSeats ?? pkg.totalSeats ?? "-"} kursi
                      </span>
                    </div>
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs text-gray-500">Mulai dari</p>
                      <p className="text-lg font-bold text-[var(--color-primary)]">
                        {money(pkg.discountPrice || pkg.price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </main>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}
