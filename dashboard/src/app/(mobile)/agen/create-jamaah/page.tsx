"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agenService } from "@/services/agenService";
import {
  createJamaahSchema,
  CreateJamaahFormData,
} from "@/lib/schemas/jamaah-schema";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";

export default function CreateJamaahPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [createdAccount, setCreatedAccount] = useState<any>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateJamaahFormData>({
    resolver: zodResolver(createJamaahSchema),
  });

  const selectedPackageId = watch("packageId");

  // Fetch packages
  const { data: packagesData, isLoading: isLoadingPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: agenService.getPackages,
  });

  const packages = packagesData?.data || [];

  // Create Jamaah Mutation
  const createMutation = useMutation({
    mutationFn: agenService.createJamaah,
    onSuccess: (data) => {
      setCreatedAccount(data.data);

      toast({
        title: "✅ Akun Jamaah Berhasil Dibuat!",
        description: `Akun untuk ${data.data.user.fullName} telah dibuat.`,
      });

      // Scroll to credentials
      setTimeout(() => {
        document.getElementById("credentials-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 300);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Membuat Akun",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Submit Handler
  const onSubmit = (data: CreateJamaahFormData) => {
    createMutation.mutate(data);
  };

  // Copy to Clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Berhasil Disalin",
      description: `${label} telah disalin ke clipboard`,
    });
  };

  // Create Another
  const createAnother = () => {
    setCreatedAccount(null);
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/agen">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Buat Akun Jamaah Baru
          </h1>
          <p className="text-gray-600 mt-1">
            Daftarkan jamaah baru dan dapatkan komisi
          </p>
        </div>
      </div>

      {/* Success Card */}
      {createdAccount && (
        <Card id="credentials-section" className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Akun Berhasil Dibuat!
            </CardTitle>
            <CardDescription className="text-green-700">
              Akun berhasil dibuat. Password telah dikirim ke email jamaah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <Label className="text-sm text-gray-600">Email Login</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={createdAccount.user.email}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(createdAccount.user.email, "Email")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <Alert>
              <AlertDescription className="text-sm">
                📧 Email berisi kredensial login telah dikirim ke{" "}
                <strong>{createdAccount.user.email}</strong>. Password tidak
                ditampilkan di dashboard demi keamanan.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={createAnother} className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Buat Akun Lagi
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/agen/jamaah")}
              >
                Lihat Daftar Jamaah
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!createdAccount && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Jamaah</CardTitle>
              <CardDescription>
                Isi data jamaah dengan lengkap dan benar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Contoh: Ahmad Fauzi"
                  {...register("fullName")}
                  disabled={createMutation.isPending}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  {...register("email")}
                  disabled={createMutation.isPending}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Email ini akan digunakan untuk login
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Nomor HP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="08123456789"
                  {...register("phone")}
                  disabled={createMutation.isPending}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Package Selection */}
              <div className="space-y-2">
                <Label htmlFor="packageId">
                  Pilih Paket <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("packageId", parseInt(value))
                  }
                  disabled={createMutation.isPending || isLoadingPackages}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Paket Umrah --" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPackages ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Memuat paket...
                      </div>
                    ) : packages.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Belum ada paket tersedia
                      </div>
                    ) : (
                      packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pkg.title}</span>
                            <span className="text-xs text-gray-500">
                              {pkg.duration} Hari • Rp{" "}
                              {pkg.price.toLocaleString("id-ID")} • Sisa{" "}
                              {pkg.availableSeats} seat
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.packageId && (
                  <p className="text-sm text-red-500">
                    {errors.packageId.message}
                  </p>
                )}
              </div>

              {/* Package Preview */}
              {selectedPackageId && (
                <Alert>
                  <AlertDescription>
                    {(() => {
                      const selected = packages.find(
                        (p: any) => p.id === selectedPackageId
                      );
                      return selected ? (
                        <div className="space-y-1">
                          <p className="font-semibold">{selected.title}</p>
                          <p className="text-sm">
                            📅{" "}
                            {new Date(
                              selected.departureDate
                            ).toLocaleDateString("id-ID")}{" "}
                            -
                            {new Date(selected.returnDate).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                          <p className="text-sm">
                            💰 Harga:{" "}
                            <strong>
                              Rp {selected.price.toLocaleString("id-ID")}
                            </strong>
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  rows={3}
                  {...register("notes")}
                  disabled={createMutation.isPending}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90"
                size="lg"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Akun...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Buat Akun Jamaah
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Informasi Penting
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Password akan di-generate otomatis oleh sistem</li>
            <li>Email berisi kredensial login akan dikirim ke jamaah</li>
            <li>Jamaah dapat login dan melengkapi biodata sendiri</li>
            <li>
              Anda akan mendapat komisi setelah jamaah menyelesaikan pembayaran
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
