// dashboard/src/app/(mobile)/agen/jamaah/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { agenService } from "@/services/agenService";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  Package,
  Info,
  Calendar,
  Users,
  Plane,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/mobile/BottomNav";
import { ProfileGuard } from "@/components/agen/ProfileGuard";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  packageId: string;
  roomType: string;
}

export default function CreateJamaahPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      roomType: "QUAD",
    },
  });

  const selectedPackageId = watch("packageId");

  // ===== FETCH PACKAGES =====
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: () => agenService.getPackages(),
  });

  // ✅ FIX: Safely extract packages array
  const packages = packagesData?.data?.packages || [];

  // ✅ FIX: Find selected package with correct field
  const selectedPackage = packages.find(
    (p: any) => p.id.toString() === selectedPackageId,
  );

  // ✅ Helper: Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  // ✅ Helper: Format date
  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: localeId });
  };

  // ===== CREATE MUTATION =====
  const createMutation = useMutation({
    mutationFn: (data: any) => agenService.createJamaah(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["my-jamaah"] });
      toast({
        title: "✅ Jamaah Berhasil Didaftarkan!",
        description: `Booking: ${response.data.bookingNumber}`,
      });

      setTimeout(() => {
        router.push("/agen/jamaah");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Mendaftarkan",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      packageId: data.packageId ? parseInt(data.packageId) : undefined,
      roomType: data.roomType,
    });
  };

  return (
    <ProfileGuard requireComplete={true}>
      <div className="min-h-screen bg-gray-50 pb-28 w-full md:max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/agen/jamaah">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-7 w-7" />
                Daftar Jamaah Baru
              </h1>
              <p className="text-sm opacity-90 mt-1">
                Buat akun untuk calon jamaah Anda
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-4 -mt-4 mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <strong>Info:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                  <li>Akun jamaah otomatis dibuat</li>
                  <li>Password dikirim via email</li>
                  <li>Jamaah bisa login & lengkapi data sendiri</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-4">
          {/* Data Jamaah */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Jamaah</CardTitle>
              <CardDescription>Informasi dasar calon jamaah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("fullName", {
                    required: "Nama wajib diisi",
                  })}
                  placeholder="Nama sesuai KTP"
                  className="mt-1"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("email", {
                    required: "Email wajib diisi",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email tidak valid",
                    },
                  })}
                  type="email"
                  placeholder="email@example.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Password akan dikirim ke email ini
                </p>
              </div>

              <div>
                <Label className="text-sm">
                  No. HP <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("phone", {
                    required: "No. HP wajib diisi",
                  })}
                  placeholder="08xxxxxxxxxx"
                  className="mt-1"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pilih Paket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pilih Paket (Opsional)
              </CardTitle>
              <CardDescription>Bisa dipilih nanti oleh jamaah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {packagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Tidak ada paket tersedia</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-sm">Paket</Label>
                    <Select
                      value={selectedPackageId}
                      onValueChange={(value) => setValue("packageId", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih paket (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {/* ✅ FIX: Use correct field names */}
                            {pkg.name} -{" "}
                            {formatCurrency(pkg.discountPrice || pkg.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPackageId && (
                    <div>
                      <Label className="text-sm">Tipe Kamar</Label>
                      <Select
                        value={watch("roomType")}
                        onValueChange={(value) => setValue("roomType", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUINT">Quint (5 orang)</SelectItem>
                          <SelectItem value="QUAD">Quad (4 orang)</SelectItem>
                          <SelectItem value="TRIPLE">
                            Triple (3 orang)
                          </SelectItem>
                          <SelectItem value="DOUBLE">
                            Double (2 orang)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* ✅ FIX: Selected Package Preview with correct fields */}
                  {selectedPackage && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="font-semibold text-gray-900 mb-3">
                        {selectedPackage.name}
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>
                            Keberangkatan:{" "}
                            {formatDate(selectedPackage.departureDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-blue-600" />
                          <span>
                            {selectedPackage.airline?.name ||
                              "Maskapai belum ditentukan"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>
                            Sisa kursi:{" "}
                            {selectedPackage.remainingSeats ||
                              selectedPackage.totalSeats -
                                selectedPackage.bookedSeats}
                            /{selectedPackage.totalSeats}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Harga:</span>
                          <div className="text-right">
                            {selectedPackage.discountPrice &&
                              parseFloat(selectedPackage.discountPrice) <
                                parseFloat(selectedPackage.price) && (
                                <p className="text-xs text-gray-400 line-through">
                                  {formatCurrency(selectedPackage.price)}
                                </p>
                              )}
                            <p className="font-bold text-blue-600">
                              {formatCurrency(
                                selectedPackage.discountPrice ||
                                  selectedPackage.price,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-20">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg h-14 text-lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Daftarkan Jamaah
                </>
              )}
            </Button>
          </div>
        </form>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}
