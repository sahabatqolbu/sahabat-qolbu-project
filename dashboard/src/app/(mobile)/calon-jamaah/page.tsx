"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Heart, MessageCircle, Package, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useAuthStore } from "@/stores/authStore";
import {
  packageSlug,
  prospectService,
  type ProspectInterest,
  type PublicPackage,
} from "@/services/prospectService";

const money = (value: unknown) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(value),
      )
    : "Tanggal menyusul";

export default function CalonJamaahDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["prospect-summary"],
    queryFn: () => prospectService.getSummary(),
    staleTime: 30_000,
  });

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["prospect-public-packages", "dashboard"],
    queryFn: () => prospectService.getPublicPackages({ limit: 3 }),
    staleTime: 60_000,
  });

  const interests: ProspectInterest[] = summaryData?.data?.recentInterests || [];
  const packages: PublicPackage[] = packagesData?.data?.packages || [];

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="mt-4 h-28 rounded-2xl" />
        <Skeleton className="mt-4 h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] px-5 pb-16 pt-6 text-white md:px-8 md:pt-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">Assalamu'alaikum,</p>
              <h1 className="mt-1 text-2xl font-bold md:text-4xl">
                {user?.fullName || "Calon Jamaah"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/75 md:text-base">
                Pilih paket yang paling cocok, simpan minat, lalu ajukan pendaftaran
                saat sudah siap lanjut ke tahap jamaah.
              </p>
            </div>
            <Link href="/calon-jamaah/account">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <UserCircle className="h-6 w-6" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-10 max-w-7xl space-y-5 px-4 md:px-8">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <Link href="/calon-jamaah/packages">
              <Button className="h-12 w-full justify-between">
                Lihat Paket <Package className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calon-jamaah/interests">
              <Button variant="outline" className="h-12 w-full justify-between">
                Paket Diminati <Heart className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calon-jamaah/consultation">
              <Button variant="outline" className="h-12 w-full justify-between">
                Konsultasi <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Rekomendasi Paket</h2>
            <Link href="/calon-jamaah/packages" className="text-sm text-[var(--color-primary)]">
              Semua paket
            </Link>
          </div>

          {packagesLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          ) : packages.length === 0 ? (
            <EmptyCard title="Paket belum tersedia" description="Admin belum mempublikasikan paket." />
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {packages.map((pkg) => (
                <Link key={pkg.id} href={`/calon-jamaah/packages/${packageSlug(pkg)}`}>
                  <Card className="h-full rounded-2xl border-0 shadow-sm transition hover:shadow-md">
                    <CardContent className="p-4">
                      <Badge variant="secondary">{pkg.type || "UMROH"}</Badge>
                      <h3 className="mt-2 line-clamp-2 font-semibold text-gray-900">{pkg.name}</h3>
                      <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {date(pkg.departureDate)}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Mulai dari</p>
                          <p className="font-bold text-[var(--color-primary)]">
                            {money(pkg.discountPrice || pkg.price)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Aktivitas Terakhir</h2>
            <Link href="/calon-jamaah/interests" className="text-sm text-[var(--color-primary)]">
              Detail
            </Link>
          </div>
          {interests.length === 0 ? (
            <EmptyCard
              title="Belum ada paket diminati"
              description="Simpan paket atau mulai konsultasi agar admin bisa follow up lebih tepat."
            />
          ) : (
            <div className="space-y-3">
              {interests.slice(0, 3).map((interest) => (
                <Card key={interest.id} className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Badge variant="outline">{interest.actionType.replaceAll("_", " ")}</Badge>
                      <p className="mt-2 truncate font-medium text-gray-900">{interest.packageName}</p>
                      <p className="text-sm text-gray-500">{date(interest.departureDate)}</p>
                    </div>
                    <Link href={`/calon-jamaah/packages/${interest.packageId}`}>
                      <Button variant="ghost" size="sm">Lihat</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}

function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-6 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 font-medium text-gray-800">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
