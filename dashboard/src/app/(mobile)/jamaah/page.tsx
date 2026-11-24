// dashboard/src/app/(mobile)/jamaah/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { NotificationDropdownJamaah } from "@/components/mobile/NotificationDropdownJamaah";
import {
  Package,
  CreditCard,
  FileText,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import TripTicket from "@/components/jamaah/TripTicket";


export default function JamaahDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // ===== FETCH PROFILE =====
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const profile = profileData?.data;

  // ===== REDIRECT LOGIC =====
  useEffect(() => {
    if (!isLoading && profile) {
      const status = profile.registrationStatus;

      // Belum lengkap → Onboarding
      if (
        status === "DRAFT" ||
        status === "PENDING_DOCUMENT" ||
        status === "REJECTED"
      ) {
        router.replace("/jamaah/onboarding");
        return;
      }

      // Menunggu approval → Waiting page
      if (status === "VERIFIED") {
        router.replace("/jamaah/waiting-approval");
        return;
      }
    }
  }, [isLoading, profile, router]);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Jika belum APPROVED, jangan render (redirect akan handle)
  if (!profile || profile.registrationStatus !== "APPROVED") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  // ===== CALCULATIONS =====
  const packageData = profile.package;

  const paymentProgress =
    parseFloat(profile.hargaFinal) > 0
      ? (parseFloat(profile.totalPayment) / parseFloat(profile.hargaFinal)) *
        100
      : 0;

  const outstandingAmount = parseFloat(profile.outstanding) || 0;

  // Document status
  const docsComplete = profile.completeness?.requiredDocsComplete;
  const optionalDocsCount = Object.values(
    profile.completeness?.optionalDocs || {},
  ).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white p-5 pb-20 md:px-8 md:pt-8 md:pb-24 relative">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-white/60">Assalamu'alaikum,</p>
              <h1 className="text-lg md:text-3xl font-bold">
                {profile.user?.fullName?.split(" ")[0] || "Jamaah"}
              </h1>
            </div>

            {/* Di dalam header, ganti bagian ICON NOTIF & PROFIL */}
            <div className="flex items-center gap-2">
              {/* TAMBAH ICON CALENDAR */}
              <Link href="/jamaah/calendar">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
              </Link>

              <NotificationDropdownJamaah />

              <Link href="/jamaah/profile">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <User className="h-5 w-5" />
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 -mt-12 md:-mt-16 space-y-4 md:space-y-6 relative z-10 max-w-7xl mx-auto">
        <TripTicket bookingNumber={profile.bookingNumber} pkg={packageData} />

        {/* Payment Status */}
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Pembayaran</p>
              <Link href="/jamaah/payments" className="inline-flex items-center text-xs font-medium text-[var(--color-primary)]">
                Riwayat <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-gray-900">
              Rp {parseFloat(profile.totalPayment || "0").toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-500">
              sudah dibayar dari Rp {parseFloat(profile.hargaFinal || "0").toLocaleString("id-ID")}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(paymentProgress, 100))} aria-label="Progres pembayaran">
              <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {profile.statusPayment === "LUNAS"
                ? "Pembayaran lunas"
                : outstandingAmount > 0
                  ? `Sisa Rp ${outstandingAmount.toLocaleString("id-ID")}`
                  : "Belum ada pembayaran"}
            </p>
          </CardContent>
        </Card>

        {profile.deadlines?.daysUntilH30 !== null && profile.deadlines?.daysUntilH30 > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              <span className="font-medium">H-30:</span> serahkan paspor asli dan bukti vaksin ({profile.deadlines.daysUntilH30} hari lagi)
            </p>
          </div>
        )}

        {/* Quick Menu */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-primary)] mb-3 px-1">
            Menu
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
            <Link href="/jamaah/packages">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-1.5">
                  <Package className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Paket
                </p>
              </div>
            </Link>

            <Link href="/jamaah/payments">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-1.5">
                  <CreditCard className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Bayar
                </p>
              </div>
            </Link>

            <Link href="/jamaah/documents">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-1.5">
                  <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Dokumen
                </p>
              </div>
            </Link>

            <Link href="/jamaah/profile">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-1.5">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Profil
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Document Checklist */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                Kelengkapan Dokumen
              </h3>
              <Link href="/jamaah/documents">
                <Button variant="ghost" size="sm" className="text-xs">
                  Lihat
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <DocItem
                label="Foto"
                ok={profile.completeness?.requiredDocs?.foto}
                required
              />
              <DocItem
                label="KTP"
                ok={profile.completeness?.requiredDocs?.ktp}
                required
              />
              <DocItem
                label="KK"
                ok={profile.completeness?.requiredDocs?.kk}
                required
              />
              <DocItem
                label="Paspor"
                ok={profile.completeness?.optionalDocs?.paspor}
              />
              <DocItem
                label="Vaksin"
                ok={profile.completeness?.optionalDocs?.vaksin}
              />
              <DocItem
                label="Meningitis"
                ok={profile.completeness?.optionalDocs?.meningitis}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Agen */}
        {profile.agen && (
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Agen Anda</p>
                    <p className="font-medium text-sm">
                      {profile.agen.fullName}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${profile.agen.phone?.replace(/^0/, "62")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    <Phone className="h-4 w-4 mr-1" />
                    Hubungi
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav role="JAMAAH" />
    </div>
  );
}

// Helper component
function DocItem({
  label,
  ok,
  required = false,
}: {
  label: string;
  ok?: boolean;
  required?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        ok ? "bg-green-50" : required ? "bg-amber-50" : "bg-gray-50"
      }`}
    >
      {ok ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : required ? (
        <Clock className="h-4 w-4 text-amber-500" />
      ) : (
        <Clock className="h-4 w-4 text-gray-400" />
      )}
      <span
        className={`text-xs ${
          ok ? "text-green-700" : required ? "text-amber-700" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
