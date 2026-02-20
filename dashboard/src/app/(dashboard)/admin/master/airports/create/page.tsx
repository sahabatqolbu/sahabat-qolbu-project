// dashboard/src/app/(dashboard)/admin/master/airports/create/page.tsx
"use client";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

// Removed .default(true) to ensure strict type compatibility with useForm
const airportSchema = z.object({
  code: z.string().min(3, "Kode harus 3 karakter").max(3),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  city: z.string().min(2, "Kota wajib diisi"),
  country: z.string().min(2, "Negara wajib diisi"),
  isActive: z.boolean(),
});

type AirportFormData = z.infer<typeof airportSchema>;

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

export default function CreateAirportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AirportFormData>({
    resolver: zodResolver(airportSchema),
    defaultValues: {
      isActive: true, // Default value handled here
      code: "",
      name: "",
      city: "",
      country: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AirportFormData) => masterService.airports.create(data),
    onSuccess: () => {
      toast({
        title: "✅ Bandara Berhasil Ditambahkan",
      });
      router.push("/admin/master/airports");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menambahkan Bandara",
        description: getErrorMessage(error),
      });
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/master/airports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Tambah Bandara
          </h1>
          <p className="text-gray-600 mt-1">Tambah data bandara baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informasi Bandara
            </CardTitle>
            <CardDescription>Detail bandara keberangkatan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Kode IATA <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="CGK, SUB, JED"
                  maxLength={3}
                  {...register("code")}
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
                <p className="text-xs text-gray-500">3 huruf kode IATA</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Bandara <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Soekarno-Hatta International"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  Kota <span className="text-red-500">*</span>
                </Label>
                <Input id="city" placeholder="Jakarta" {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Negara <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  placeholder="Indonesia"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">Bandara dapat dipilih</p>
              </div>
              <Switch
                defaultChecked
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            type="submit"
            className="flex-1 bg-secondary"
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
                Simpan
              </>
            )}
          </Button>
          <Link href="/admin/master/airports" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
