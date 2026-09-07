// dashboard/src/app/(dashboard)/admin/master/hotels/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";

// ✅ VALIDATION SCHEMA: Proper TypeScript types for useForm
const hotelSchema = z.object({
  name: z.string().min(3, "Nama hotel minimal 3 karakter"),
  city: z.enum(["MAKKAH", "MADINAH"]),
  address: z.string().optional(),
  description: z.string().optional(),
  mapUrl: z.string().optional(),
  videoUrls: z.string().optional(),
  starRating: z.number().min(1).max(5),
  distanceToHaram: z.number().min(0).optional(),
  facilities: z.string().optional(),
  isActive: z.boolean(),
});

type HotelFormData = z.infer<typeof hotelSchema>;

export default function CreateHotelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HotelFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(hotelSchema) as any,
    defaultValues: {
      city: "MAKKAH",
      starRating: 4,
      isActive: true, // Default value handled here
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HotelFormData) => {
      const payload = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          payload.append(key, String(value));
        }
      });
      if (imageFile) payload.append("image", imageFile);
      return masterService.hotels.create(payload);
    },
    onSuccess: (response) => {
      toast({
        title: "✅ Hotel Berhasil Ditambahkan",
        description: "Data tersimpan. Tambahkan foto kamar dan fasilitas di galeri.",
      });
      const createdId = response?.data?.id;
      router.push(
        createdId
          ? `/admin/master/hotels/edit/${createdId}`
          : "/admin/master/hotels",
      );
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menambahkan Hotel",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: HotelFormData) => {
    createMutation.mutate(data);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = handleSubmit(onSubmit as any);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Gunakan gambar maksimal 3MB" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/master/hotels">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Tambah Hotel
          </h1>
          <p className="text-gray-600 mt-1">Tambah data hotel baru</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Hotel
            </CardTitle>
            <CardDescription>Detail hotel Makkah/Madinah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nama Hotel */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Hotel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Pullman ZamZam Makkah"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Kota & Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Kota <span className="text-red-500">*</span>
                </Label>
                <Select
                  defaultValue="MAKKAH"
                  onValueChange={(val) => setValue("city", val as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAKKAH">Makkah</SelectItem>
                    <SelectItem value="MADINAH">Madinah</SelectItem>
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Rating Bintang <span className="text-red-500">*</span>
                </Label>
                <Select
                  defaultValue="4"
                  onValueChange={(val) => setValue("starRating", parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <SelectItem key={star} value={star.toString()}>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: star }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                placeholder="Alamat lengkap hotel..."
                rows={3}
                {...register("address")}
              />
            </div>

            {/* Jarak ke Haram */}
            <div className="space-y-2">
              <Label htmlFor="distanceToHaram">Jarak ke Haram (meter)</Label>
              <Input
                id="distanceToHaram"
                type="number"
                placeholder="500"
                {...register("distanceToHaram", { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500">
                Jarak dalam meter dari hotel ke Masjidil Haram/Nabawi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Publik</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Jelaskan lokasi, kenyamanan, dan nilai utama hotel untuk jamaah."
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapUrl">Link Google Maps</Label>
              <Input
                id="mapUrl"
                type="url"
                placeholder="https://maps.google.com/..."
                {...register("mapUrl")}
              />
            </div>

            {/* Fasilitas */}
            <div className="space-y-2">
              <Label htmlFor="facilities">Fasilitas</Label>
              <Textarea
                id="facilities"
                placeholder="- AC&#10;- WiFi&#10;- Breakfast&#10;- Laundry"
                rows={5}
                {...register("facilities")}
              />
              <p className="text-xs text-gray-500">
                Pisahkan setiap fasilitas dengan baris baru
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrls">Video YouTube / Instagram</Label>
              <Textarea
                id="videoUrls"
                rows={4}
                placeholder="Satu URL video per baris"
                {...register("videoUrls")}
              />
              <p className="text-xs text-gray-500">
                Maksimal 10 video. Gunakan URL YouTube atau Instagram.
              </p>
            </div>

            {/* Gambar Hotel */}
            <div className="space-y-2">
              <Label>Gambar Hotel</Label>
              {imagePreview ? (
                <div className="relative h-56 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview hotel"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <Input
                id="hotel-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <Label
                htmlFor="hotel-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                {imagePreview ? "Ganti Gambar" : "Upload Gambar"}
              </Label>
              <p className="text-xs text-gray-500">
                JPG, PNG, atau WebP maksimal 3MB. Sistem menyimpan hasil optimal
                dalam WebP.
              </p>
            </div>

            {/* Status Aktif */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  Hotel dapat dipilih saat membuat paket
                </p>
              </div>
              <Switch
                defaultChecked
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 mt-6">
          <Button
            type="submit"
            className="flex-1 bg-secondary hover:bg-secondary/90"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Hotel
              </>
            )}
          </Button>
          <Link href="/admin/master/hotels" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
