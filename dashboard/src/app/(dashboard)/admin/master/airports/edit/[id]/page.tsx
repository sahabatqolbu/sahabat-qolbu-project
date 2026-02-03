// dashboard/src/app/(dashboard)/admin/master/airports/edit/[id]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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

// Removed .default(true) to fix type mismatch with useForm
const airportSchema = z.object({
  code: z.string().min(3, "Kode harus 3 karakter").max(3),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  city: z.string().min(2, "Kota wajib diisi"),
  country: z.string().min(2, "Negara wajib diisi"),
  isActive: z.boolean(),
});

type AirportFormData = z.infer<typeof airportSchema>;

export default function EditAirportPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AirportFormData>({
    resolver: zodResolver(airportSchema),
  });

  // ===== FETCH AIRPORT DATA =====
  const { data, isLoading } = useQuery({
    queryKey: ["airport", id],
    queryFn: async () => {
      const res = await masterService.airports.getById(parseInt(id));
      return res;
    },
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (data?.data) {
      const airport = data.data;
      reset({
        code: airport.code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        isActive: airport.isActive,
      });
    }
  }, [data, reset]);

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: AirportFormData) =>
      masterService.airports.update(parseInt(id), data),
    onSuccess: () => {
      toast({
        title: "✅ Bandara Berhasil Diupdate",
      });
      router.push("/admin/master/airports");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Bandara",
        description: error.response?.data?.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            Edit Bandara
          </h1>
          <p className="text-gray-600 mt-1">Update data bandara</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Bandara <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Soekarno-Hatta"
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
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button
            type="submit"
            className="flex-1 bg-secondary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update
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
