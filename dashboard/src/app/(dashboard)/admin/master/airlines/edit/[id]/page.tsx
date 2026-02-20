// dashboard/src/app/(dashboard)/admin/master/airlines/edit/[id]/page.tsx
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
import { getImageUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Plane, Upload, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Removed .default(true) to fix type mismatch with useForm
const airlineSchema = z.object({
  code: z.string().min(2, "Kode minimal 2 karakter").max(10),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  country: z.string().optional(),
  isActive: z.boolean(),
});

type AirlineFormData = z.infer<typeof airlineSchema>;

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan server";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Terjadi kesalahan server";
};

export default function EditAirlinePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AirlineFormData>({
    resolver: zodResolver(airlineSchema),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["airline", id],
    queryFn: () => masterService.airlines.getById(parseInt(id)),
  });

  // Set form data + preview logo
  useEffect(() => {
    if (data?.data) {
      const airline = data.data;

      reset({
        code: airline.code,
        name: airline.name,
        country: airline.country || "",
        isActive: airline.isActive ?? true,
      });

      // ✅ PAKAI getImageUrl() untuk preview
      if (airline.logo) {
        setLogoPreview(getImageUrl(airline.logo));
      }
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: async (formData: AirlineFormData) => {
      const payload = new FormData();
      payload.append("code", formData.code.toUpperCase());
      payload.append("name", formData.name);
      payload.append("isActive", formData.isActive.toString());

      if (formData.country) payload.append("country", formData.country);

      // ✅ TAMBAH DEBUG
      if (logoFile) {
        console.log("📤 Logo file to upload:", {
          name: logoFile.name,
          size: logoFile.size,
          type: logoFile.type,
        });
        payload.append("logo", logoFile); // ✅ Name HARUS "logo" sesuai backend
      } else {
        console.warn("⚠️ No logo file selected!");
      }

      // ✅ DEBUG: Log all FormData entries
      console.log("📦 FormData contents:");
      for (const [key, value] of payload.entries()) {
        console.log(`  - ${key}:`, value);
      }

      return masterService.airlines.update(parseInt(id), payload);
    },
    onSuccess: (response) => {
      console.log("✅ Update response:", response);

      queryClient.invalidateQueries({ queryKey: ["airlines"] });

      // ✅ TOAST SUCCESS
      toast({
        title: "✅ Berhasil",
        description: "Maskapai berhasil diupdate",
        variant: "default",
        duration: 3000,
      });

      // Redirect setelah 1 detik
      setTimeout(() => {
        router.push("/admin/master/airlines");
      }, 1000);
    },
    onError: (error: unknown) => {
      console.error("❌ Update error:", error);

      // ✅ TOAST ERROR
      toast({
        title: "❌ Gagal Update",
        description: getErrorMessage(error),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "File harus gambar" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Maksimal 2MB" });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
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
        Gagal memuat data maskapai
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/master/airlines">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold">Edit Maskapai</h1>
          <p className="text-gray-600">Update data maskapai</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <div className="grid gap-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Maskapai</CardTitle>
            </CardHeader>
            <CardContent>
              {logoPreview && (
                <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border mb-4 bg-white p-4">
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-4 justify-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="airline-logo"
                />
                <Label
                  htmlFor="airline-logo"
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  <Upload className="h-5 w-5" />
                  {logoPreview ? "Ganti Logo" : "Upload Logo"}
                </Label>
                <span className="text-sm text-gray-500">Max 2MB</span>
              </div>
            </CardContent>
          </Card>

          {/* Informasi Maskapai */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Informasi Maskapai
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Kode Maskapai <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="GA, SV, QZ"
                    {...register("code")}
                    className="uppercase font-mono"
                    maxLength={10}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama Maskapai <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Garuda Indonesia"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Negara</Label>
                <Input
                  id="country"
                  placeholder="Indonesia"
                  {...register("country")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Status Aktif</Label>
                  <p className="text-sm text-gray-500">
                    Maskapai dapat dipilih saat membuat paket
                  </p>
                </div>
                <Switch
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
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
                  Update Maskapai
                </>
              )}
            </Button>
            <Link href="/admin/master/airlines" className="flex-1">
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
