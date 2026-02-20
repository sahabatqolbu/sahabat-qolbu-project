// dashboard/src/app/(dashboard)/admin/jamaah/[bookingNumber]/edit/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jamaahService } from "@/services/jamaahService";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  FileText,
  Package,
  CreditCard,
  MapPin,
  Phone,
  XCircle,
  Check,
  ChevronsUpDown,
  Search,
  UserCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  // Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;

  // Paket
  packageId: string;
  agenId: string; // ✅ Ganti namaMitra jadi agenId
  notePaket: string;
  roomTypeMakkah: string;
  roomTypeMadinah: string;

  // Pricing
  hargaPaket: string;
  potonganFeeAgen: string;
  potonganPoinAgen: string;
  potonganCashbackKK: string;

  // Status
  registrationStatus: string;

  // Mahram
  mahramId: string;
  mahramRelation: string;

  // Notes
  notes: string;
}

// Interface untuk Agen
interface AgenData {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  currentStar: number;
  status: string;
  namaMitra?: string;
  referralCode?: string;
}

interface PackageOption {
  id: number;
  name: string;
  price?: string;
  discountPrice?: string;
}

interface MahramOption {
  id: number;
  bookingNumber: string;
  namaPaspor?: string;
  fullName?: string;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Terjadi kesalahan";
};

export default function EditJamaahPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const bookingNumber = params.bookingNumber as string;
  const roleBasePath =
    user?.role === "FINANCE" ? "/finance" : user?.role === "STAFF" ? "/staff" : "/admin";
  const jamaahBasePath = `${roleBasePath}/jamaah`;

  // State untuk Agen Combobox
  const [agenOpen, setAgenOpen] = useState(false);
  const [agenSearch, setAgenSearch] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<JamaahFormData>();

  // =====================================================
  // FETCH JAMAAH DETAIL
  // =====================================================
  const { data: jamaahResponse, isLoading: jamaahLoading } = useQuery({
    queryKey: ["jamaah-detail", bookingNumber],
    queryFn: () => jamaahService.getByBookingNumber(bookingNumber),
    enabled: !!bookingNumber,
  });

  const jamaah = jamaahResponse?.data;

  // =====================================================
  // FETCH PACKAGES (for dropdown)
  // =====================================================
  const { data: packagesResponse, isLoading: packagesLoading } = useQuery({
    queryKey: ["packages-dropdown"],
    queryFn: async () => {
      const response = await api.get("/packages");
      console.log("📦 Packages API response:", response.data);
      return response.data;
    },
  });

  const packages: PackageOption[] = Array.isArray(packagesResponse?.data?.packages)
    ? (packagesResponse.data.packages as PackageOption[])
    : [];

  // =====================================================
  // FETCH AGEN LIST (for dropdown) ✅ NEW
  // =====================================================
  const { data: agenResponse, isLoading: agenLoading } = useQuery({
    queryKey: ["agen-list-dropdown"],
    queryFn: async () => {
      const response = await adminService.agen.getAll({ status: "APPROVED" });
      console.log("👤 Agen API response:", response);
      return response;
    },
  });

  // Extract agen list
  const agenList: AgenData[] = agenResponse?.data || [];
  console.log("👤 Extracted agen list:", agenList);

  // Filter agen berdasarkan search
  const filteredAgen = agenList.filter((agen) => {
    if (!agenSearch) return true;
    const searchLower = agenSearch.toLowerCase();
    return (
      agen.fullName?.toLowerCase().includes(searchLower) ||
      agen.email?.toLowerCase().includes(searchLower) ||
      agen.phone?.includes(searchLower) ||
      agen.referralCode?.toLowerCase().includes(searchLower)
    );
  });

  // =====================================================
  // FETCH OTHER JAMAAH (for mahram dropdown)
  // =====================================================
  const { data: allJamaahResponse } = useQuery({
    queryKey: ["jamaah-all-for-mahram"],
    queryFn: () => jamaahService.getAll({}),
  });

  const allJamaah: MahramOption[] = Array.isArray(allJamaahResponse?.data)
    ? (allJamaahResponse.data as MahramOption[]).filter(
        (j) => j.bookingNumber !== bookingNumber,
      )
    : [];

  // =====================================================
  // POPULATE FORM WHEN DATA LOADS
  // =====================================================
  useEffect(() => {
    if (jamaah) {
      const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split("T")[0];
      };

      reset({
        // Biodata
        namaPaspor: jamaah.namaPaspor || "",
        nik: jamaah.nik || "",
        birthPlace: jamaah.birthPlace || "",
        birthDate: formatDateForInput(jamaah.birthDate),
        gender: jamaah.gender || "",
        maritalStatus: jamaah.maritalStatus || "",

        // Alamat
        address: jamaah.address || "",
        province: jamaah.province || "",
        city: jamaah.city || "",
        district: jamaah.district || "",
        postalCode: jamaah.postalCode || "",

        // Paspor
        passportNumber: jamaah.passportNumber || "",
        passportIssuePlace: jamaah.passportIssuePlace || "",
        passportIssueDate: formatDateForInput(jamaah.passportIssueDate),
        passportExpiry: formatDateForInput(jamaah.passportExpiry),

        // Emergency
        emergencyName: jamaah.emergencyName || "",
        emergencyPhone: jamaah.emergencyPhone || "",
        emergencyRelation: jamaah.emergencyRelation || "",

        // Paket
        packageId: jamaah.packageId?.toString() || "",
        agenId: jamaah.agenId?.toString() || "", // ✅ Ganti namaMitra
        notePaket: jamaah.notePaket || "FULLSERVICE",
        roomTypeMakkah: jamaah.roomTypeMakkah || "",
        roomTypeMadinah: jamaah.roomTypeMadinah || "",

        // Pricing
        hargaPaket: jamaah.hargaPaket || "0",
        potonganFeeAgen: jamaah.potonganFeeAgen || "0",
        potonganPoinAgen: jamaah.potonganPoinAgen || "0",
        potonganCashbackKK: jamaah.potonganCashbackKK || "0",

        // Status
        registrationStatus: jamaah.registrationStatus || "DRAFT",

        // Mahram
        mahramId: jamaah.mahramId?.toString() || "",
        mahramRelation: jamaah.mahramRelation || "",

        // Notes
        notes: jamaah.notes || "",
      });
    }
  }, [jamaah, reset]);

  // =====================================================
  // AUTO-FILL HARGA SAAT PAKET DIPILIH
  // =====================================================
  const selectedPackageId = watch("packageId");
  const selectedAgenId = watch("agenId");

  useEffect(() => {
    if (
      selectedPackageId &&
      selectedPackageId !== "none" &&
      selectedPackageId !== "" &&
      packages.length > 0
    ) {
      const selectedPackage = packages.find(
        (pkg) => pkg.id.toString() === selectedPackageId,
      );

      if (selectedPackage) {
        console.log("📦 Selected package for auto-fill:", selectedPackage);

        const harga = selectedPackage.discountPrice
          ? parseFloat(selectedPackage.discountPrice)
          : parseFloat(selectedPackage.price) || 0;

        setValue("hargaPaket", harga.toString(), { shouldDirty: true });

        toast({
          title: "📦 Paket Dipilih",
          description: `Harga paket: ${formatRupiah(harga)}`,
        });
      }
    }
  }, [selectedPackageId, packages, setValue, toast]);

  // =====================================================
  // GET SELECTED AGEN INFO
  // =====================================================
  const getSelectedAgen = () => {
    if (!selectedAgenId || selectedAgenId === "none" || selectedAgenId === "") {
      return null;
    }
    return agenList.find((a) => a.id.toString() === selectedAgenId);
  };

  const selectedAgen = getSelectedAgen();

  // =====================================================
  // UPDATE MUTATION
  // =====================================================
  const updateMutation = useMutation({
    mutationFn: (data: Partial<JamaahFormData>) =>
      jamaahService.update(bookingNumber, data),
    onSuccess: () => {
      toast({
        title: "✅ Data Berhasil Diupdate",
        description: "Perubahan telah disimpan",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-detail", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      router.push(`${jamaahBasePath}/${bookingNumber}`);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menyimpan",
        description: getErrorMessage(error),
      });
    },
  });

  // =====================================================
  // SUBMIT HANDLER
  // =====================================================
  const onSubmit = (data: JamaahFormData) => {
    const cleanData: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (
        value !== "" &&
        value !== null &&
        value !== undefined &&
        value !== "none"
      ) {
        cleanData[key] = value;
      }
      if (value === "none") {
        cleanData[key] = null;
      }
    });

    // Convert IDs ke number
    if (cleanData.packageId && cleanData.packageId !== null) {
      cleanData.packageId = parseInt(cleanData.packageId);
    }
    if (cleanData.mahramId && cleanData.mahramId !== null) {
      cleanData.mahramId = parseInt(cleanData.mahramId);
    }
    if (cleanData.agenId && cleanData.agenId !== null) {
      cleanData.agenId = parseInt(cleanData.agenId);
    }

    console.log("📤 Submitting:", cleanData);
    updateMutation.mutate(cleanData);
  };

  // =====================================================
  // CALCULATE HARGA FINAL
  // =====================================================
  const watchedPricing = watch([
    "hargaPaket",
    "potonganFeeAgen",
    "potonganPoinAgen",
    "potonganCashbackKK",
  ]);

  const calculateHargaFinal = () => {
    const harga = parseFloat(watchedPricing[0]) || 0;
    const fee = parseFloat(watchedPricing[1]) || 0;
    const poin = parseFloat(watchedPricing[2]) || 0;
    const cashback = parseFloat(watchedPricing[3]) || 0;
    return harga - fee - poin - cashback;
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // =====================================================
  // RENDER STAR RATING
  // =====================================================
  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
  };

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (jamaahLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================
  if (!jamaah) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          Data Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-6">
          Booking number &quot;{bookingNumber}&quot; tidak ditemukan
        </p>
        <Link href={jamaahBasePath}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`${jamaahBasePath}/${bookingNumber}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              Edit Data Jamaah
            </h1>
            <p className="text-gray-500 font-mono">{bookingNumber}</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={updateMutation.isPending || !isDirty}
          className="bg-primary"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="biodata" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full md:w-auto md:inline-flex">
            <TabsTrigger value="biodata" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Biodata</span>
            </TabsTrigger>
            <TabsTrigger value="alamat" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden md:inline">Alamat</span>
            </TabsTrigger>
            <TabsTrigger value="paket" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Paket</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Harga</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== BIODATA TAB ===== */}
          <TabsContent value="biodata" className="space-y-4">
            {/* Data Pribadi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Pribadi</CardTitle>
                <CardDescription>
                  Informasi sesuai dokumen resmi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Sesuai Paspor *</Label>
                    <Input
                      {...register("namaPaspor")}
                      placeholder="Nama lengkap sesuai paspor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIK *</Label>
                    <Input
                      {...register("nik")}
                      placeholder="16 digit NIK"
                      maxLength={16}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tempat Lahir</Label>
                    <Input
                      {...register("birthPlace")}
                      placeholder="Kota kelahiran"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Lahir</Label>
                    <Input type="date" {...register("birthDate")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select
                      value={watch("gender") || "none"}
                      onValueChange={(val) =>
                        setValue("gender", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Pilih --</SelectItem>
                        <SelectItem value="PRIA">Laki-laki</SelectItem>
                        <SelectItem value="WANITA">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status Pernikahan</Label>
                    <Select
                      value={watch("maritalStatus") || "none"}
                      onValueChange={(val) =>
                        setValue("maritalStatus", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Pilih --</SelectItem>
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
              </CardContent>
            </Card>

            {/* Data Paspor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Paspor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor Paspor</Label>
                    <Input
                      {...register("passportNumber")}
                      placeholder="Nomor paspor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempat Terbit</Label>
                    <Input
                      {...register("passportIssuePlace")}
                      placeholder="Kantor imigrasi"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Terbit</Label>
                    <Input type="date" {...register("passportIssueDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Masa Berlaku</Label>
                    <Input type="date" {...register("passportExpiry")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontak Darurat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kontak Darurat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input
                      {...register("emergencyName")}
                      placeholder="Nama kontak darurat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No. HP</Label>
                    <Input
                      {...register("emergencyPhone")}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hubungan</Label>
                    <Input
                      {...register("emergencyRelation")}
                      placeholder="Contoh: Istri, Anak"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mahram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Mahram</CardTitle>
                <CardDescription>
                  Untuk jamaah wanita yang membutuhkan mahram
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pilih Mahram</Label>
                    <Select
                      value={watch("mahramId") || "none"}
                      onValueChange={(val) =>
                        setValue("mahramId", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih Jamaah --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tidak Ada --</SelectItem>
                        {allJamaah.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Tidak ada jamaah lain
                          </SelectItem>
                        ) : (
                          allJamaah.map((j) => (
                            <SelectItem key={j.id} value={j.id.toString()}>
                              {j.namaPaspor || j.fullName} ({j.bookingNumber})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hubungan Mahram</Label>
                    <Select
                      value={watch("mahramRelation") || "none"}
                      onValueChange={(val) =>
                        setValue("mahramRelation", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tidak Ada --</SelectItem>
                        <SelectItem value="SUAMI">Suami</SelectItem>
                        <SelectItem value="ISTRI">Istri</SelectItem>
                        <SelectItem value="AYAH">Ayah</SelectItem>
                        <SelectItem value="IBU">Ibu</SelectItem>
                        <SelectItem value="ANAK">Anak</SelectItem>
                        <SelectItem value="SAUDARA_KANDUNG">
                          Saudara Kandung
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ALAMAT TAB ===== */}
          <TabsContent value="alamat">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alamat Lengkap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Textarea
                    {...register("address")}
                    placeholder="Alamat lengkap (jalan, RT/RW, kelurahan)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Input {...register("province")} placeholder="Provinsi" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kota/Kabupaten</Label>
                    <Input {...register("city")} placeholder="Kota/Kabupaten" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kecamatan</Label>
                    <Input {...register("district")} placeholder="Kecamatan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input
                      {...register("postalCode")}
                      placeholder="Kode pos"
                      maxLength={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== PAKET TAB ===== */}
          <TabsContent value="paket">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Paket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Package Select */}
                  <div className="space-y-2">
                    <Label>Pilih Paket</Label>
                    <Select
                      value={watch("packageId") || "none"}
                      onValueChange={(val) =>
                        setValue("packageId", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih Paket --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          -- Belum Pilih Paket --
                        </SelectItem>
                        {packagesLoading ? (
                          <SelectItem value="loading" disabled>
                            Memuat paket...
                          </SelectItem>
                        ) : packages.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Tidak ada paket tersedia
                          </SelectItem>
                        ) : (
                          packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name} -{" "}
                              {formatRupiah(
                                parseFloat(pkg.discountPrice || pkg.price)
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedPackageId &&
                      selectedPackageId !== "none" &&
                      packages.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {
                            packages.find(
                              (p) => p.id.toString() === selectedPackageId,
                            )?.name
                          }
                        </p>
                      )}
                  </div>

                  {/* ✅ AGEN SELECT - COMBOBOX dengan Search */}
                  <div className="space-y-2">
                    <Label>Pilih Agen</Label>
                    <Popover open={agenOpen} onOpenChange={setAgenOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={agenOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedAgen ? (
                            <div className="flex items-center gap-2 truncate">
                              <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="truncate">
                                {selectedAgen.fullName}
                              </span>
                              {selectedAgen.currentStar > 0 && (
                                <div className="flex-shrink-0">
                                  {renderStars(selectedAgen.currentStar)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              -- Pilih Agen --
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari nama, email, atau HP..."
                            value={agenSearch}
                            onValueChange={setAgenSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {agenLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Memuat agen...</span>
                                </div>
                              ) : (
                                <div className="py-6 text-center text-sm">
                                  Agen tidak ditemukan
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup heading="Agen Tersedia">
                              {/* Option untuk hapus pilihan */}
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setValue("agenId", "", { shouldDirty: true });
                                  setAgenOpen(false);
                                  setAgenSearch("");
                                }}
                              >
                                <div className="flex items-center gap-2 text-gray-500">
                                  <XCircle className="h-4 w-4" />
                                  <span>-- Tidak Ada Agen --</span>
                                </div>
                              </CommandItem>

                              {filteredAgen.map((agen) => (
                                <CommandItem
                                  key={agen.id}
                                  value={agen.id.toString()}
                                  onSelect={() => {
                                    setValue("agenId", agen.id.toString(), {
                                      shouldDirty: true,
                                    });
                                    setAgenOpen(false);
                                    setAgenSearch("");
                                    toast({
                                      title: "👤 Agen Dipilih",
                                      description: agen.fullName,
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <Check
                                      className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        selectedAgenId === agen.id.toString()
                                          ? "opacity-100 text-green-600"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                          {agen.fullName}
                                        </span>
                                        {agen.currentStar > 0 &&
                                          renderStars(agen.currentStar)}
                                        {agen.currentStar === 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] px-1"
                                          >
                                            Pra-Agent
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{agen.phone}</span>
                                        <span>•</span>
                                        <span className="truncate">
                                          {agen.email}
                                        </span>
                                      </div>
                                      {agen.referralCode && (
                                        <div className="text-[10px] text-primary font-mono">
                                          Ref: {agen.referralCode}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Info Agen Terpilih */}
                    {selectedAgen && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-green-800 truncate">
                              {selectedAgen.fullName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <Phone className="h-3 w-3" />
                              <span>{selectedAgen.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedAgen.currentStar > 0 ? (
                                <>
                                  {renderStars(selectedAgen.currentStar)}
                                  <span className="text-xs text-green-600">
                                    Bintang {selectedAgen.currentStar}
                                  </span>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Pra-Agent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Note Paket</Label>
                    <Select
                      value={watch("notePaket") || "FULLSERVICE"}
                      onValueChange={(val) =>
                        setValue("notePaket", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULLSERVICE">
                          Full Service
                        </SelectItem>
                        <SelectItem value="EXTREME">Extreme</SelectItem>
                        <SelectItem value="KONSORSIUM">Konsorsium</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kamar Makkah</Label>
                    <Select
                      value={watch("roomTypeMakkah") || "none"}
                      onValueChange={(val) =>
                        setValue("roomTypeMakkah", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          -- Belum Dipilih --
                        </SelectItem>
                        <SelectItem value="DOUBLE">Double (2 orang)</SelectItem>
                        <SelectItem value="TRIPLE">Triple (3 orang)</SelectItem>
                        <SelectItem value="QUAD">Quad (4 orang)</SelectItem>
                        <SelectItem value="QUINT">Quint (5 orang)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kamar Madinah</Label>
                    <Select
                      value={watch("roomTypeMadinah") || "none"}
                      onValueChange={(val) =>
                        setValue("roomTypeMadinah", val, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Pilih --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          -- Belum Dipilih --
                        </SelectItem>
                        <SelectItem value="DOUBLE">Double (2 orang)</SelectItem>
                        <SelectItem value="TRIPLE">Triple (3 orang)</SelectItem>
                        <SelectItem value="QUAD">Quad (4 orang)</SelectItem>
                        <SelectItem value="QUINT">Quint (5 orang)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status Registrasi</Label>
                  <Select
                    value={watch("registrationStatus") || "DRAFT"}
                    onValueChange={(val) =>
                      setValue("registrationStatus", val, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger className="w-full md:w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_DOCUMENT">
                        Pending Dokumen
                      </SelectItem>
                      <SelectItem value="PENDING_PAYMENT">
                        Pending Bayar
                      </SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    {...register("notes")}
                    placeholder="Catatan tambahan..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== PRICING TAB ===== */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rincian Harga</CardTitle>
                <CardDescription>
                  Atur harga dan potongan untuk jamaah ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Harga Paket (Rp)</Label>
                    <Input
                      type="number"
                      {...register("hargaPaket")}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">
                      Auto-fill saat memilih paket
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Potongan Fee Agen (Rp)</Label>
                    <Input
                      type="number"
                      {...register("potonganFeeAgen")}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Potongan Poin Agen (Rp)</Label>
                    <Input
                      type="number"
                      {...register("potonganPoinAgen")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cashback Kartu Kredit (Rp)</Label>
                    <Input
                      type="number"
                      {...register("potonganCashbackKK")}
                      placeholder="0"
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Harga Final</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatRupiah(calculateHargaFinal())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Harga Paket - Semua Potongan
                  </p>
                </div>

                {/* Info Outstanding */}
                {jamaah && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Dibayar</span>
                      <span className="font-medium text-green-600">
                        {formatRupiah(parseFloat(jamaah.totalPayment || "0"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sisa Tagihan</span>
                      <span
                        className={`font-bold ${
                          calculateHargaFinal() -
                            parseFloat(jamaah.totalPayment || "0") >
                          0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatRupiah(
                          calculateHargaFinal() -
                            parseFloat(jamaah.totalPayment || "0")
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Save Button (Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-50">
          <Button
            type="submit"
            className="w-full bg-primary"
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </form>

      {/* Spacer for mobile fixed button */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
