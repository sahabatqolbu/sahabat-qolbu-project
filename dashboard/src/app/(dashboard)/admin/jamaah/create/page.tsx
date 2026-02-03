// dashboard/src/app/(dashboard)/admin/jamaah/create/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { jamaahService } from "@/services/jamaahService";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2, UserPlus, Package } from "lucide-react";
import Link from "next/link";

// ===== VALIDATION SCHEMA =====
const createJamaahSchema = z.object({
  userMode: z.enum(["existing", "new"]),
  userId: z.number().optional(),
  fullName: z.string().min(3, "Nama minimal 3 karakter").optional(),
  email: z.string().email("Email tidak valid").optional(),
  phone: z.string().min(10, "No HP minimal 10 digit").optional(),
  // Note: Pake 'message' biar aman dari Zod version conflict
  packageId: z.number({ message: "Paket wajib dipilih" }),
  namaMitra: z.string().min(2, "Nama mitra wajib diisi"),
  notePaket: z.enum(["FULLSERVICE", "EXTREME", "KONSORSIUM", "B2B"]),
  roomTypeMakkah: z.enum(["DOUBLE", "TRIPLE", "QUAD", "QUINT"]).optional(),
  roomTypeMadinah: z.enum(["DOUBLE", "TRIPLE", "QUAD", "QUINT"]).optional(),
  hargaPaket: z.number().min(0),
  potonganFeeAgen: z.number().min(0).default(0),
  potonganPoinAgen: z.number().min(0).default(0),
  potonganCashbackKK: z.number().min(0).default(0),
});

type CreateJamaahForm = z.infer<typeof createJamaahSchema>;

export default function CreateJamaahPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userMode, setUserMode] = useState<"existing" | "new">("new");

  // FIXED: Hapus generic <CreateJamaahForm> biar ga konflik sama defaultValues yg kosong
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createJamaahSchema),
    defaultValues: {
      userMode: "new",
      notePaket: "FULLSERVICE",
      hargaPaket: 0,
      potonganFeeAgen: 0,
      potonganPoinAgen: 0,
      potonganCashbackKK: 0,
    },
  });

  // ===== FETCH PACKAGES =====
  const {
    data: packagesData,
    isLoading: packagesLoading,
    error: packagesError,
  } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await api.get("/admin/packages");
      return response.data;
    },
  });

  // SAFE ARRAY CHECK
  const packages = Array.isArray(packagesData?.data) ? packagesData.data : [];

  // ===== FETCH USERS (Jamaah Role) =====
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-jamaah"],
    queryFn: async () => {
      const response = await api.get("/admin/users?role=JAMAAH");
      return response.data;
    },
    enabled: userMode === "existing",
  });

  // SAFE ARRAY CHECK
  const jamaahUsers = Array.isArray(usersData?.data) ? usersData.data : [];

  // ===== AUTO FILL HARGA PAKET =====
  const selectedPackageId = watch("packageId");

  useEffect(() => {
    if (selectedPackageId && packages.length > 0) {
      const pkg = packages.find((p: any) => p.id === selectedPackageId);
      if (pkg) {
        setValue("hargaPaket", parseFloat(pkg.price) || 0);
      }
    }
  }, [selectedPackageId, packages, setValue]);

  // ===== AUTO CALCULATE HARGA FINAL =====
  const hargaPaket = watch("hargaPaket") || 0;
  const potonganFeeAgen = watch("potonganFeeAgen") || 0;
  const potonganPoinAgen = watch("potonganPoinAgen") || 0;
  const potonganCashbackKK = watch("potonganCashbackKK") || 0;

  const hargaFinal = Math.max(
    0,
    hargaPaket - potonganFeeAgen - potonganPoinAgen - potonganCashbackKK,
  );

  // ===== CREATE MUTATION =====
  const createMutation = useMutation({
    // Perlu casting 'any' atau sesuaikan type manual karena generic useForm dihapus
    mutationFn: (data: any) => {
      const payload = {
        createNewUser: data.userMode === "new",
        userId: data.userMode === "existing" ? data.userId : undefined,
        fullName: data.userMode === "new" ? data.fullName : undefined,
        email: data.userMode === "new" ? data.email : undefined,
        phone: data.userMode === "new" ? data.phone : undefined,
        packageId: data.packageId,
        namaMitra: data.namaMitra,
        notePaket: data.notePaket,
        roomTypeMakkah: data.roomTypeMakkah,
        roomTypeMadinah: data.roomTypeMadinah,
        hargaPaket: data.hargaPaket,
        potonganFeeAgen: data.potonganFeeAgen,
        potonganPoinAgen: data.potonganPoinAgen,
        potonganCashbackKK: data.potonganCashbackKK,
      };
      return jamaahService.create(payload);
    },
    onSuccess: (response) => {
      toast({
        title: "✅ Booking Berhasil Dibuat",
        description: `Booking Number: ${response.data.bookingNumber}`,
      });
      router.push(`/admin/jamaah/${response.data.bookingNumber}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Membuat Booking",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/jamaah">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold">Tambah Jamaah Baru</h1>
          <p className="text-gray-600">Buat booking jamaah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <div className="grid gap-6">
          {/* STEP 1: USER SELECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Step 1: Pilih/Buat Akun Jamaah
              </CardTitle>
              <CardDescription>
                Pilih user existing atau buat akun baru
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={userMode}
                onValueChange={(val: "existing" | "new") => {
                  setUserMode(val);
                  setValue("userMode", val);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">Buat Akun Baru</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing">Pilih User Existing</Label>
                </div>
              </RadioGroup>

              {userMode === "new" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input {...register("fullName")} placeholder="Ahmad Zaki" />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">
                        {errors.fullName.message as string}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="ahmad@mail.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message as string}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      No HP <span className="text-red-500">*</span>
                    </Label>
                    <Input {...register("phone")} placeholder="081234567890" />
                    {errors.phone && (
                      <p className="text-sm text-red-500">
                        {errors.phone.message as string}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>
                    Pilih User Jamaah <span className="text-red-500">*</span>
                  </Label>
                  {usersLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      onValueChange={(val) => setValue("userId", parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih User --" />
                      </SelectTrigger>
                      <SelectContent>
                        {jamaahUsers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Tidak ada user jamaah
                          </SelectItem>
                        ) : (
                          jamaahUsers.map((user: any) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                            >
                              {user.fullName} - {user.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 2: BOOKING INFO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Step 2: Info Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Paket <span className="text-red-500">*</span>
                  </Label>

                  {/* LOADING STATE */}
                  {packagesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : packagesError ? (
                    <div className="text-red-500 text-sm">
                      Gagal memuat paket. Coba refresh halaman.
                    </div>
                  ) : (
                    <Select
                      onValueChange={(val) =>
                        setValue("packageId", parseInt(val))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih Paket --" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Tidak ada paket tersedia
                          </SelectItem>
                        ) : (
                          packages.map((pkg: any) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name} -{" "}
                              {formatRupiah(parseFloat(pkg.price) || 0)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  {errors.packageId && (
                    <p className="text-sm text-red-500">
                      {errors.packageId.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Nama Mitra/Kantor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("namaMitra")}
                    placeholder="Kantor Pusat / Agen XYZ"
                  />
                  {errors.namaMitra && (
                    <p className="text-sm text-red-500">
                      {errors.namaMitra.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note Paket</Label>
                <Select
                  value={watch("notePaket")}
                  onValueChange={(val: any) => setValue("notePaket", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULLSERVICE">Fullservice</SelectItem>
                    <SelectItem value="EXTREME">Extreme</SelectItem>
                    <SelectItem value="KONSORSIUM">Konsorsium</SelectItem>
                    <SelectItem value="B2B">B2B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* STEP 3: ROOM TYPE */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Tipe Kamar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kamar Makkah</Label>
                  <Select
                    onValueChange={(val: any) =>
                      setValue("roomTypeMakkah", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Tipe --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOUBLE">Double (2 org)</SelectItem>
                      <SelectItem value="TRIPLE">Triple (3 org)</SelectItem>
                      <SelectItem value="QUAD">Quad (4 org)</SelectItem>
                      <SelectItem value="QUINT">Quint (5 org)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kamar Madinah</Label>
                  <Select
                    onValueChange={(val: any) =>
                      setValue("roomTypeMadinah", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Tipe --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOUBLE">Double (2 org)</SelectItem>
                      <SelectItem value="TRIPLE">Triple (3 org)</SelectItem>
                      <SelectItem value="QUAD">Quad (4 org)</SelectItem>
                      <SelectItem value="QUINT">Quint (5 org)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STEP 4: PRICING (ADMIN ONLY) */}
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">
                Step 4: Pricing (Admin Only)
              </CardTitle>
              <CardDescription>Harga & Potongan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga Paket</Label>
                  <Input
                    type="number"
                    {...register("hargaPaket", { valueAsNumber: true })}
                    readOnly
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Auto dari paket yang dipilih
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Potongan Fee Agen</Label>
                  <Input
                    type="number"
                    {...register("potonganFeeAgen", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Potongan Poin Agen</Label>
                  <Input
                    type="number"
                    {...register("potonganPoinAgen", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Potongan Cashback KK</Label>
                  <Input
                    type="number"
                    {...register("potonganCashbackKK", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* HARGA FINAL */}
              <div className="p-4 bg-white rounded-lg border-2 border-green-500">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Harga Final:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatRupiah(hargaFinal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SUBMIT */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-secondary hover:bg-secondary/90"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Simpan & Kirim Email
                </>
              )}
            </Button>
            <Link href="/admin/jamaah" className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
              >
                Batal
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
