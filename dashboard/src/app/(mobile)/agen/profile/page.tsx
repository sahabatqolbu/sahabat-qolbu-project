// dashboard/src/app/(mobile)/agen/profile/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Key, LogOut, Settings } from "lucide-react";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  FileText,
  Instagram,
  Share2,
  Star,
  Award,
  Phone,
  Mail,
  Calendar,
  IdCard,
  Building2,
  Edit,
  Clock,
  XCircle,
  ChevronRight,
  Facebook,
  Video,
  Users,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BottomNav } from "@/components/mobile/BottomNav";

import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AgenProfilePage() {
  const router = useRouter();

  // ===== FETCH DATA =====
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
    staleTime: 30000,
  });

  const { data: levelsData } = useQuery({
    queryKey: ["agent-levels"],
    queryFn: () => adminService.agentLevels.getAll(),
    staleTime: 60000,
  });

  const { data: purposesData } = useQuery({
    queryKey: ["agent-purposes"],
    queryFn: () => adminService.agentPurposes.getAll({ isActive: true }),
    staleTime: 60000,
  });

  const profile = profileData?.data;
  const agentData = profile?.agentData;
  const levels = levelsData?.data || [];
  const purposes = purposesData?.data || [];

  // Get current level info
  const currentStar = agentData?.currentStar ?? 0;
  const currentLevel = levels.find((l: any) => l.star === currentStar);

  // Parse purposes
  const selectedPurposeIds = (() => {
    if (!agentData?.purposes) return [];
    try {
      return typeof agentData.purposes === "string"
        ? JSON.parse(agentData.purposes)
        : agentData.purposes;
    } catch {
      return [];
    }
  })();

  const selectedPurposes = purposes.filter((p: any) =>
    selectedPurposeIds.includes(p.id)
  );

  // Status config
  const statusConfig: Record<
    string,
    { color: string; bg: string; icon: any; label: string }
  > = {
    DRAFT: {
      color: "text-gray-700",
      bg: "bg-gray-100",
      icon: FileText,
      label: "Draft",
    },
    PENDING: {
      color: "text-amber-700",
      bg: "bg-amber-100",
      icon: Clock,
      label: "Menunggu Approval",
    },
    APPROVED: {
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      icon: CheckCircle,
      label: "Aktif",
    },
    REJECTED: {
      color: "text-red-700",
      bg: "bg-red-100",
      icon: XCircle,
      label: "Ditolak",
    },
  };

  const status = statusConfig[agentData?.status || "DRAFT"];
  const StatusIcon = status?.icon || FileText;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 w-full md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-primary text-white p-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/agen">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Profil Saya</h1>
          </div>

          {/* Edit Button - Hanya untuk field yang boleh diedit */}
          {agentData?.status === "APPROVED" && (
            <Link href="/agen/profile/edit">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-14">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {(profile?.fullName || agentData?.fullNameKtp || "A").charAt(
                    0,
                  )}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {profile?.fullName || agentData?.fullNameKtp || "Nama Agen"}
                </h2>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
            </div>

            {/* Status & Level */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${status?.bg} ${status?.color} border-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status?.label}
              </Badge>

              <Badge
                variant="outline"
                className="border-secondary text-secondary"
              >
                {Array.from({ length: currentStar }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-secondary mr-0.5" />
                ))}
                {currentLevel?.name || "Pra-Agent"}
              </Badge>

              {agentData?.referralCode && (
                <Badge variant="outline" className="font-mono">
                  {agentData.referralCode}
                </Badge>
              )}
            </div>

            {/* Rejection Note */}
            {agentData?.status === "REJECTED" && agentData?.rejectionNote && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Alasan:</strong> {agentData.rejectionNote}
                </p>
              </div>
            )}

            {/* Action for DRAFT/REJECTED */}
            {(agentData?.status === "DRAFT" ||
              agentData?.status === "REJECTED") && (
              <Link href="/agen/register" className="block mt-4">
                <Button className="w-full bg-primary hover:bg-primary-600">
                  {agentData?.status === "REJECTED"
                    ? "Perbaiki & Submit Ulang"
                    : "Lengkapi Pendaftaran"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Informasi Kontak */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Informasi Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{profile?.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">WhatsApp</p>
                <p className="text-sm font-medium">
                  {profile?.phone || agentData?.phone || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data KTP */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Data Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <IdCard className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Nama KTP</p>
                <p className="text-sm font-medium">
                  {agentData?.fullNameKtp || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">NIK</p>
                <p className="text-sm font-medium font-mono">
                  {agentData?.nik
                    ? `${agentData.nik.slice(0, 6)}****${agentData.nik.slice(
                        -4,
                      )}`
                    : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-pink-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Tempat, Tanggal Lahir</p>
                <p className="text-sm font-medium">
                  {agentData?.birthPlace && agentData?.birthDate
                    ? `${agentData.birthPlace}, ${format(
                        new Date(agentData.birthDate),
                        "dd MMMM yyyy",
                        { locale: id },
                      )}`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Alamat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {agentData?.address || "-"}
                </p>
                {(agentData?.city || agentData?.province) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      agentData?.city,
                      agentData?.province,
                      agentData?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sosial Media */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Sosial Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agentData?.instagram && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  <Instagram className="h-3.5 w-3.5 text-pink-500" />@
                  {agentData.instagram}
                </Badge>
              )}
              {agentData?.facebook && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  <Facebook className="h-3.5 w-3.5 text-blue-600" />
                  {agentData.facebook}
                </Badge>
              )}
              {agentData?.tiktok && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  <Video className="h-3.5 w-3.5" />@{agentData.tiktok}
                </Badge>
              )}
              {!agentData?.instagram &&
                !agentData?.facebook &&
                !agentData?.tiktok && (
                  <p className="text-sm text-gray-500">
                    Belum ada sosial media
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Rekening Bank */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Rekening Bank
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentData?.bankName ? (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{agentData.bankName}</p>
                  <p className="text-xs text-gray-500">
                    {agentData.accountNumber} • {agentData.accountName}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada data rekening</p>
            )}
          </CardContent>
        </Card>

        {/* Level & Bintang (Read Only) */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary-50 to-secondary-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Award className="h-4 w-4" />
              Level Agen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: currentStar }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-secondary text-secondary"
                    />
                  ))}
                  {currentStar === 0 && (
                    <span className="text-sm text-gray-500">
                      Belum ada bintang
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-primary">
                  {currentLevel?.name || "Pra-Agent"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Closing</p>
                <p className="text-2xl font-bold text-primary">
                  {agentData?.totalClosing || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tujuan Bergabung (Read Only) */}
        {selectedPurposes.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tujuan Bergabung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedPurposes.map((purpose: any) => (
                  <Badge
                    key={purpose.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {purpose.title}
                  </Badge>
                ))}
              </div>
              {agentData?.customPurpose && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  "{agentData.customPurpose}"
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Foto KTP (Read Only - Thumbnail) */}
        {agentData?.ktpPhoto && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Dokumen KTP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-16 w-24 rounded-lg overflow-hidden border">
                  <img
                    src={agentData.ktpPhoto}
                    alt="KTP"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Terverifikasi
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Tidak dapat diubah
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Info */}
        {(agentData?.recruiterCode || agentData?.referralCode) && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Referral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentData?.referralCode && (
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">
                    Kode Referral Anda
                  </p>
                  <p className="text-lg font-bold font-mono text-primary">
                    {agentData.referralCode}
                  </p>
                </div>
              )}
              {agentData?.recruiterCode && (
                <div>
                  <p className="text-xs text-gray-500">Direkrut oleh</p>
                  <p className="text-sm font-medium">
                    {agentData.recruiterName || agentData.recruiterCode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account & Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/agen/profile/account">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Info Akun & Keamanan
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full justify-between text-red-500 border-red-200 hover:bg-red-50 mt-2"
              onClick={() => {
                // Tambahkan import useAuthStore di atas
                // const { logout } = useAuthStore();
              }}
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Keluar dari Akun
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav role="AGEN" />
    </div>
  );
}
