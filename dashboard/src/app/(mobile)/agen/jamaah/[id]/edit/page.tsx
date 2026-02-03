// dashboard/src/app/(mobile)/agen/jamaah/[id]/edit/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  MapPin,
  FileText,
  Phone,
  Package,
  Users,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { format } from "date-fns";
import Link from "next/link";

// Types
interface JamaahFormData {
  // Biodata
  namaPaspor: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;

  // Alamat
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;

  // Paspor
  passportNumber: string;
  passportIssuePlace: string;
  passportIssueDate: string;
  passportExpiry: string;

  // Emergency
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;

  // Paket
  packageId: string;
  roomTypeMakkah: string;
  roomTypeMadinah: string;

  // Mahram
  mahramId: string;
  mahramRelation: string;

  // Notes
  notes: string;
}

export default function EditJamaahPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [openSections, setOpenSections] = useState<string[]>(["biodata"]);

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<JamaahFormData>();

  // Fetch Jamaah Detail
  const { data: jamaahData, isLoading: jamaahLoading } = useQuery({
    queryKey: ["jamaah-detail", id],
    queryFn: () => agenService.getJamaahById(id),
    enabled: !!id,
  });

  const jamaah = jamaahData?.data;

  // Fetch Packages
const { data: packagesData } = useQuery({
  queryKey: ["packages-list"],
  queryFn: () => agenService.getPackages(),
});

// ✅ FIX: Handle different response structures
const packages = Array.isArray(packagesData?.data)
  ? packagesData.data
  : packagesData?.data?.packages || packagesData?.data?.data || [];

  // Populate form when data loads
  useEffect(() => {
    if (jamaah) {
      reset({
        namaPaspor: jamaah.namaPaspor || "",
        nik: jamaah.nik || "",
        birthPlace: jamaah.birthPlace || "",
        birthDate: jamaah.birthDate
          ? format(new Date(jamaah.birthDate), "yyyy-MM-dd")
          : "",
        gender: jamaah.gender || "",
        maritalStatus: jamaah.maritalStatus || "",
        address: jamaah.address || "",
        province: jamaah.province || "",
        city: jamaah.city || "",
        district: jamaah.district || "",
        postalCode: jamaah.postalCode || "",
        passportNumber: jamaah.passportNumber || "",
        passportIssuePlace: jamaah.passportIssuePlace || "",
        passportIssueDate: jamaah.passportIssueDate
          ? format(new Date(jamaah.passportIssueDate), "yyyy-MM-dd")
          : "",
        passportExpiry: jamaah.passportExpiry
          ? format(new Date(jamaah.passportExpiry), "yyyy-MM-dd")
          : "",
        emergencyName: jamaah.emergencyName || "",
        emergencyPhone: jamaah.emergencyPhone || "",
        emergencyRelation: jamaah.emergencyRelation || "",
        packageId: jamaah.packageId?.toString() || "",
        roomTypeMakkah: jamaah.roomTypeMakkah || "",
        roomTypeMadinah: jamaah.roomTypeMadinah || "",
        mahramId: jamaah.mahramId?.toString() || "",
        mahramRelation: jamaah.mahramRelation || "",
        notes: jamaah.notes || "",
      });
    }
  }, [jamaah, reset]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: JamaahFormData) => agenService.updateJamaah(id, data),
    onSuccess: () => {
      toast({
        title: "✅ Berhasil",
        description: "Data jamaah berhasil diupdate",
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["my-jamaah"] });
      router.push(`/agen/jamaah/${id}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Submit Handler
  const onSubmit = (data: JamaahFormData) => {
    // Clean empty strings to null for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );
    updateMutation.mutate(cleanedData as JamaahFormData);
  };

  // Check field completion
  const isFieldFilled = (value: any) => {
    return value && value !== "" && value !== null;
  };

  // Section completion status
  const getSectionStatus = (fields: string[]) => {
    const values = watch();
    const filled = fields.filter((f) =>
      isFieldFilled(values[f as keyof JamaahFormData]),
    ).length;
    return { filled, total: fields.length, complete: filled === fields.length };
  };

  const biodataStatus = getSectionStatus([
    "namaPaspor",
    "nik",
    "birthPlace",
    "birthDate",
    "gender",
    "maritalStatus",
  ]);
  const alamatStatus = getSectionStatus(["address", "province", "city"]);
  const pasporStatus = getSectionStatus([
    "passportNumber",
    "passportExpiry",
    "passportIssuePlace",
  ]);
  const emergencyStatus = getSectionStatus(["emergencyName", "emergencyPhone"]);
  const paketStatus = getSectionStatus([
    "packageId",
    "roomTypeMakkah",
    "roomTypeMadinah",
  ]);

  if (jamaahLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!jamaah) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Data tidak ditemukan</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:max-w-md lg:mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Edit Jamaah</h1>
            <p className="text-sm opacity-80 font-mono">
              {jamaah.bookingNumber}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-white text-blue-600 hover:bg-white/90"
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-3"
        >
          {/* ===== BIODATA ===== */}
          <AccordionItem value="biodata" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Data Pribadi</p>
                  <p className="text-xs text-gray-500">
                    {biodataStatus.filled}/{biodataStatus.total} terisi
                  </p>
                </div>
                {biodataStatus.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto mr-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaPaspor">
                    Nama Sesuai Paspor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaPaspor"
                    {...register("namaPaspor")}
                    placeholder="Nama lengkap sesuai paspor"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nik">
                    NIK <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nik"
                    {...register("nik")}
                    placeholder="16 digit NIK"
                    maxLength={16}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="birthPlace"
                      {...register("birthPlace")}
                      placeholder="Kota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      {...register("birthDate")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("gender")}
                      onValueChange={(val) =>
                        setValue("gender", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIA">Laki-laki</SelectItem>
                        <SelectItem value="WANITA">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Pernikahan</Label>
                    <Select
                      value={watch("maritalStatus")}
                      onValueChange={(val) =>
                        setValue("maritalStatus", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELUM_MENIKAH">
                          Belum Menikah
                        </SelectItem>
                        <SelectItem value="MENIKAH">Menikah</SelectItem>
                        <SelectItem value="CERAI">Cerai</SelectItem>
                        <SelectItem value="DUDA_JANDA">Duda/Janda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ===== ALAMAT ===== */}
          <AccordionItem value="alamat" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Alamat</p>
                  <p className="text-xs text-gray-500">
                    {alamatStatus.filled}/{alamatStatus.total} terisi
                  </p>
                </div>
                {alamatStatus.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto mr-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="Jalan, RT/RW, Kelurahan"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="province">
                      Provinsi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="province"
                      {...register("province")}
                      placeholder="Provinsi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Kota/Kabupaten <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Kota/Kab"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="district">Kecamatan</Label>
                    <Input
                      id="district"
                      {...register("district")}
                      placeholder="Kecamatan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      {...register("postalCode")}
                      placeholder="12345"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ===== PASPOR ===== */}
          <AccordionItem value="paspor" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Data Paspor</p>
                  <p className="text-xs text-gray-500">
                    {pasporStatus.filled}/{pasporStatus.total} terisi
                  </p>
                </div>
                {pasporStatus.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto mr-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">
                    Nomor Paspor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="passportNumber"
                    {...register("passportNumber")}
                    placeholder="A1234567"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportIssuePlace">
                    Tempat Terbit <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="passportIssuePlace"
                    {...register("passportIssuePlace")}
                    placeholder="Kantor Imigrasi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="passportIssueDate">Tanggal Terbit</Label>
                    <Input
                      id="passportIssueDate"
                      type="date"
                      {...register("passportIssueDate")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry">
                      Berlaku Sampai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="passportExpiry"
                      type="date"
                      {...register("passportExpiry")}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ===== KONTAK DARURAT ===== */}
          <AccordionItem
            value="emergency"
            className="border rounded-lg bg-white"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Kontak Darurat</p>
                  <p className="text-xs text-gray-500">
                    {emergencyStatus.filled}/{emergencyStatus.total} terisi
                  </p>
                </div>
                {emergencyStatus.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto mr-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">
                    Nama Kontak <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="emergencyName"
                    {...register("emergencyName")}
                    placeholder="Nama lengkap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">
                      No. HP <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencyPhone"
                      {...register("emergencyPhone")}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelation">Hubungan</Label>
                    <Input
                      id="emergencyRelation"
                      {...register("emergencyRelation")}
                      placeholder="Suami/Istri/Anak"
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ===== PAKET ===== */}
          <AccordionItem value="paket" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Paket Umrah</p>
                  <p className="text-xs text-gray-500">
                    {paketStatus.filled}/{paketStatus.total} terisi
                  </p>
                </div>
                {paketStatus.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500 ml-auto mr-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Pilih Paket <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("packageId")}
                    onValueChange={(val) =>
                      setValue("packageId", val, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket umrah" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          <div className="flex flex-col">
                            <span>{pkg.name}</span>
                            <span className="text-xs text-gray-500">
                              {pkg.type} •{" "}
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(pkg.discountPrice || pkg.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Kamar Makkah <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("roomTypeMakkah")}
                      onValueChange={(val) =>
                        setValue("roomTypeMakkah", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOUBLE">Double (2 orang)</SelectItem>
                        <SelectItem value="TRIPLE">Triple (3 orang)</SelectItem>
                        <SelectItem value="QUAD">Quad (4 orang)</SelectItem>
                        <SelectItem value="QUINT">Quint (5 orang)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Kamar Madinah <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("roomTypeMadinah")}
                      onValueChange={(val) =>
                        setValue("roomTypeMadinah", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOUBLE">Double (2 orang)</SelectItem>
                        <SelectItem value="TRIPLE">Triple (3 orang)</SelectItem>
                        <SelectItem value="QUAD">Quad (4 orang)</SelectItem>
                        <SelectItem value="QUINT">Quint (5 orang)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ===== MAHRAM (untuk wanita) ===== */}
          {watch("gender") === "WANITA" && (
            <AccordionItem
              value="mahram"
              className="border rounded-lg bg-white"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Data Mahram</p>
                    <p className="text-xs text-gray-500">
                      Wajib untuk jamaah wanita
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                    <p className="text-sm text-pink-800">
                      Jamaah wanita wajib didampingi mahram. Pilih jamaah lain
                      yang menjadi mahram.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Hubungan Mahram</Label>
                    <Select
                      value={watch("mahramRelation")}
                      onValueChange={(val) =>
                        setValue("mahramRelation", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hubungan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUAMI">Suami</SelectItem>
                        <SelectItem value="AYAH">Ayah</SelectItem>
                        <SelectItem value="ANAK">Anak Laki-laki</SelectItem>
                        <SelectItem value="SAUDARA_KANDUNG">
                          Saudara Kandung
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ===== CATATAN ===== */}
          <AccordionItem value="notes" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Catatan</p>
                  <p className="text-xs text-gray-500">Opsional</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Catatan khusus untuk jamaah ini..."
                  rows={4}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ===== DOKUMEN SECTION ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-cyan-500" />
              Upload Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Upload dokumen dilakukan terpisah. Klik tombol di bawah untuk
              upload.
            </p>
            <Link href={`/agen/jamaah/${id}/documents`}>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Kelola Dokumen
              </Button>
            </Link>

            {/* Quick Document Status */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { key: "fotoUrl", label: "Foto" },
                { key: "ktpUrl", label: "KTP" },
                { key: "kkUrl", label: "KK" },
                { key: "pasporUrl", label: "Paspor" },
              ].map((doc) => {
                const hasDoc = jamaah[doc.key as keyof typeof jamaah];
                return (
                  <div
                    key={doc.key}
                    className={`p-2 rounded-lg text-center ${
                      hasDoc
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {hasDoc ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                    <p className="text-xs mt-1 text-gray-600">{doc.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button (Bottom) */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </form>

      <BottomNav role="AGEN" />
    </div>
  );
}
