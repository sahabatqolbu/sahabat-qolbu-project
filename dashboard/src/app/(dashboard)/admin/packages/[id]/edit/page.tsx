// dashboard/src/app/(dashboard)/admin/packages/[id]/edit/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { packageService } from "@/services/packageService";
import { masterService } from "@/services/masterService";
import {
  updatePackageSchema,
  UpdatePackageFormData,
} from "@/lib/schemas/package-schema";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils"; // ← TAMBAHKAN INI
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plane,
  Building2,
  CreditCard,
  Info,
  Image as ImageIcon,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Upload,
  Trash2,
  X,
  FileText,
  Eye
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPackagePage({ params }: PageProps) {
  const { id: packageId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [hasPdfChanged, setHasPdfChanged] = useState(false);

  // const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty: isDirtyFromForm },
  } = useForm<UpdatePackageFormData>({
    resolver: zodResolver(updatePackageSchema),
  });

  const isDirty = isDirtyFromForm || hasPdfChanged || uploadingPdf;

  // Fetch Package
  const { data: packageData, isLoading: packageLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => packageService.getById(parseInt(packageId)),
  });

  const pkg = packageData?.data;

  // Fetch Master Data
  const { data: hotelsData } = useQuery({
    queryKey: ["hotels-active"],
    queryFn: () => masterService.hotels.getAll({ isActive: true }),
  });

  const { data: airlinesData } = useQuery({
    queryKey: ["airlines-active"],
    queryFn: () => masterService.airlines.getAll({ isActive: true }),
  });

  const { data: airportsData } = useQuery({
    queryKey: ["airports-active"],
    queryFn: () => masterService.airports.getAll({ isActive: true }),
  });

  const hotels = hotelsData?.data || [];
  const airlines = airlinesData?.data || [];
  const airports = airportsData?.data || [];

  const hotelsMakkah = hotels.filter((h: any) => h.city === "MAKKAH");
  const hotelsMadinah = hotels.filter((h: any) => h.city === "MADINAH");

  // Populate form when data loaded
  useEffect(() => {
    // ✅ TUNGGU SAMPAI PKG DAN AIRPORTS READY
    if (pkg && airports.length > 0) {
      console.log("📦 Populating form with data:", {
        pkg: pkg.code,
        type: pkg.type, // ✅ TAMBAH LOG INI
        departureAirportId: pkg.departureAirportId,
        airportsCount: airports.length,
      });

      reset({
        name: pkg.name,
        description: pkg.description || "",
        type: pkg.type || "FULL_SERVICE", // ✅ TAMBAH FALLBACK

        departureDate: pkg.departureDate?.split("T")[0] || "",
        returnDate: pkg.returnDate?.split("T")[0] || "",

        price: parseFloat(pkg.price),
        discountPrice:
          pkg.discountPrice && parseFloat(pkg.discountPrice) > 0
            ? parseFloat(pkg.discountPrice)
            : undefined,
        totalSeats: pkg.totalSeats,

        facilities: pkg.facilities || "",
        notes: pkg.notes || "",

        airlineId: pkg.airlineId,
        airlineStatus: pkg.airlineStatus,
        airlineIssuedDate: pkg.airlineIssuedDate?.split("T")[0] || "",

        airlineTermin1Amount: parseFloat(pkg.airlineTermin1Amount),
        airlineTermin1Date: pkg.airlineTermin1Date?.split("T")[0] || "",
        airlineTermin1Status: pkg.airlineTermin1Status,

        airlineTermin2Amount: parseFloat(pkg.airlineTermin2Amount),
        airlineTermin2Date: pkg.airlineTermin2Date?.split("T")[0] || "",
        airlineTermin2Status: pkg.airlineTermin2Status,

        hotelMakkahId: pkg.hotelMakkahId,
        hotelMakkahStatus: pkg.hotelMakkahStatus,
        hotelMakkahDouble: pkg.hotelMakkahDouble,
        hotelMakkahTriple: pkg.hotelMakkahTriple,
        hotelMakkahQuad: pkg.hotelMakkahQuad,
        hotelMakkahQuint: pkg.hotelMakkahQuint,

        hotelMadinahId: pkg.hotelMadinahId,
        hotelMadinahStatus: pkg.hotelMadinahStatus,
        hotelMadinahDouble: pkg.hotelMadinahDouble,
        hotelMadinahTriple: pkg.hotelMadinahTriple,
        hotelMadinahQuad: pkg.hotelMadinahQuad,
        hotelMadinahQuint: pkg.hotelMadinahQuint,

        departureAirportId: pkg.departureAirportId,

        isActive: pkg.isActive,
        isPublished: pkg.isPublished,
      });

      console.log(
        "✅ Form populated with departureAirportId:",
        pkg.departureAirportId
      );
    }
  }, [pkg, airports, reset]); // ✅ TAMBAHKAN airports

  // Watch values
  const watchDepartureDate = watch("departureDate");
  const watchReturnDate = watch("returnDate");

  const calculateDuration = () => {
    if (watchDepartureDate && watchReturnDate) {
      const start = new Date(watchDepartureDate);
      const end = new Date(watchReturnDate);
      const diff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff > 0 ? diff : 0;
    }
    return pkg?.duration || 0;
  };

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePackageFormData) =>
      packageService.update(parseInt(packageId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      toast({
        title: "✅ Paket Berhasil Diupdate",
        description: "Perubahan telah disimpan",
      });
      router.push(`/admin/packages/${packageId}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Paket",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Upload Image Mutation
  // const uploadImageMutation = useMutation({
  //   mutationFn: (file: File) =>
  //     packageService.uploadImage(parseInt(packageId), file),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["package", packageId] });
  //     toast({ title: "✅ Gambar berhasil diupload" });
  //     setUploadingImage(false);
  //   },
  //   onError: (error: any) => {
  //     toast({
  //       variant: "destructive",
  //       title: "❌ Gagal upload gambar",
  //       description: error.response?.data?.message,
  //     });
  //     setUploadingImage(false);
  //   },
  // });

  // ✅ TAMBAHKAN MUTATION UPLOAD PDF
  const uploadPdfMutation = useMutation({
    mutationFn: (file: File) => {
      console.log("📤 uploadPdfMutation → file:", file.name);
      return packageService.uploadItineraryPdf(parseInt(packageId), file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      toast({ title: "✅ PDF Itinerary berhasil diupload" });
      setUploadingPdf(false);
    },
    onError: (error: any) => {
      console.error("❌ upload PDF error:", error);
      toast({
        variant: "destructive",
        title: "❌ Gagal upload PDF",
        description: error?.response?.data?.message || error.message,
      });
      setUploadingPdf(false);
    },
  });

  // ✅ TAMBAHKAN MUTATION DELETE PDF
  const deletePdfMutation = useMutation({
    mutationFn: () => packageService.deleteItineraryPdf(parseInt(packageId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      toast({ title: "✅ PDF Itinerary berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal hapus PDF",
        description: error?.response?.data?.message,
      });
    },
  });

  // ✅ HANDLER UPLOAD PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi
      if (file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "❌ File harus PDF" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "❌ File terlalu besar",
          description: "Maksimal 10MB",
        });
        return;
      }

      setUploadingPdf(true);
      setHasPdfChanged(true); // <--- INI YANG BIKIN SAVE NYALA!
      uploadPdfMutation.mutate(file);
    }
  };

  // Delete Image Mutation
  const deleteImageMutation = useMutation({
    mutationFn: packageService.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      toast({ title: "✅ Gambar berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal hapus gambar",
        description: error.response?.data?.message,
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("🟡 handleImageUpload fired, file:", file);
    if (file) {
      setUploadingImage(true);
      uploadImageMutation.mutate(file);
    }
  };

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => {
      console.log("📤 uploadImageMutation → file:", file.name, file.size);
      return packageService.uploadImage(parseInt(packageId), file);
    },
    onSuccess: (data) => {
      console.log("✅ upload success:", data);
      queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      toast({ title: "✅ Gambar berhasil diupload" });
      setUploadingImage(false);
    },
    onError: (error: any) => {
      console.error("❌ upload error:", error);
      toast({
        variant: "destructive",
        title: "❌ Gagal upload gambar",
        description: error?.response?.data?.message || error.message,
      });
      setUploadingImage(false);
    },
  });

  const onSubmit = (data: UpdatePackageFormData) => {
    console.log("📤 FORM SUBMIT:", data);
    updateMutation.mutate(data);
  };

  if (packageLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paket tidak ditemukan</p>
        <Link href="/admin/packages">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/packages/${packageId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Edit Paket
            </h1>
            <p className="text-gray-600 mt-1">
              {pkg.code} • {pkg.name}
            </p>
          </div>
        </div>
        {isDirty && (
          <Badge variant="secondary" className="animate-pulse">
            Ada perubahan belum disimpan
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="airline" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden md:inline">Maskapai</span>
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Hotel</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden md:inline">Gambar</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: INFO DASAR ===== */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kode Paket (Read Only) */}
                <div className="space-y-2">
                  <Label>Kode Paket</Label>
                  <Input
                    value={pkg.code}
                    disabled
                    className="bg-gray-100 font-mono"
                  />
                </div>

                {/* Nama Paket */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Paket</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Tipe & Bandara */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipe Paket</Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => {
                        console.log("🔍 TYPE SELECT VALUE:", field.value); // ✅ LOG DEBUG
                        return (
                          <Select
                            value={field.value || "FULL_SERVICE"} // ✅ FALLBACK
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Tipe Paket" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL_SERVICE">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-100 text-blue-800">
                                    Full Service
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    Standar + lengkap
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="EXTREME">
                                <Badge className="bg-red-100 text-red-800">
                                  Extreme
                                </Badge>
                              </SelectItem>
                              <SelectItem value="SEMI_MANDIRI">
                                <Badge className="bg-orange-100 text-orange-800">
                                  Semi Mandiri
                                </Badge>
                              </SelectItem>
                              <SelectItem value="FLEKSIBILITAS">
                                <Badge className="bg-purple-100 text-purple-800">
                                  Fleksibilitas
                                </Badge>
                              </SelectItem>
                              <SelectItem value="KONSORSIUM">
                                <Badge className="bg-indigo-100 text-indigo-800">
                                  Konsorsium
                                </Badge>
                              </SelectItem>
                              <SelectItem value="LA">
                                <Badge className="bg-green-100 text-green-800">
                                  Land Arrangement
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                    {errors.type && (
                      <p className="text-sm text-red-500">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  {/* Bandara Keberangkatan */}
                  <div className="space-y-2">
                    <Label>Bandara Keberangkatan</Label>

                    <Controller
                      name="departureAirportId"
                      control={control}
                      render={({ field }) => {
                        const currentValue = field.value?.toString() || "";

                        console.log("🔍 AIRPORT SELECT RENDER:", {
                          fieldValue: field.value,
                          currentValue,
                          pkgAirportId: pkg?.departureAirportId,
                          airportsCount: airports.length,
                        });

                        return (
                          <Select
                            key={`airport-${field.value || "empty"}`} // ✅ TAMBAH KEY INI
                            value={currentValue}
                            onValueChange={(val) => {
                              console.log("✏️ Airport changed:", val);
                              field.onChange(val ? parseInt(val) : undefined);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Bandara" />
                            </SelectTrigger>
                            <SelectContent>
                              {airports.map((airport: any) => (
                                <SelectItem
                                  key={airport.id}
                                  value={airport.id.toString()}
                                >
                                  {airport.name} ({airport.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureDate">Tanggal Berangkat</Label>
                    <Input type="date" {...register("departureDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">Tanggal Pulang</Label>
                    <Input type="date" {...register("returnDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Durasi</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">
                        {calculateDuration()} Hari
                      </span>
                    </div>
                  </div>
                </div>

                {/* Harga & Seat */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        Rp
                      </span>
                      <Input
                        type="number"
                        className="pl-10"
                        {...register("price", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPrice">Harga Diskon</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        Rp
                      </span>
                      <Input
                        type="number"
                        className="pl-10"
                        {...register("discountPrice", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalSeats">Total Seat</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        className="pl-10"
                        {...register("totalSeats", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>

                {/* Deskripsi & Fasilitas */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea rows={3} {...register("description")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilities">Fasilitas</Label>
                  <Textarea rows={5} {...register("facilities")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Keterangan Tambahan</Label>
                  <Textarea rows={3} {...register("notes")} />
                </div>

                {/* Status */}
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Status Aktif</Label>
                      <p className="text-sm text-gray-500">
                        Paket dapat diakses
                      </p>
                    </div>
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Published</Label>
                      <p className="text-sm text-gray-500">
                        Tampil di landing page
                      </p>
                    </div>
                    <Controller
                      name="isPublished"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: MASKAPAI ===== */}
          <TabsContent value="airline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Informasi Maskapai
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maskapai</Label>
                    <Controller
                      name="airlineId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(val) =>
                            field.onChange(val ? parseInt(val) : null)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Maskapai" />
                          </SelectTrigger>
                          <SelectContent>
                            {airlines.map((airline: any) => (
                              <SelectItem
                                key={airline.id}
                                value={airline.id.toString()}
                              >
                                {airline.name} ({airline.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name="airlineStatus"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLANNING">Planning</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Issued</Label>
                  <Input type="date" {...register("airlineIssuedDate")} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB: HOTEL ===== */}
          <TabsContent value="hotels">
            <div className="space-y-6">
              {/* Hotel Makkah */}
              <Card>
                <CardHeader>
                  <CardTitle>Hotel Makkah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Hotel</Label>
                      <Controller
                        name="hotelMakkahId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(val) =>
                              field.onChange(val ? parseInt(val) : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Hotel" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelsMakkah.map((hotel: any) => (
                                <SelectItem
                                  key={hotel.id}
                                  value={hotel.id.toString()}
                                >
                                  {hotel.name}{" "}
                                  {"⭐".repeat(hotel.starRating || 0)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name="hotelMakkahStatus"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PLANNING">Planning</SelectItem>
                              <SelectItem value="CONFIRMED">
                                Confirmed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Double</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMakkahDouble", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Triple</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMakkahTriple", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Quad</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMakkahQuad", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Quint</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMakkahQuint", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hotel Madinah */}
              <Card>
                <CardHeader>
                  <CardTitle>Hotel Madinah</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Hotel</Label>
                      <Controller
                        name="hotelMadinahId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(val) =>
                              field.onChange(val ? parseInt(val) : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Hotel" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelsMadinah.map((hotel: any) => (
                                <SelectItem
                                  key={hotel.id}
                                  value={hotel.id.toString()}
                                >
                                  {hotel.name}{" "}
                                  {"⭐".repeat(hotel.starRating || 0)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name="hotelMadinahStatus"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PLANNING">Planning</SelectItem>
                              <SelectItem value="CONFIRMED">
                                Confirmed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Double</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMadinahDouble", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Triple</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMadinahTriple", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Quad</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMadinahQuad", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Quint</Label>
                      <Input
                        type="number"
                        min="0"
                        {...register("hotelMadinahQuint", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* ===== TAB: IMAGES ===== */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gambar Brosur
                </CardTitle>
                <CardDescription>
                  Upload gambar brosur paket (maksimal 5 gambar)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Images */}
                {pkg.images && pkg.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pkg.images.map((image: any) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={getImageUrl(image.imageUrl)} // ✅ PAKAI getImageUrl()
                          alt={image.caption || "Package image"}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            console.error(
                              "❌ Image load error:",
                              image.imageUrl
                            );
                            e.currentTarget.src =
                              "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />
                        {image.isPrimary && (
                          <Badge className="absolute top-2 left-2 bg-green-500">
                            Utama
                          </Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteImageMutation.mutate(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="h-10 w-10 text-gray-400" />
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                      {uploadingImage
                        ? "Mengupload..."
                        : "Klik untuk upload gambar"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG (max 5MB)
                    </p>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* ===== SECTION: PDF ITINERARY ===== */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Itinerary
                </CardTitle>
                <CardDescription>
                  Upload file PDF jadwal perjalanan (maksimal 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current PDF */}
                {pkg.itineraryPdf && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {pkg.itineraryPdf.split("/").pop()}
                        </p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(getImageUrl(pkg.itineraryPdf), "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Hapus PDF Itinerary?")) {
                            deletePdfMutation.mutate();
                          }
                        }}
                        disabled={deletePdfMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload PDF */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingPdf ? (
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="h-10 w-10 text-gray-400" />
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                      {uploadingPdf
                        ? "Mengupload PDF..."
                        : pkg.itineraryPdf
                        ? "Klik untuk ganti PDF"
                        : "Klik untuk upload PDF"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF (max 10MB)</p>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500 hidden md:block">
                {isDirty
                  ? "Ada perubahan yang belum disimpan"
                  : "Semua perubahan tersimpan"}
              </p>
              <div className="flex gap-3 w-full md:w-auto">
                <Link
                  href={`/admin/packages/${packageId}`}
                  className="flex-1 md:flex-none"
                >
                  <Button type="button" variant="outline" className="w-full">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 md:flex-none bg-secondary hover:bg-secondary/90"
                  disabled={
                    updateMutation.isPending || (!isDirty && !uploadingPdf)
                  }
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
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
