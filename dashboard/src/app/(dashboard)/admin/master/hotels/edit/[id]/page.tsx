// dashboard/src/app/(dashboard)/admin/master/hotels/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Building2, Upload, X } from "lucide-react";
import Link from "next/link";

// ✅ VALIDATION SCHEMA: Removed .default(true)
const hotelSchema = z.object({
  name: z.string().min(3, "Nama hotel minimal 3 karakter"),
  city: z.string().min(1, "Kota wajib dipilih"),
  address: z.string().optional(),
  starRating: z.number().min(1).max(5),
  distanceToHaram: z.number().min(0).optional(),
  facilities: z.string().optional(),
  isActive: z.boolean(),
});

type HotelFormData = z.infer<typeof hotelSchema>;

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      starRating: 4,
      distanceToHaram: 0,
      isActive: true,
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotel", id],
    queryFn: () => masterService.hotels.getById(parseInt(id)),
  });

  useEffect(() => {
    if (data?.data) {
      const hotel = data.data;
      console.log("🔍 Hotel data dari API:", hotel);

      reset({
        name: hotel.name || "",
        city: hotel.city || "MAKKAH",
        address: hotel.address || "",
        starRating: hotel.starRating || 4,
        distanceToHaram: hotel.distanceToHaram || 0,
        facilities: hotel.facilities || "",
        isActive: hotel.isActive ?? true,
      });

      // Force set for react-hook-form controlled inputs
      setTimeout(() => {
        setValue("city", hotel.city || "MAKKAH", { shouldValidate: false });
        setValue("starRating", hotel.starRating || 4, {
          shouldValidate: false,
        });
      }, 100);

      if (hotel.imageUrl) {
        const url = hotel.imageUrl.startsWith("http")
          ? hotel.imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${hotel.imageUrl}`;
        setImagePreview(url);
      }
    }
  }, [data, reset, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (formData: HotelFormData) => {
      const payload = new FormData();

      payload.append("name", formData.name);
      payload.append("city", formData.city);
      payload.append("stars", formData.starRating.toString());
      payload.append("isActive", formData.isActive.toString());

      if (formData.address) payload.append("address", formData.address);
      if (formData.distanceToHaram !== undefined) {
        payload.append("distanceToHaram", formData.distanceToHaram.toString());
      }
      if (formData.facilities)
        payload.append("facilities", formData.facilities);

      if (imageFile) {
        console.log("📤 Uploading image:", imageFile.name);
        payload.append("image", imageFile);
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/master/hotels/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      return response.json();
    },
    onSuccess: (response) => {
      console.log("✅ Update success:", response);
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["hotel", id] });
      toast({ title: "✅ Hotel berhasil diupdate" });
      router.push("/admin/master/hotels");
    },
    onError: (error: any) => {
      console.error("❌ Update error:", error);
      toast({
        variant: "destructive",
        title: "Gagal update hotel",
        description: error.message,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "File harus gambar" });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Maksimal 3MB" });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        Gagal memuat data hotel
      </div>
    );
  }

  const currentCity = watch("city");
  const currentStarRating = watch("starRating");

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/master/hotels">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold">Edit Hotel</h1>
          <p className="text-gray-600">Update data hotel Makkah/Madinah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <div className="grid gap-6">
          {/* Gambar Hotel */}
          <Card>
            <CardHeader>
              <CardTitle>Gambar Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="hotel-image"
                />
                <Label
                  htmlFor="hotel-image"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  {imagePreview ? "Ganti Gambar" : "Upload Gambar Hotel"}
                </Label>
                <span className="text-sm text-gray-500">Max 3MB</span>
              </div>
            </CardContent>
          </Card>

          {/* Informasi Hotel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 /> Informasi Hotel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>
                    Nama Hotel <span className="text-red-500">*</span>
                  </Label>
                  <Input {...register("name")} placeholder="Pullman ZamZam" />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Kota <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={currentCity}
                    onValueChange={(v) =>
                      setValue("city", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAKKAH">Makkah</SelectItem>
                      <SelectItem value="MADINAH">Madinah</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-red-500">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rating Bintang</Label>
                  <Select
                    value={currentStarRating?.toString()}
                    onValueChange={(v) =>
                      setValue("starRating", parseInt(v), {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Bintang" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} Bintang {"⭐".repeat(n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jarak ke Haram (meter)</Label>
                  <Input
                    type="number"
                    {...register("distanceToHaram", { valueAsNumber: true })}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea
                  {...register("address")}
                  rows={3}
                  placeholder="Alamat lengkap hotel..."
                />
              </div>

              <div className="space-y-2">
                <Label>Fasilitas (pisahkan dengan Enter)</Label>
                <Textarea
                  {...register("facilities")}
                  rows={6}
                  placeholder="WiFi Gratis&#10;AC&#10;Breakfast&#10;Shuttle"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Status Aktif</Label>
                  <p className="text-sm text-gray-500">
                    Hotel bisa dipilih di paket
                  </p>
                </div>
                <Switch
                  checked={watch("isActive")}
                  onCheckedChange={(v) => setValue("isActive", v)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-secondary hover:bg-secondary/90"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Hotel
                </>
              )}
            </Button>
            <Link href="/admin/master/hotels" className="flex-1">
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
