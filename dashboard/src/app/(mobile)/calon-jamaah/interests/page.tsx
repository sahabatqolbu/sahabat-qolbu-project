"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Heart, MessageCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { prospectService, type ProspectInterest } from "@/services/prospectService";

const actionLabel: Record<string, string> = {
  SAVED: "Disimpan",
  WHATSAPP_CONSULT: "Konsultasi",
  CONVERT_REQUEST: "Daftar Jamaah",
};

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "Tanggal menyusul";

export default function CalonJamaahInterestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["prospect-interests"],
    queryFn: () => prospectService.getInterests(),
    staleTime: 30_000,
  });

  const interests: ProspectInterest[] = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <header className="border-b bg-white px-4 py-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-bold text-gray-900">Paket Diminati</h1>
          <p className="mt-1 text-sm text-gray-500">
            Riwayat paket yang Anda simpan, konsultasikan, atau ajukan.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-3 px-4 py-5 md:px-8">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        ) : interests.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-10 text-center">
              <Heart className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-800">Belum ada paket diminati</p>
              <p className="mt-1 text-sm text-gray-500">
                Buka daftar paket dan simpan paket yang menarik buat Anda.
              </p>
              <Link href="/calon-jamaah/packages">
                <Button className="mt-5">Cari Paket</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          interests.map((interest) => (
            <Card key={interest.id} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Badge variant={interest.actionType === "CONVERT_REQUEST" ? "default" : "secondary"}>
                    {actionLabel[interest.actionType] || interest.actionType}
                  </Badge>
                  <h2 className="mt-2 truncate font-semibold text-gray-900">{interest.packageName}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {date(interest.departureDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      {interest.actionType === "WHATSAPP_CONSULT" ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                      {interest.packageCode || `#${interest.packageId}`}
                    </span>
                  </div>
                </div>
                <Link href={`/calon-jamaah/packages/${interest.packageId}`}>
                  <Button variant="outline" size="sm">Lihat</Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}
