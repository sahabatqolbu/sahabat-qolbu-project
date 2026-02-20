// dashboard/src/app/(dashboard)/admin/master/agent-levels/[id]/edit/page.tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface BenefitField {
  title: string;
  description: string;
  order: number;
}

interface FormData {
  name: string;
  slug: string;
  star: number;
  price: string;
  minClosing: number | null;
  maxPeriod: number | null;
  maintainClosing: number | null;
  maintainPeriod: number | null;
  downgradeClosing: number | null;
  description: string;
  isActive: boolean;
  order: number;
  benefits: BenefitField[];
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

export default function EditAgentLevelPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "benefits",
  });

  // ===== FETCH LEVEL =====
  const { data, isLoading } = useQuery({
    queryKey: ["agent-level", id],
    queryFn: () => adminService.agentLevels.getById(parseInt(id)),
  });

  const level = data?.data;

  // Populate form
  useEffect(() => {
    if (level) {
      reset({
        name: level.name,
        slug: level.slug,
        star: level.star,
        price: level.price,
        minClosing: level.minClosing,
        maxPeriod: level.maxPeriod,
        maintainClosing: level.maintainClosing,
        maintainPeriod: level.maintainPeriod,
        downgradeClosing: level.downgradeClosing,
        description: level.description || "",
        isActive: level.isActive,
        order: level.order,
        benefits: level.benefits?.length
          ? level.benefits
          : [{ title: "", description: "", order: 0 }],
      });
    }
  }, [level, reset]);

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      // Create a payload where null values are converted to undefined
      // to satisfy the service interface requirements
      const payload = {
        ...data,
        minClosing: data.minClosing ?? undefined,
        maxPeriod: data.maxPeriod ?? undefined,
        maintainClosing: data.maintainClosing ?? undefined,
        maintainPeriod: data.maintainPeriod ?? undefined,
        downgradeClosing: data.downgradeClosing ?? undefined,
      };

      return adminService.agentLevels.update(parseInt(id), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-levels"] });
      queryClient.invalidateQueries({ queryKey: ["agent-level", id] });
      toast({
        title: "✅ Level Berhasil Diupdate",
        description: "Perubahan telah disimpan",
      });
      router.push("/admin/master/agent-levels");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Level",
        description: getErrorMessage(error),
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const filteredBenefits = data.benefits.filter((b) => b.title.trim() !== "");
    updateMutation.mutate({
      ...data,
      benefits: filteredBenefits,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Level tidak ditemukan</p>
        <Link href="/admin/master/agent-levels">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/master/agent-levels">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Edit Level Agen
          </h1>
          <p className="text-gray-600 mt-1">Ubah data {level.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Level</CardTitle>
            <CardDescription>Data dasar level agen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Level <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Pra-Agent"
                  {...register("name", { required: "Nama wajib diisi" })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="pra-agent"
                  {...register("slug", { required: "Slug wajib diisi" })}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="star">
                  Bintang <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="star"
                  type="number"
                  min="0"
                  max="5"
                  {...register("star", {
                    required: "Bintang wajib diisi",
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  {...register("price")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Urutan</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  {...register("order", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi level..."
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  Level nonaktif tidak ditampilkan
                </p>
              </div>
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Syarat Naik Bintang */}
        <Card>
          <CardHeader>
            <CardTitle>Syarat Naik Bintang</CardTitle>
            <CardDescription>
              Syarat closing untuk naik ke level ini (via gratis)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minClosing">Minimal Closing</Label>
                <Input
                  id="minClosing"
                  type="number"
                  min="0"
                  {...register("minClosing", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPeriod">Maksimal Periode</Label>
                <Input
                  id="maxPeriod"
                  type="number"
                  min="0"
                  {...register("maxPeriod", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syarat Bertahan */}
        <Card>
          <CardHeader>
            <CardTitle>Syarat Bertahan/Downgrade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintainClosing">Min Closing Bertahan</Label>
                <Input
                  id="maintainClosing"
                  type="number"
                  min="0"
                  {...register("maintainClosing", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintainPeriod">Periode Bertahan</Label>
                <Input
                  id="maintainPeriod"
                  type="number"
                  min="0"
                  {...register("maintainPeriod", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downgradeClosing">Downgrade Jika</Label>
                <Input
                  id="downgradeClosing"
                  type="number"
                  min="0"
                  {...register("downgradeClosing", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                  <Input
                    placeholder="Benefit title"
                    {...register(`benefits.${index}.title` as const)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    {...register(`benefits.${index}.description` as const)}
                  />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({ title: "", description: "", order: fields.length })
              }
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Benefit
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 bg-secondary hover:bg-secondary/90"
            disabled={updateMutation.isPending}
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
          <Link href="/admin/master/agent-levels">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
