// dashboard/src/app/%28dashboard%29/admin/users/create/page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminService } from "@/services/adminService";
import { packageService, type Package } from "@/services/packageService";
import { useAuthStore } from "@/stores/authStore";
import {
  createUserSchema,
  CreateUserFormData,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  UserPlus,
  Copy,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";

interface CreatedUserResult {
  user: {
    fullName: string;
    email: string;
    jamaahCount?: number;
    bookingNumbers?: string[];
  };
}

function getErrorMessage(error: unknown) {
  const apiError = error as {
    message?: string;
    response?: { data?: { message?: string } };
  };

  return (
    apiError.response?.data?.message || apiError.message || "Terjadi kesalahan"
  );
}

export default function CreateUserPage() {
  const { toast } = useToast();
  const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(
    null,
  );
  const [isFamilyAccount, setIsFamilyAccount] = useState(false);
  const { user: authUser } = useAuthStore();
  const isStaff = authUser?.role === "STAFF";
  const isFinance = authUser?.role === "FINANCE";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      familyMembers: [],
    },
  });

  const {
    fields: familyMemberFields,
    append: appendFamilyMember,
    remove: removeFamilyMember,
  } = useFieldArray({
    control,
    name: "familyMembers",
  });

  const selectedRole = useWatch({ control, name: "role" });
  const accountHolderName = useWatch({ control, name: "fullName" });

  // Fetch packages (only if role is JAMAAH)
  const {
    data: packagesData,
    isLoading: packagesLoading,
    isError: packagesError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ["admin-packages", "user-create", "active"],
    queryFn: () =>
      packageService.getAll({ isActive: true, page: 1, limit: 100 }),
    enabled: selectedRole === "JAMAAH",
  });

  const packages: Package[] = packagesData?.data?.packages || [];

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      adminService.users.createUser(data),
    onSuccess: (data) => {
      setCreatedUser(data.data);
      toast({
        title: "✅ User Berhasil Dibuat!",
        description: `Akun ${data.data.user.fullName} telah dibuat.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Membuat User",
        description: getErrorMessage(error),
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    if (isFinance) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Finance tidak diizinkan membuat user baru.",
      });
      return;
    }

    if (isStaff && data.role !== "AGEN" && data.role !== "JAMAAH") {
      toast({
        variant: "destructive",
        title: "Role Tidak Diizinkan",
        description: "Staff hanya bisa membuat akun Agen atau Jamaah.",
      });
      return;
    }

    createMutation.mutate(data);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Berhasil Disalin",
      description: `${label} telah disalin ke clipboard`,
    });
  };

  const createAnother = () => {
    setCreatedUser(null);
    setIsFamilyAccount(false);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Tambah User Baru
          </h1>
          <p className="text-gray-600 mt-1">Buat akun user baru dalam sistem</p>
        </div>
      </div>

      {/* Success Card */}
      {createdUser && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              ✅ User Berhasil Dibuat!
            </CardTitle>
            <CardDescription className="text-green-700">
              Email berisi instruksi login telah dikirim ke{" "}
              <strong>{createdUser.user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ✅ INFO BOX (DI DALAM CONDITIONAL!) */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💌 <strong>Email Telah Dikirim!</strong>
                <br />
                Informasi login telah dikirim ke{" "}
                <strong>{createdUser.user.email}</strong>. Jika jamaah tidak
                menerima email dalam 5 menit, silakan cek folder spam.
              </AlertDescription>
            </Alert>

            {/* User data */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <Label className="text-sm text-gray-600">Email Login</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={createdUser.user.email}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(createdUser.user.email, "Email")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={createAnother} className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Buat User Lagi
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const message = `Assalamu'alaikum ${createdUser.user.fullName},\n\nAkun umrah Anda telah dibuat.\n\n📧 Email: ${createdUser.user.email}\n🔐 Password sudah dikirim melalui email (cek inbox/spam).\n\n🔗 Login di: dashboard.sahabatqolbu.com/login\n\nBarakallahu fiikum,\nSahabat Qolbu Travel`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(message)}`,
                    "_blank",
                  );
                }}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Kirim via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!createdUser && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informasi User</CardTitle>
              <CardDescription>Isi data user dengan lengkap</CardDescription>
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

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("role", value as CreateUserFormData["role"])
                  }
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Role --" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isStaff && !isFinance && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                    {!isStaff && !isFinance && (
                      <SelectItem value="FINANCE">Finance</SelectItem>
                    )}
                    {!isStaff && !isFinance && (
                      <SelectItem value="STAFF">Staff</SelectItem>
                    )}
                    <SelectItem value="AGEN">Agen</SelectItem>
                    <SelectItem value="JAMAAH">Jamaah</SelectItem>
                    {!isStaff && !isFinance && (
                      <SelectItem value="CALON_JAMAAH">Calon Jamaah</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {selectedRole === "JAMAAH" && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <Label>Jenis Akun Jamaah</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={!isFamilyAccount ? "default" : "outline"}
                        onClick={() => {
                          setIsFamilyAccount(false);
                          setValue("familyMembers", []);
                        }}
                      >
                        Perorangan
                      </Button>
                      <Button
                        type="button"
                        variant={isFamilyAccount ? "default" : "outline"}
                        onClick={() => {
                          setIsFamilyAccount(true);
                          if (familyMemberFields.length === 0) {
                            appendFamilyMember({
                              fullName: "",
                              relationship: "PASANGAN",
                            });
                          }
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Keluarga/Rombongan
                      </Button>
                    </div>
                  </div>

                  {isFamilyAccount && (
                    <div className="space-y-3">
                      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        <strong>{accountHolderName || "Pemilik akun"}</strong>{" "}
                        menjadi anggota utama. Semua anggota memakai satu email
                        dan satu akun login, tetapi memiliki booking, biodata,
                        dokumen, dan status masing-masing.
                      </div>

                      {familyMemberFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-[1fr_180px_auto] md:items-start"
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor={`familyMembers.${index}.fullName`}>
                              Nama Anggota {index + 2}
                            </Label>
                            <Input
                              id={`familyMembers.${index}.fullName`}
                              placeholder="Nama lengkap anggota"
                              {...register(`familyMembers.${index}.fullName`)}
                            />
                            {errors.familyMembers?.[index]?.fullName && (
                              <p className="text-xs text-red-500">
                                {errors.familyMembers[index]?.fullName?.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label>Hubungan</Label>
                            <Select
                              defaultValue={field.relationship || "PASANGAN"}
                              onValueChange={(value) =>
                                setValue(
                                  `familyMembers.${index}.relationship`,
                                  value,
                                  { shouldValidate: true },
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih hubungan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PASANGAN">
                                  Pasangan
                                </SelectItem>
                                <SelectItem value="ANAK">Anak</SelectItem>
                                <SelectItem value="ORANG_TUA">
                                  Orang Tua
                                </SelectItem>
                                <SelectItem value="SAUDARA">Saudara</SelectItem>
                                <SelectItem value="KERABAT">Kerabat</SelectItem>
                                <SelectItem value="ROMBONGAN">
                                  Rombongan
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeFamilyMember(index)}
                            aria-label={`Hapus anggota ${index + 2}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-gray-600">
                          Total: {familyMemberFields.length + 1} jamaah /{" "}
                          {familyMemberFields.length + 1} seat
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            appendFamilyMember({
                              fullName: "",
                              relationship: "ANAK",
                            })
                          }
                          disabled={familyMemberFields.length >= 19}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Tambah Anggota
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Package (only for JAMAAH) */}
              {selectedRole === "JAMAAH" && (
                <div className="space-y-2">
                  <Label htmlFor="packageId">Paket Umrah</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("packageId", parseInt(value))
                    }
                    disabled={
                      createMutation.isPending ||
                      packagesLoading ||
                      packagesError
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          packagesLoading
                            ? "Memuat paket..."
                            : "-- Pilih Paket (Opsional) --"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {packagesLoading ? (
                        <div className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat paket...
                        </div>
                      ) : packages.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-gray-500 text-center">
                          Tidak ada paket aktif
                        </div>
                      ) : (
                        packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {/* ✅ FIX: title → name */}
                            {pkg.name} - Rp{" "}
                            {Number(pkg.price).toLocaleString("id-ID")}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {packagesLoading ? (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengambil daftar paket aktif...
                    </p>
                  ) : packagesError ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-red-600">
                      <span>Daftar paket gagal dimuat.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => refetchPackages()}
                      >
                        Coba lagi
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {packages.length > 0
                        ? `${packages.length} paket aktif tersedia`
                        : "Belum ada paket aktif. Jamaah tetap dapat dibuat tanpa memilih paket."}
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90"
                size="lg"
                disabled={createMutation.isPending || isFinance}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Buat User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Info */}
      <Alert>
        <AlertDescription>
          {isStaff
            ? "💡 Staff hanya bisa membuat akun Agen dan Jamaah."
            : "💡 Password akan di-generate otomatis dan dikirim via email"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
