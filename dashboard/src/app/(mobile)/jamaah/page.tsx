// dashboard/src/app/(mobile)/jamaah/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { NotificationDropdownJamaah } from "@/components/mobile/NotificationDropdownJamaah";
import {
  Package,
  CreditCard,
  FileText,
  Phone,
  MapPin,
  Calendar,
  Plane,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Loader2,
  Star,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";


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
  const daysUntilDeparture = packageData?.departureDate
    ? differenceInDays(new Date(packageData.departureDate), new Date())
    : null;

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white p-5 pb-20 md:px-8 md:pt-8 md:pb-24 rounded-b-[2rem] md:rounded-b-[2.5rem] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-8 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs md:text-sm text-white/60">Assalamu'alaikum,</p>
              <h1 className="text-lg md:text-3xl font-bold">
                {profile.user?.fullName?.split(" ")[0] || "Jamaah"} 👋
              </h1>
            </div>

            {/* Di dalam header, ganti bagian ICON NOTIF & PROFIL */}
            <div className="flex items-center gap-2">
              {/* ✅ TAMBAH ICON CALENDAR */}
              <Link href="/jamaah/calendar">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
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

          {/* Booking Number */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">
              No. Booking
            </p>
            <p className="text-lg font-bold tracking-wider">
              {profile.bookingNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 -mt-12 md:-mt-16 space-y-4 md:space-y-6 relative z-10 max-w-7xl mx-auto">
        {/* Package Card */}
        {packageData ? (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-600)] p-4 text-[var(--color-secondary-foreground)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-bold text-sm">Paket Umrah</span>
                </div>
                {daysUntilDeparture !== null && daysUntilDeparture > 0 && (
                  <Badge className="bg-white/20 text-white border-0">
                    H-{daysUntilDeparture}
                  </Badge>
                )}
              </div>
              <h2 className="font-bold text-lg mb-1">{packageData.name}</h2>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(packageData.departureDate), "dd MMM yyyy", {
                    locale: id,
                  })}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              <Link href="/jamaah/packages">
                <Button variant="outline" className="w-full" size="sm">
                  Lihat Detail Paket
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Belum ada paket terdaftar</p>
              <p className="text-xs text-gray-400 mt-1">Hubungi agen Anda</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Status */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status Pembayaran</p>
                  <p className="font-semibold text-sm">
                    {profile.statusPayment === "LUNAS" ? (
                      <span className="text-green-600">Lunas ✓</span>
                    ) : profile.statusPayment === "CICILAN" ? (
                      <span className="text-amber-600">Cicilan</span>
                    ) : (
                      <span className="text-red-600">Belum Bayar</span>
                    )}
                  </p>
                </div>
              </div>
              <Link href="/jamaah/payments">
                <Button variant="ghost" size="sm" className="text-xs">
                  Detail
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  Rp {parseFloat(profile.totalPayment).toLocaleString("id-ID")}
                </span>
                <span className="font-medium">
                  Rp {parseFloat(profile.hargaFinal).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    paymentProgress >= 100
                      ? "bg-green-500"
                      : paymentProgress > 0
                        ? "bg-amber-500"
                        : "bg-gray-300"
                  }`}
                  style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                />
              </div>
              {outstandingAmount > 0 && (
                <p className="text-xs text-amber-600">
                  Sisa: Rp {outstandingAmount.toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Countdown & Deadlines */}
        {packageData?.departureDate &&
          daysUntilDeparture !== null &&
          daysUntilDeparture > 0 && (
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Keberangkatan dalam</p>
                    <p className="text-3xl font-bold">{daysUntilDeparture}</p>
                    <p className="text-xs text-white/70">hari lagi</p>
                  </div>
                </div>
              </div>
              {profile.deadlines?.daysUntilH30 !== null &&
                profile.deadlines.daysUntilH30 > 0 && (
                  <CardContent className="p-3 bg-amber-50">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-xs">
                        <span className="font-medium">H-30:</span> Serahkan
                        paspor asli & bukti vaksin (
                        {profile.deadlines.daysUntilH30} hari lagi)
                      </p>
                    </div>
                  </CardContent>
                )}
            </Card>
          )}

        {/* Quick Menu */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-primary)] mb-3 px-1">
            Menu
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
            <Link href="/jamaah/packages">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-1.5">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Paket
                </p>
              </div>
            </Link>

            <Link href="/jamaah/payments">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-[10px] font-medium text-gray-600 text-center">
                  Bayar
                </p>
              </div>
            </Link>

            <Link href="/jamaah/documents">
              <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-1.5">
                  <FileText className="h-5 w-5 text-blue-600" />
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
