// dashboard/src/app/(dashboard)/admin/users/[id]/edit/page.tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminService } from "@/services/adminService";
import {
  updateUserSchema,
  UpdateUserFormData,
} from "@/lib/schemas/user-schema";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: PageProps) {
  const { id: userId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => adminService.users.getUserById(Number(userId)),
    staleTime: 1000 * 60 * 5,
  });

  const user = data?.data;

  // ✅ DEBUG: Log data dari API
  useEffect(() => {
    if (user) {
      console.log("📦 User data dari API:", user);
      console.log("🔑 Role value:", user.role);
      console.log("🔑 Role type:", typeof user.role);
    }
  }, [user]);

  // ✅ FIX: Populate form dengan normalisasi role
  useEffect(() => {
    if (user) {
      const normalizedRole = user.role?.toUpperCase() || "JAMAAH"; // ✅ Force uppercase

      console.log("🔄 Setting form values...");
      console.log("  - fullName:", user.fullName);
      console.log("  - phone:", user.phone);
      console.log("  - role (original):", user.role);
      console.log("  - role (normalized):", normalizedRole);
      console.log("  - isActive:", user.isActive);

      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        role: normalizedRole as any,
        isActive: user.isActive ?? true,
      });

      // ✅ DOUBLE SET untuk memastikan
      setTimeout(() => {
        setValue("role", normalizedRole as any, { shouldValidate: true });
        console.log("✅ Role set to:", normalizedRole);
      }, 100);
    }
  }, [user, reset, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserFormData) => {
      console.log("📤 Sending update:", data);
      return adminService.users.updateUser(Number(userId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast({
        title: "✅ User Berhasil Diupdate",
        description: "Data user telah diperbarui",
      });
      router.push(`/admin/users/${userId}`);
    },
    onError: (error: any) => {
      console.error("❌ Update error:", error);
      toast({
        variant: "destructive",
        title: "❌ Gagal Update User",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: UpdateUserFormData) => {
    console.log("📤 Form submitted:", data);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User tidak ditemukan</p>
        <Link href="/admin/users">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/users/${userId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Edit User
          </h1>
          <p className="text-gray-600 mt-1">Ubah data {user.fullName}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi User</CardTitle>
            <CardDescription>
              Perbarui informasi user sesuai kebutuhan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ✅ DEBUG RAW DATA (Hapus setelah fix) */}
            {/* <div className="text-xs text-gray-500 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="font-bold mb-2">🔍 Raw User Data dari API:</p>
              <pre className="overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div> */}

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Nama lengkap"
                {...register("fullName")}
                disabled={updateMutation.isPending}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                {...register("phone")}
                disabled={updateMutation.isPending}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("role") || ""} // ✅ Fallback ke empty string
                onValueChange={(value) => {
                  console.log(
                    "🔄 Role changed from",
                    watch("role"),
                    "to",
                    value
                  );
                  setValue("role", value as any, { shouldValidate: true });
                }}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="AGEN">Agen</SelectItem>
                  <SelectItem value="JAMAAH">Jamaah</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>

            {/* Status Active */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  User yang nonaktif tidak dapat login
                </p>
              </div>
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => {
                  setValue("isActive", checked, { shouldValidate: true });
                }}
                disabled={updateMutation.isPending}
              />
            </div>

            {/* ✅ DEBUG FORM VALUES */}
            {/* <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-bold mb-2">🔍 Current Form Values:</p>
              <pre>{JSON.stringify(watch(), null, 2)}</pre>
            </div> */}

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-secondary hover:bg-secondary/90"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
              <Link href={`/admin/users/${userId}`}>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
