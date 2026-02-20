// dashboard/src/app/(dashboard)/admin/users/[id]/page.tsx
"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Shield,
  User as UserIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { id: userId } = use(params);
  const { toast } = useToast();
  const { user: authUser } = useAuthStore();
  const isFinanceReadOnly = authUser?.role === "FINANCE";

  // ✅ FIX: Tambah staleTime & cacheTime untuk percepat loading
  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminService.users.getUserById(Number(userId)),
    staleTime: 1000 * 60 * 5, // Cache 5 menit
    gcTime: 1000 * 60 * 10, // Garbage collection 10 menit
    refetchOnWindowFocus: false, // ✅ Jangan refetch saat fokus window
  });

  const user = data?.data;

  // Role Badge Color
  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-800",
      FINANCE: "bg-green-100 text-green-800",
      STAFF: "bg-indigo-100 text-indigo-800",
      AGEN: "bg-blue-100 text-blue-800",
      JAMAAH: "bg-orange-100 text-orange-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          User Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mt-2">
          User dengan ID {userId} tidak ada dalam sistem
        </p>
        <Link href="/admin/users">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar User
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Detail User
            </h1>
            <p className="text-gray-600 mt-1">Informasi lengkap user</p>
          </div>
        </div>
        {!isFinanceReadOnly && (
          <Link href={`/admin/users/${userId}/edit`}>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{user.fullName}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                {user.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Nonaktif
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
                {user.isEmailVerified ? (
                  <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" /> Terverifikasi
                  </span>
                ) : (
                  <span className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <XCircle className="h-3 w-3" /> Belum Terverifikasi
                  </span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nomor HP</p>
                <p className="font-medium">{user.phone || "-"}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Terdaftar</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), "dd MMMM yyyy, HH:mm", {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info based on Role */}
      {user.role === "JAMAAH" && user.jamaahData && (
        <Card>
          <CardHeader>
            <CardTitle>Data Jamaah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status Data</p>
                <Badge
                  variant={
                    user.jamaahData.status === "COMPLETED"
                      ? "default"
                      : "secondary"
                  }
                >
                  {user.jamaahData.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paket</p>
                <p className="font-medium">
                  {user.jamaahData.package?.title || "Belum dipilih"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">NIK</p>
                <p className="font-medium">{user.jamaahData.nik || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">No. Paspor</p>
                <p className="font-medium">
                  {user.jamaahData.passportNumber || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user.role === "AGEN" && (
        <Card>
          <CardHeader>
            <CardTitle>Data Agen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Fitur data agen akan segera tersedia</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
