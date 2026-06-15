"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building,
  Plane,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function JamaahPackageDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { toast } = useToast();
  const packageId = id;

  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-package-detail", packageId],
    queryFn: () => jamaahSelfService.getPackageDetail(packageId as string),
    enabled: !!packageId,
  });

  const pkg = data?.data;

  const requestMutation = useMutation({
    mutationFn: () => jamaahSelfService.requestPackageConsultation(packageId as string),
    onSuccess: (res: any) => {
      const target = res?.data?.target;
      toast({
        title: "Permintaan dikirim",
        description:
          target === "AGEN"
            ? "Tim agen Anda sudah menerima notifikasi."
            : "Admin sudah menerima notifikasi permintaan paket Anda.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal mengirim permintaan",
        description: error?.response?.data?.message || "Silakan coba lagi.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <Skeleton className="h-28 w-full rounded-2xl mb-3" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/jamaah/packages">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Detail Paket</h1>
          </div>
        </div>

        <div className="p-6 text-center text-gray-500">Paket tidak ditemukan.</div>
        <BottomNav role="JAMAAH" />
      </div>
    );
  }

  const primaryImage = pkg.images?.find((img: any) => img.isPrimary) || pkg.images?.[0];
  const finalPrice = parseFloat(pkg.discountPrice || pkg.price || "0");

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/jamaah/packages">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Detail Paket</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="relative h-48 w-full bg-gray-100">
            {primaryImage?.imageUrl ? (
              <Image
                src={getImageUrl(primaryImage.imageUrl)}
                alt={pkg.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{pkg.type || "UMROH"}</Badge>
              <span className="text-xs text-gray-500">{pkg.code || "-"}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{pkg.name}</h2>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              {(pkg.description || "")
                .split(/\r?\n+/)
                .map((line: string) => line.trim())
                .filter(Boolean)
                .map((line: string, idx: number) => (
                  <p key={idx}>{line}</p>
                ))}
              {!pkg.description && <p>-</p>}
            </div>
            <div className="mt-3 text-right">
              <p className="text-xs text-gray-500">Harga paket</p>
              <p className="font-bold text-[var(--color-primary)] text-lg">
                Rp {finalPrice.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">Mau ambil paket ini?</p>
                <p className="text-sm text-gray-600 mt-1">
                  Klik tombol di bawah. Jika Anda terdaftar oleh agen, notifikasi akan
                  dikirim ke agen. Jika tidak, notifikasi akan langsung dikirim ke admin.
                </p>
              </div>
            </div>
            <Button
              className="w-full mt-4 h-11"
              onClick={() => requestMutation.mutate()}
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending
                ? "Mengirim permintaan..."
                : "Minta Didaftarkan ke Paket Ini"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>
                {pkg.departureDate
                  ? format(new Date(pkg.departureDate), "dd MMM yyyy", { locale: localeId })
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4" />
              <span>{pkg.duration || "-"} hari</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" />
              <span>{pkg.remainingSeats ?? pkg.totalSeats ?? "-"} kursi tersisa</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" />
              <span>{pkg.totalSeats || "-"} total kursi</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Building className="h-4 w-4" />
              <span>Akomodasi</span>
            </div>
            <p>Makkah: {pkg.hotelMakkah?.name || "-"}</p>
            <p>Madinah: {pkg.hotelMadinah?.name || "-"}</p>

            <div className="flex items-center gap-2 font-semibold text-gray-900 pt-2">
              <Plane className="h-4 w-4" />
              <span>Penerbangan</span>
            </div>
            <p>Maskapai: {pkg.airline?.name || "-"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4 text-sm text-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
              <FileText className="h-4 w-4" />
              <span>Informasi Tambahan</span>
            </div>
            <div className="space-y-1">
              {(pkg.facilities || "")
                .split(/\r?\n+/)
                .map((line: string) => line.trim())
                .filter(Boolean)
                .map((line: string, idx: number) => (
                  <p key={`f-${idx}`}>{line}</p>
                ))}
              {!pkg.facilities && <p>-</p>}
            </div>
            {pkg.notes ? (
              <div className="mt-3 space-y-1">
                <p className="font-medium text-gray-900">Catatan:</p>
                {pkg.notes
                  .split(/\r?\n+/)
                  .map((line: string) => line.trim())
                  .filter(Boolean)
                  .map((line: string, idx: number) => (
                    <p key={`n-${idx}`}>{line}</p>
                  ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <BottomNav role="JAMAAH" />
    </div>
  );
}
