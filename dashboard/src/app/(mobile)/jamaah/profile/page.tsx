// dashboard/src/app/(mobile)/jamaah/profile/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Users,
  AlertCircle,
  LogOut,
  Edit,
  Lock,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function JamaahProfilePage() {
  const { logout } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
  });

  const profile = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const isApproved = profile?.registrationStatus === "APPROVED";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-600)] text-white p-5 pb-16">
        <div className="flex items-center justify-between mb-4">
          <Link href="/jamaah">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Profil Saya</h1>
          <div className="w-8" />
        </div>
        <div className="text-center">
          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            {profile?.fotoUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${profile.fotoUrl}`}
                alt="Foto"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <h2 className="font-bold text-xl">{profile?.user?.fullName}</h2>
          <p className="text-sm text-white/70">{profile?.bookingNumber}</p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4 relative z-10">
        {/* Status Badge */}
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status Pendaftaran</span>
              <Badge
                className={
                  isApproved
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {isApproved ? "Disetujui" : profile?.registrationStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Read Only Notice */}
        {isApproved && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Data sudah diapprove dan tidak dapat diubah. Hubungi admin untuk
              perubahan.
            </AlertDescription>
          </Alert>
        )}

        {/* Personal Info */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-primary)]" />
              Data Diri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nama Paspor" value={profile?.namaPaspor} />
            <InfoRow label="NIK" value={profile?.nik} />
            <InfoRow
              label="Tempat, Tanggal Lahir"
              value={
                profile?.birthPlace && profile?.birthDate
                  ? `${profile.birthPlace}, ${format(new Date(profile.birthDate), "dd MMMM yyyy", { locale: id })}`
                  : "-"
              }
            />
            <InfoRow
              label="Jenis Kelamin"
              value={
                profile?.gender === "PRIA"
                  ? "Laki-laki"
                  : profile?.gender === "WANITA"
                    ? "Perempuan"
                    : "-"
              }
            />
            <InfoRow
              label="Status Pernikahan"
              value={
                profile?.maritalStatus === "MENIKAH"
                  ? "Menikah"
                  : profile?.maritalStatus === "BELUM_MENIKAH"
                    ? "Belum Menikah"
                    : profile?.maritalStatus || "-"
              }
            />
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--color-primary)]" />
              Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Email"
              value={profile?.user?.email}
              icon={<Mail className="h-4 w-4" />}
            />
            <InfoRow
              label="No. HP"
              value={profile?.user?.phone}
              icon={<Phone className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              Alamat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{profile?.address || "-"}</p>
            <p className="text-sm text-gray-500 mt-1">
              {[
                profile?.district,
                profile?.city,
                profile?.province,
                profile?.postalCode,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </p>
          </CardContent>
        </Card>

        {/* Passport */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
              Data Paspor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nomor Paspor" value={profile?.passportNumber} />
            <InfoRow
              label="Berlaku Sampai"
              value={
                profile?.passportExpiry
                  ? format(new Date(profile.passportExpiry), "dd MMMM yyyy", {
                      locale: id,
                    })
                  : "-"
              }
            />
            <InfoRow
              label="Tempat Terbit"
              value={profile?.passportIssuePlace}
            />
          </CardContent>
        </Card>

        {/* Mahram */}
        {profile?.mahram && (
          <Card className="border-0 shadow-md rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--color-primary)]" />
                Mahram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Nama" value={profile.mahram.user?.fullName} />
              <InfoRow label="Hubungan" value={profile.mahramRelation} />
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--color-primary)]" />
              Kontak Darurat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nama" value={profile?.emergencyName} />
            <InfoRow label="No. HP" value={profile?.emergencyPhone} />
            <InfoRow label="Hubungan" value={profile?.emergencyRelation} />
          </CardContent>
        </Card>

        {/* Tambahkan sebelum Logout Button */}
        <Link href="/jamaah/account">
          <Button variant="outline" className="w-full mb-3">
            <Shield className="h-4 w-4 mr-2" />
            Info Akun & Keamanan
          </Button>
        </Link>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-red-500 border-red-200 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>

      <BottomNav role="JAMAAH" />
    </div>
  );
}

// Helper component
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-500 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
        {value || "-"}
      </span>
    </div>
  );
}
