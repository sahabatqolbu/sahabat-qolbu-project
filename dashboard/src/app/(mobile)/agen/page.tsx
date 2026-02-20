// dashboard/src/app/(mobile)/agen/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationDropdownAgen } from "@/components/mobile/NotificationDropdownAgen";
import {
  Users,
  TrendingUp,
  Award,
  Package,
  Plus,
  Loader2,
  Trophy,
  AlertCircle,
  Copy,
  Wallet,
  DollarSign,
  Star,
  ChevronRight,
  User,
  Sparkles,
  Target,
  Gift,
  ArrowUpRight,
  Bell,
  Globe,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/mobile/BottomNav";


export default function AgenDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [skipPayment, setSkipPayment] = useState(false);

  // ===== FETCH AGENT PROFILE =====
  const { data, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: async () => {
      const response = await adminService.agenProfile.getMyProfile();
      return response;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.data?.agentData?.status;
      return status === "PENDING" ? 5000 : false;
    },
    refetchIntervalInBackground: true,
  });

  const profile = data?.data;
  const agentData = profile?.agentData;
  const currentStatus = agentData?.status;

  // ===== DETECT STATUS CHANGE =====
  useEffect(() => {
    if (!currentStatus || !previousStatus) {
      setPreviousStatus(currentStatus);
      return;
    }

    if (previousStatus === "PENDING" && currentStatus === "APPROVED") {
      toast({
        title: "Selamat! Akun Anda Disetujui",
        description: "Anda sekarang adalah agen aktif",
        duration: 10000,
      });
    }

    if (previousStatus === "PENDING" && currentStatus === "REJECTED") {
      toast({
        variant: "destructive",
        title: "Pendaftaran Ditolak",
        description: agentData?.rejectionNote || "Silakan perbaiki data Anda",
        duration: 10000,
      });
    }

    setPreviousStatus(currentStatus);
  }, [currentStatus, previousStatus, agentData?.rejectionNote, toast]);

  useEffect(() => {
    const skip = localStorage.getItem("skipPayment") === "true";
    setSkipPayment(skip);
  }, []);

  const isProfileComplete = agentData?.isComplete;
  const isApproved = agentData?.status === "APPROVED";
  const currentStar = agentData?.currentStar || 0;
  const selectedLevel = agentData?.currentLevel;
  const needsPayment = selectedLevel && selectedLevel.star > 0;
  const hasPaymentProof = agentData?.paymentProof;
  const hasJamaah = (profile?.totalJamaah || 0) > 0;

  // ===== REDIRECT LOGIC =====
  useEffect(() => {
    if (!isLoading && profile) {
      if (!isProfileComplete || agentData?.status === "DRAFT") {
        router.push("/agen/register");
        return;
      }
      if (agentData?.status === "REJECTED") {
        router.push("/agen/register");
        return;
      }
    }
  }, [isLoading, profile, isProfileComplete, agentData?.status, router]);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--color-secondary)]/20 rounded-full animate-ping" />
            <div className="relative bg-white p-4 rounded-full shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="mt-4 text-[var(--color-primary-400)] font-medium">
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Redirect states
  if (
    !isProfileComplete ||
    agentData?.status === "DRAFT" ||
    agentData?.status === "REJECTED"
  ) {
    return null;
  }

  // ===== WAITING APPROVAL SCREEN =====
  if (!isApproved && agentData?.status === "PENDING") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="relative mx-auto mb-6">
              <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-amber-400 rounded-full flex items-center justify-center">
                <Bell className="h-3 w-3 text-white" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              Menunggu Approval
            </h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Data Anda sedang direview. Notifikasi akan dikirim setelah
              disetujui.
            </p>

            <div className="bg-amber-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-700">Status</span>
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                  Menunggu Verifikasi
                </Badge>
              </div>
              <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <p className="text-[10px] text-amber-600 mt-2">
                Estimasi: 1-2 hari kerja
              </p>
            </div>

            <Link href="/agen/profile">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-[var(--color-primary)] text-[var(--color-primary)]"
              >
                <User className="mr-2 h-4 w-4" />
                Lihat Profil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== PAYMENT PROMPT =====
  if (
    isApproved &&
    needsPayment &&
    !hasPaymentProof &&
    !hasJamaah &&
    !skipPayment
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-600)] p-6 text-white text-center">
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold mb-1">Selamat! 🎉</h1>
            <p className="text-sm text-white/80">Akun Anda Diapprove</p>
            <div className="flex items-center justify-center gap-1 mt-3">
              {Array.from({ length: selectedLevel?.star || 0 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-[var(--color-secondary)] text-[var(--color-secondary)]"
                />
              ))}
            </div>
            <p className="text-sm font-medium mt-2">{selectedLevel?.name}</p>
          </div>

          <CardContent className="p-5">
            <div className="bg-blue-50 rounded-2xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">
                    Training: Rp{" "}
                    {parseInt(selectedLevel?.price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-blue-600">
                    Bayar untuk benefit langsung, atau daftar jamaah dulu
                    (gratis)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link href="/agen/payment">
                <Button className="w-full h-11 rounded-xl bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-600)] text-[var(--color-secondary-foreground)] font-semibold text-sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Bayar Training
                </Button>
              </Link>

              <Link href="/agen/jamaah/create">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-[var(--color-primary)] text-[var(--color-primary)] text-sm"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Daftar Jamaah Dulu
                </Button>
              </Link>

              <Button
                variant="ghost"
                className="w-full text-xs text-gray-400"
                onClick={() => {
                  localStorage.setItem("skipPayment", "true");
                  window.location.reload();
                }}
              >
                Lewati untuk sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== MAIN DASHBOARD =====
  const totalClosing = agentData?.totalClosing || 0;
  const nextLevelClosing = currentStar === 0 ? 1 : currentStar === 1 ? 5 : 5;
  const progress = Math.min((totalClosing / nextLevelClosing) * 100, 100);
  const remainingClosing = nextLevelClosing - totalClosing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24 md:pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white p-5 pb-20 md:px-8 md:pt-8 md:pb-24 rounded-b-[2rem] md:rounded-b-[2.5rem] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-8 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-1 md:mb-0">
            <div>
              <p className="text-xs md:text-sm text-white/60">Selamat datang,</p>
              <h1 className="text-lg md:text-3xl font-bold">
                {profile?.fullName?.split(" ")[0] || "Agen"} 👋
              </h1>
            </div>

            {/* Di dalam header, ganti bagian ICON NOTIF & PROFIL */}
            <div className="flex items-center gap-2">
              {/* ✅ TAMBAH ICON CALENDAR */}
              <Link href="/agen/calendar">
                <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </Link>

              <Link href="/agen/website">
                <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Globe className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </Link>

              <NotificationDropdownAgen />

              <Link href="/agen/profile">
                <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                  <User className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 -mt-14 md:-mt-16 space-y-4 md:space-y-6 relative z-10 max-w-7xl mx-auto">
        {/* Level Card */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-600)] text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">
                      Level
                    </p>
                    <p className="text-sm font-bold">
                      {currentStar === 0
                        ? "Pra-Agent"
                        : `Bintang ${currentStar}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.max(currentStar, 1) }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          currentStar > 0
                            ? "fill-[var(--color-secondary)] text-[var(--color-secondary)]"
                            : "fill-white/30 text-white/30"
                        }`}
                      />
                    ),
                  )}
                </div>
              </div>

              {currentStar < 2 ? (
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-white/70">
                      Progress ke Level {currentStar + 1}
                    </span>
                    <span className="text-xs font-bold">
                      {totalClosing}/{nextLevelClosing}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-secondary)] rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/60 mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {remainingClosing} closing lagi
                  </p>
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[var(--color-secondary)]" />
                  <span className="text-xs font-medium">
                    Level Tertinggi! 🎉
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 md:gap-4">
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">
                {profile?.totalJamaah || 0}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">Jamaah</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">
                {totalClosing}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">Closing</p>
            </CardContent>
          </Card>

          <Link href="/agen/commissions">
            <Card className="border-0 shadow-md rounded-2xl h-full">
              <CardContent className="p-3 md:p-4 text-center h-full flex flex-col justify-center">
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center mx-auto mb-2">
                  <Wallet className="h-4 w-4 md:h-5 md:w-5 text-[var(--color-secondary-600)]" />
                </div>
                <p className="text-sm md:text-base font-bold text-[var(--color-primary)]">
                  Rp 0
                </p>
                <p className="text-[10px] md:text-xs text-gray-500">Komisi</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Action - CTA */}
        <Link href="/agen/jamaah/create">
          <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-600)] overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tambah Jamaah</p>
                  <p className="text-[10px] text-white/70">
                    Daftarkan jamaah baru
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-white/80" />
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Menu Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-sm md:text-base font-semibold text-[var(--color-primary)] my-3 px-1">
              Menu Cepat
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              <Link href="/agen/jamaah">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-blue-50 flex items-center justify-center mb-1.5">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Jamaah
                  </p>
                </div>
              </Link>

              <Link href="/agen/packages">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-purple-50 flex items-center justify-center mb-1.5">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Paket
                  </p>
                </div>
              </Link>

              <Link href="/agen/commissions">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center mb-1.5">
                    <Wallet className="h-5 w-5 text-[var(--color-secondary-600)]" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Komisi
                  </p>
                </div>
              </Link>

              <Link href="/agen/website">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-cyan-50 flex items-center justify-center mb-1.5">
                    <Globe className="h-5 w-5 text-cyan-600" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Website
                  </p>
                </div>
              </Link>

              <Link href="/agen/profile">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-gray-100 flex items-center justify-center mb-1.5">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Profil
                  </p>
                </div>
              </Link>

              <Link href="/agen/calendar">
                <div className="flex flex-col items-center p-3 md:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-600 text-center">
                    Kalender
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Referral Code */}
          {agentData?.referralCode && (
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-600)] p-4 md:p-5 text-white h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-4 w-4 text-[var(--color-secondary)]" />
                    <p className="text-xs md:text-sm font-medium">Kode Referral</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 md:p-4 flex items-center justify-between">
                    <code className="text-lg md:text-xl font-bold tracking-widest">
                      {agentData.referralCode}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(agentData.referralCode);
                        toast({ title: "Kode berhasil dicopy!" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] md:text-xs text-white/60 mt-2">
                    Bagikan untuk rekrut agen baru
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-amber-800 mb-1">
                    Tips Hari Ini
                  </p>
                  <p className="text-[11px] md:text-sm text-amber-700 leading-relaxed">
                    Follow up jamaah yang sudah terdaftar untuk meningkatkan
                    closing rate! 🚀
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav role="AGEN" />
    </div>
  );
}
