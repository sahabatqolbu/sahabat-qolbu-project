// dashboard/src/app/%28dashboard%29/admin/packages/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { packageService } from "@/services/packageService";
import { masterService } from "@/services/masterService";
import {
  createPackageSchema,
  CreatePackageFormData,
} from "@/lib/schemas/package-schema";
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
} from "lucide-react";
import Link from "next/link";
import { MediaUpload } from "@/components/packages/MediaUpload";

export default function CreatePackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");

  // ✅ State untuk Media
  const [uploadImages, setUploadImages] = useState<File[]>([]);
  const [uploadPdf, setUploadPdf] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePackageFormData>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      type: "FULL_SERVICE", // ✅ FIXED
      totalSeats: 45,
      isActive: true,
      isPublished: false,
      airlineStatus: "PLANNING",
      airlineTermin1Status: "UNPAID",
      airlineTermin2Status: "UNPAID",
      hotelMakkahStatus: "PLANNING",
      hotelMadinahStatus: "PLANNING",
      hotelMakkahDouble: 0,
      hotelMakkahTriple: 0,
      hotelMakkahQuad: 0,
      hotelMakkahQuint: 0,
      hotelMadinahDouble: 0,
      hotelMadinahTriple: 0,
      hotelMadinahQuad: 0,
      hotelMadinahQuint: 0,
      airlineTermin1Amount: 0,
      airlineTermin2Amount: 0,
    },
  });

  // Watch values for computed fields
  const watchDepartureDate = watch("departureDate");
  const watchReturnDate = watch("returnDate");

  // Calculate duration
  const calculateDuration = () => {
    if (watchDepartureDate && watchReturnDate) {
      const start = new Date(watchDepartureDate);
      const end = new Date(watchReturnDate);
      const diff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

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

  // ✅ CREATE MUTATION
  const createMutation = useMutation({
    mutationFn: (data: CreatePackageFormData) => {
      return packageService.create({
        packageData: data,
        itineraryPdf: uploadPdf || undefined,
        images: uploadImages.length > 0 ? uploadImages : undefined,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Paket Berhasil Dibuat",
        description: `Paket ${data.data.name} telah ditambahkan`,
      });
      router.push("/admin/packages");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Membuat Paket",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: CreatePackageFormData) => {
    createMutation.mutate(data);
  };

  // Tab validation indicator
  const getTabStatus = (tab: string) => {
    const errorFields = Object.keys(errors);
    const tabFields: Record<string, string[]> = {
      basic: [
        "name",
        "type",
        "departureDate",
        "returnDate",
        "price",
        "totalSeats",
      ],
      airline: ["airlineId"],
      hotels: ["hotelMakkahId", "hotelMadinahId"],
      payment: [],
      media: [],
    };

    const hasError = tabFields[tab]?.some((field) =>
      errorFields.includes(field)
    );
    return hasError ? "error" : "default";
  };

  // Tambahkan fungsi ini
  const onInvalid = (errors: any) => {
    console.log("❌ Form Errors:", errors); // Cek console browser (F12)
    toast({
      variant: "destructive",
      title: "Data Belum Lengkap",
      description:
        "Mohon cek kembali kolom bertanda * di semua Tab (Info Dasar, Maskapai, Hotel, dll).",
    });

    // Opsional: Pindah ke tab yang error otomatis
    if (errors.name || errors.price || errors.departureDate)
      setActiveTab("basic");
    else if (errors.airlineId) setActiveTab("airline");
    else if (errors.hotelMakkahId || errors.hotelMadinahId)
      setActiveTab("hotels");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/packages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Tambah Paket Umrah
          </h1>
          <p className="text-gray-600 mt-1">Buat paket perjalanan umrah baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">Info Dasar</span>
              {getTabStatus("basic") === "error" && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="airline" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              <span className="hidden md:inline">Maskapai</span>
            </TabsTrigger>
            <TabsTrigger value="hotels" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Hotel</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">Pembayaran</span>
            </TabsTrigger>
            {/* ✅ TAB BARU */}
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden md:inline">Media</span>
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
                <CardDescription>Detail utama paket umrah</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nama Paket */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama Paket <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Paket Umrah Hemat Januari 2025"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Tipe & Bandara */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Tipe Paket <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
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
                      )}
                    />
                    {errors.type && (
                      <p className="text-sm text-red-500">
                        {errors.type.message}
                      </p>
                    )}
                    {errors.type && (
                      <p className="text-sm text-red-500">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bandara Keberangkatan</Label>
                    <Controller
                      name="departureAirportId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(val) =>
                            field.onChange(val ? parseInt(val) : null)
                          }
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
                                {airport.name} ({airport.code}) - {airport.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departureDate">
                      Tanggal Berangkat <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="departureDate"
                      type="date"
                      {...register("departureDate")}
                    />
                    {errors.departureDate && (
                      <p className="text-sm text-red-500">
                        {errors.departureDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnDate">
                      Tanggal Pulang <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="returnDate"
                      type="date"
                      {...register("returnDate")}
                    />
                    {errors.returnDate && (
                      <p className="text-sm text-red-500">
                        {errors.returnDate.message}
                      </p>
                    )}
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
                    <Label htmlFor="price">
                      Harga <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="31.200.000"
                        {...register("price", {
                          setValueAs: (v) =>
                            v ? parseFloat(v.replace(/\./g, "")) : null,
                        })}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountPrice">Harga Diskon</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        Rp
                      </span>
                      <Input
                        id="discountPrice"
                        type="number"
                        placeholder="Kosongkan jika tidak ada"
                        className="pl-10"
                        {...register("discountPrice", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalSeats">
                      Total Seat <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="totalSeats"
                        type="number"
                        placeholder="45"
                        className="pl-10"
                        {...register("totalSeats", { valueAsNumber: true })}
                      />
                    </div>
                    {errors.totalSeats && (
                      <p className="text-sm text-red-500">
                        {errors.totalSeats.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi lengkap paket umrah..."
                    rows={4}
                    {...register("description")}
                  />
                </div>

                {/* Fasilitas */}
                <div className="space-y-2">
                  <Label htmlFor="facilities">Fasilitas</Label>
                  <Textarea
                    id="facilities"
                    placeholder="- Tiket Pesawat PP&#10;- Hotel Bintang 4&#10;- Visa Umrah&#10;- Makan 3x sehari&#10;- Tour Leader&#10;- Perlengkapan Umrah"
                    rows={6}
                    {...register("facilities")}
                  />
                  <p className="text-xs text-gray-500">
                    Pisahkan setiap fasilitas dengan baris baru
                  </p>
                </div>

                {/* Keterangan */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Keterangan Tambahan</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan atau keterangan tambahan..."
                    rows={3}
                    {...register("notes")}
                  />
                </div>

                {/* Status */}
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Status Aktif</Label>
                      <p className="text-sm text-gray-500">
                        Paket dapat diakses dan dipesan
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
                    <div className="space-y-0.5">
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
                <CardDescription>Detail maskapai penerbangan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Maskapai & Status */}
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
                                <div className="flex items-center gap-2">
                                  <Plane className="h-4 w-4" />
                                  {airline.name} ({airline.code})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status Maskapai</Label>
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
                            <SelectItem value="PLANNING">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                Planning
                              </div>
                            </SelectItem>
                            <SelectItem value="CONFIRMED">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Confirmed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Issued Date */}
                <div className="space-y-2">
                  <Label htmlFor="airlineIssuedDate">Tanggal Issued</Label>
                  <Input
                    id="airlineIssuedDate"
                    type="date"
                    {...register("airlineIssuedDate")}
                  />
                  <p className="text-xs text-gray-500">
                    Tanggal tiket diterbitkan oleh maskapai
                  </p>
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
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Hotel Makkah
                  </CardTitle>
                  <CardDescription>
                    Akomodasi di Makkah Al-Mukarramah
                  </CardDescription>
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
                              <SelectValue placeholder="Pilih Hotel Makkah" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelsMakkah.map((hotel: any) => (
                                <SelectItem
                                  key={hotel.id}
                                  value={hotel.id.toString()}
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {hotel.name}
                                    <span className="text-yellow-500">
                                      {"⭐".repeat(hotel.starRating || 0)}
                                    </span>
                                  </div>
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
                              <SelectItem value="PLANNING">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  Planning
                                </div>
                              </SelectItem>
                              <SelectItem value="CONFIRMED">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Confirmed
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  {/* Room Count */}
                  <div>
                    <Label className="mb-3 block">Jumlah Kamar</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Double (2 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMakkahDouble", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Triple (3 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMakkahTriple", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Quad (4 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMakkahQuad", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Quint (5 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMakkahQuint", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hotel Madinah */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Hotel Madinah
                  </CardTitle>
                  <CardDescription>
                    Akomodasi di Madinah Al-Munawwarah
                  </CardDescription>
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
                              <SelectValue placeholder="Pilih Hotel Madinah" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelsMadinah.map((hotel: any) => (
                                <SelectItem
                                  key={hotel.id}
                                  value={hotel.id.toString()}
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {hotel.name}
                                    <span className="text-yellow-500">
                                      {"⭐".repeat(hotel.starRating || 0)}
                                    </span>
                                  </div>
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
                              <SelectItem value="PLANNING">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  Planning
                                </div>
                              </SelectItem>
                              <SelectItem value="CONFIRMED">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Confirmed
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  {/* Room Count */}
                  <div>
                    <Label className="mb-3 block">Jumlah Kamar</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Double (2 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMadinahDouble", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Triple (3 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMadinahTriple", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Quad (4 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMadinahQuad", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">
                          Quint (5 org)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          {...register("hotelMadinahQuint", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== TAB: PEMBAYARAN MASKAPAI ===== */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pembayaran Maskapai
                </CardTitle>
                <CardDescription>
                  Detail pembayaran ke maskapai (Termin 1 & 2)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Termin 1 */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Badge>Termin 1</Badge>
                    Down Payment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Jumlah</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min="0"
                          className="pl-10"
                          {...register("airlineTermin1Amount", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Bayar</Label>
                      <Input type="date" {...register("airlineTermin1Date")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name="airlineTermin1Status"
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
                              <SelectItem value="UNPAID">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Unpaid
                                </div>
                              </SelectItem>
                              <SelectItem value="PAID">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Paid
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Termin 2 */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Badge>Termin 2</Badge>
                    Pelunasan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Jumlah</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min="0"
                          className="pl-10"
                          {...register("airlineTermin2Amount", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Bayar</Label>
                      <Input type="date" {...register("airlineTermin2Date")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                        name="airlineTermin2Status"
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
                              <SelectItem value="UNPAID">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  Unpaid
                                </div>
                              </SelectItem>
                              <SelectItem value="PAID">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500" />
                                  Paid
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Total Pembayaran Maskapai
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      Rp{" "}
                      {(
                        (watch("airlineTermin1Amount") || 0) +
                        (watch("airlineTermin2Amount") || 0)
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ TAB: MEDIA (BARU) */}
          <TabsContent value="media">
            <MediaUpload
              onImagesChange={setUploadImages}
              onPdfChange={setUploadPdf}
            />
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <Card className="sticky bottom-4 shadow-lg mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="hidden md:block">
                <p className="text-sm text-gray-500">
                  Pastikan semua data sudah benar sebelum menyimpan
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Link href="/admin/packages" className="flex-1 md:flex-none">
                  <Button type="button" variant="outline" className="w-full">
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 md:flex-none bg-secondary hover:bg-secondary/90"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Paket
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
