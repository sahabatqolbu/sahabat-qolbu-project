// dashboard/src/app/(mobile)/agen/profile/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Save,
  User,
  Phone,
  MapPin,
  CreditCard,
  Share2,
  Instagram,
  Facebook,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { BottomNav } from "@/components/mobile/BottomNav";

interface EditFormData {
  fullName: string;
  phone: string;
  nickname: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<EditFormData>();

  // ===== FETCH DATA =====
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
  });

  const profile = profileData?.data;
  const agentData = profile?.agentData;

  // ===== LOAD DATA =====
  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || "",
        phone: profile.phone || agentData?.phone || "",
        nickname: agentData?.nickname || "",
        address: agentData?.address || "",
        province: agentData?.province || "",
        city: agentData?.city || "",
        postalCode: agentData?.postalCode || "",
        instagram: agentData?.instagram || "",
        tiktok: agentData?.tiktok || "",
        facebook: agentData?.facebook || "",
        accountName: agentData?.accountName || "",
        accountNumber: agentData?.accountNumber || "",
        bankName: agentData?.bankName || "",
      });
    }
  }, [profile, agentData, reset]);

  // ===== MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      adminService.agenProfile.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      toast({ title: "Profil berhasil diperbarui" });
      router.push("/agen/profile");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: EditFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not approved
  if (agentData?.status !== "APPROVED") {
    router.push("/agen/profile");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 w-full md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-primary text-white p-6">
        <div className="flex items-center gap-3">
          <Link href="/agen/profile">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Edit Profil</h1>
            <p className="text-sm text-primary-100">Perbarui informasi Anda</p>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-xs text-blue-800">
          <strong>Catatan:</strong> Data KTP, Level, dan Tujuan Bergabung tidak
          dapat diubah. Hubungi admin jika ada kesalahan data.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
        {/* Nama & Kontak */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Nama Lengkap</Label>
              <Input
                {...register("fullName")}
                className="mt-1.5"
                placeholder="Nama lengkap Anda"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Nama Panggilan</Label>
              <Input
                {...register("nickname")}
                className="mt-1.5"
                placeholder="Nama panggilan"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">No. WhatsApp</Label>
              <Input
                {...register("phone")}
                className="mt-1.5"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              Alamat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Alamat Lengkap</Label>
              <Textarea
                {...register("address")}
                rows={3}
                className="mt-1.5 resize-none"
                placeholder="Jalan, RT/RW, Kelurahan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-600">Provinsi</Label>
                <Input {...register("province")} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Kota</Label>
                <Input {...register("city")} className="mt-1.5" />
              </div>
            </div>
            <div className="w-1/2">
              <Label className="text-sm text-gray-600">Kode Pos</Label>
              <Input
                {...register("postalCode")}
                className="mt-1.5"
                maxLength={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sosial Media */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Share2 className="h-4 w-4" />
              Sosial Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Instagram className="h-4 w-4" /> Instagram
              </Label>
              <Input
                {...register("instagram")}
                className="mt-1.5"
                placeholder="username (tanpa @)"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Facebook className="h-4 w-4" /> Facebook
              </Label>
              <Input
                {...register("facebook")}
                className="mt-1.5"
                placeholder="Nama profil"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">TikTok</Label>
              <Input
                {...register("tiktok")}
                className="mt-1.5"
                placeholder="username (tanpa @)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rekening Bank */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Building2 className="h-4 w-4" />
              Rekening Bank
            </CardTitle>
            <p className="text-xs text-gray-500">Untuk pencairan komisi</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Nama Bank</Label>
              <Input
                {...register("bankName")}
                className="mt-1.5"
                placeholder="BCA, BRI, Mandiri, dll"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                Nama Pemilik Rekening
              </Label>
              <Input
                {...register("accountName")}
                className="mt-1.5"
                placeholder="Sesuai buku tabungan"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Nomor Rekening</Label>
              <Input
                {...register("accountNumber")}
                className="mt-1.5"
                placeholder="Nomor rekening"
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 pb-6 md:px-8 z-50">
        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary-600"
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending || !isDirty}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      <BottomNav role="AGEN" />
    </div>
  );
}
