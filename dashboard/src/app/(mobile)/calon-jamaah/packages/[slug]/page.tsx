"use client";

import Link from "next/link";
import { use } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building, Calendar, CheckCircle2, Clock, Heart, MessageCircle, Package, Plane, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import { prospectService, type PublicPackage } from "@/services/prospectService";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const money = (value: unknown) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "Tanggal menyusul";

const textLines = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return value.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
};

export default function CalonJamaahPackageDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["prospect-public-package", slug],
    queryFn: () => prospectService.getPublicPackageBySlug(slug),
    enabled: Boolean(slug),
  });

  const pkg: PublicPackage | null = data?.data || null;
  const sourcePath = `/calon-jamaah/packages/${slug}`;

  const saveMutation = useMutation({
    mutationFn: () => prospectService.saveInterest(pkg!.id, "SAVED", sourcePath),
    onSuccess: () => toast({ title: "Paket disimpan", description: "Paket masuk ke daftar minat Anda." }),
    onError: (error: any) =>
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error?.response?.data?.message || "Silakan coba lagi.",
      }),
  });

  const consultMutation = useMutation({
    mutationFn: () => prospectService.saveInterest(pkg!.id, "WHATSAPP_CONSULT", sourcePath),
    onSuccess: () =>
      toast({
        title: "Permintaan konsultasi dicatat",
        description: "Admin akan melihat paket yang Anda minati untuk follow up.",
      }),
  });

  const convertMutation = useMutation({
    mutationFn: () => prospectService.convert(pkg!.id, sourcePath),
    onSuccess: () => {
      toast({
        title: "Pendaftaran dimulai",
        description: "Akun Anda menjadi jamaah. Silakan lengkapi data dan dokumen.",
      });
      window.location.href = "/jamaah/onboarding";
    },
    onError: (error: any) =>
      toast({
        variant: "destructive",
        title: "Gagal daftar",
        description: error?.response?.data?.message || "Silakan coba lagi.",
      }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-4 h-80 rounded-2xl" />
        <Skeleton className="mt-4 h-40 rounded-2xl" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Detail Paket" />
        <div className="p-6 text-center text-gray-500">Paket tidak ditemukan.</div>
        <BottomNav role="CALON_JAMAAH" />
      </div>
    );
  }

  const primaryImage = pkg.images?.find((img) => img.isPrimary) || pkg.images?.[0];
  const facilities = textLines(pkg.facilities);
  const description = textLines(pkg.description);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-10">
      <Header title="Detail Paket" />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
          <div className="bg-gray-50">
            {primaryImage?.imageUrl ? (
              <img src={getImageUrl(primaryImage.imageUrl)} alt={pkg.name} className="block h-auto max-h-[78vh] w-full object-contain" />
            ) : (
              <div className="flex h-56 items-center justify-center text-gray-300 md:h-80">
                <Package className="h-16 w-16" />
              </div>
            )}
          </div>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{pkg.type || "UMROH"}</Badge>
              <span className="text-sm text-gray-500">{pkg.code || "-"}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">{pkg.name}</h1>
            <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{date(pkg.departureDate)}</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{pkg.duration || "-"} hari</span>
              <span className="flex items-center gap-2"><Users className="h-4 w-4" />{pkg.remainingSeats ?? pkg.totalSeats ?? "-"} kursi</span>
            </div>
            <div className="mt-5 rounded-xl bg-[var(--color-primary)]/5 p-4">
              <p className="text-sm text-gray-500">Mulai dari</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{money(pkg.discountPrice || pkg.price)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={Plane} title="Penerbangan" lines={[pkg.airline?.name || "-", pkg.departureAirport?.name || "Bandara menyusul"]} />
          <InfoCard icon={Building} title="Akomodasi" lines={[`Makkah: ${pkg.hotelMakkah?.name || "-"}`, `Madinah: ${pkg.hotelMadinah?.name || "-"}`]} />
        </div>

        <TextCard title="Deskripsi" lines={description} empty="Deskripsi paket belum tersedia." />
        <TextCard title="Fasilitas" lines={facilities} empty="Fasilitas paket belum tersedia." />
      </main>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-white p-3 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Heart className="mr-1 h-4 w-4" /> Simpan
          </Button>
          <Button variant="outline" onClick={() => consultMutation.mutate()} disabled={consultMutation.isPending}>
            <MessageCircle className="mr-1 h-4 w-4" /> Konsul
          </Button>
          <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Daftar
          </Button>
        </div>
      </div>

      <div className="mx-auto hidden max-w-5xl grid-cols-3 gap-3 px-8 pb-8 md:grid">
        <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Simpan Paket</Button>
        <Button variant="outline" onClick={() => consultMutation.mutate()} disabled={consultMutation.isPending}>Minta Konsultasi</Button>
        <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>Daftar Jadi Jamaah</Button>
      </div>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Link href="/calon-jamaah/packages">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: any; title: string; lines: string[] }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Icon className="h-5 w-5 text-[var(--color-primary)]" />
          {title}
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          {lines.map((line, index) => <p key={index}>{line}</p>)}
        </div>
      </CardContent>
    </Card>
  );
}

function TextCard({ title, lines, empty }: { title: string; lines: string[]; empty: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {lines.length ? (
          <div className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
            {lines.map((line, index) => <p key={index}>{line}</p>)}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
