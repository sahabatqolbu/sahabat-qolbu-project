// dashboard/src/app/(dashboard)/admin/master/agent-levels/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { adminService } from "@/services/adminService";
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
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

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
  order: number;
  benefits: BenefitField[];
}

export default function CreateAgentLevelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      slug: "",
      star: 0,
      price: "0",
      minClosing: null,
      maxPeriod: null,
      maintainClosing: null,
      maintainPeriod: null,
      downgradeClosing: null,
      description: "",
      order: 0,
      benefits: [{ title: "", description: "", order: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "benefits",
  });

  // ===== CREATE MUTATION =====
  const createMutation = useMutation({
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
      return adminService.agentLevels.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-levels"] });
      toast({
        title: "✅ Level Berhasil Dibuat",
        description: "Level agen telah ditambahkan",
      });
      router.push("/admin/master/agent-levels");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Membuat Level",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Filter benefits yang kosong
    const filteredBenefits = data.benefits.filter((b) => b.title.trim() !== "");
    createMutation.mutate({
      ...data,
      benefits: filteredBenefits,
    });
  };

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
            Tambah Level Agen
          </h1>
          <p className="text-gray-600 mt-1">Buat level agen baru</p>
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
                {errors.star && (
                  <p className="text-sm text-red-500">{errors.star.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="0"
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
                  placeholder="1"
                  {...register("minClosing", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Contoh: 1 untuk Bintang 1, 5 untuk Bintang 2
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPeriod">Maksimal Periode</Label>
                <Input
                  id="maxPeriod"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register("maxPeriod", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Contoh: 3 periode untuk Bintang 1, 2 periode untuk Bintang 2
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syarat Bertahan */}
        <Card>
          <CardHeader>
            <CardTitle>Syarat Bertahan/Downgrade</CardTitle>
            <CardDescription>
              Syarat untuk mempertahankan level atau turun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintainClosing">Min Closing Bertahan</Label>
                <Input
                  id="maintainClosing"
                  type="number"
                  min="0"
                  placeholder="1"
                  {...register("maintainClosing", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintainPeriod">Periode Bertahan</Label>
                <Input
                  id="maintainPeriod"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register("maintainPeriod", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downgradeClosing">Downgrade Jika</Label>
                <Input
                  id="downgradeClosing"
                  type="number"
                  min="0"
                  placeholder="1"
                  {...register("downgradeClosing", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Untuk Bintang 2: turun jika cuma 1 closing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>
              Keuntungan yang didapat di level ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Benefit {index + 1}</Label>
                    <Input
                      placeholder="Ikut Training Gratis"
                      {...register(`benefits.${index}.title` as const)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Deskripsi (opsional)"
                      {...register(`benefits.${index}.description` as const)}
                    />
                  </div>
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
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
                Simpan Level
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
