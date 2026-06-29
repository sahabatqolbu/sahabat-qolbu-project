"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Heart, MessageCircle, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { prospectService, type ProspectInterest } from "@/services/prospectService";

export default function CalonJamaahConsultationPage() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["prospect-interests", "consultation"],
    queryFn: () => prospectService.getInterests(),
    staleTime: 30_000,
  });

  const interests: ProspectInterest[] = data?.data || [];
  const latestPackage = interests.find((item) => item.packageId);

  const consultMutation = useMutation({
    mutationFn: () =>
      latestPackage
        ? prospectService.saveInterest(
            latestPackage.packageId,
            "WHATSAPP_CONSULT",
            `/calon-jamaah/packages/${latestPackage.packageId}`,
          )
        : Promise.reject(new Error("NO_PACKAGE")),
    onSuccess: () =>
      toast({
        title: "Permintaan konsultasi dicatat",
        description: "Admin bisa melihat paket yang Anda minati untuk follow up.",
      }),
    onError: () =>
      toast({
        variant: "destructive",
        title: "Pilih paket dulu",
        description: "Simpan salah satu paket agar konsultasi lebih jelas.",
      }),
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <header className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] px-5 py-8 text-white md:px-8">
        <div className="mx-auto max-w-5xl">
          <MessageCircle className="h-10 w-10" />
          <h1 className="mt-4 text-2xl font-bold">Konsultasi Paket</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Flow ini sengaja dicatat di dashboard supaya admin bisa follow up dari data minat dan nomor WhatsApp yang Anda daftarkan.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 md:px-8">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Minta dihubungi admin</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Admin akan melihat data akun dan paket terakhir yang Anda minati. Ini lebih rapi untuk follow up dibanding form bebas di landing page.
                </p>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="mt-5 h-20 rounded-xl" />
            ) : latestPackage ? (
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Paket terakhir diminati</p>
                <p className="mt-1 font-medium text-gray-900">{latestPackage.packageName}</p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                Anda belum menyimpan paket. Pilih paket dulu supaya admin tahu konteks konsultasinya.
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button onClick={() => consultMutation.mutate()} disabled={consultMutation.isPending || !latestPackage}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Catat Permintaan Konsultasi
              </Button>
              <Link href="/calon-jamaah/packages">
                <Button variant="outline" className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Cari Paket
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Heart className="h-5 w-5 text-[var(--color-primary)]" />
              Tips sebelum konsultasi
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Pilih 1-3 paket yang tanggal dan budgetnya paling cocok.</li>
              <li>Pastikan nomor WhatsApp di akun masih aktif.</li>
              <li>Kalau sudah yakin, gunakan tombol Daftar di detail paket untuk masuk tahap jamaah.</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}
