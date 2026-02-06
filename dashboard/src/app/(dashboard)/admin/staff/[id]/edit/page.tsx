// dashboard/src/app/(dashboard)/admin/staff/[id]/edit/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "@/services/staffService";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const staffSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z.string().optional(),
  isActive: z.coerce.boolean(),
});

type StaffFormInput = z.input<typeof staffSchema>;
type StaffFormData = z.output<typeof staffSchema>;

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const staffId = parseInt(params.id as string);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormInput>({
    resolver: zodResolver(staffSchema),
  });

  // Fetch staff data
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffService.getStaffById(staffId),
    enabled: !isNaN(staffId),
  });

  // Set form values when data is loaded
  useEffect(() => {
    if (staffData?.data) {
      reset({
        fullName: staffData.data.fullName,
        phone: staffData.data.phone || "",
        isActive: staffData.data.isActive,
      });
    }
  }, [staffData, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: StaffFormData) =>
      staffService.updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Berhasil",
        description: "Data staff berhasil diperbarui",
      });
      router.push("/admin/staff");
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description:
          error.response?.data?.message || "Terjadi kesalahan saat memperbarui",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormInput) => {
    updateMutation.mutate(staffSchema.parse(data));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!staffData?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Staff tidak ditemukan</p>
        <Link href="/admin/staff">
          <Button variant="link">Kembali ke Daftar Staff</Button>
        </Link>
      </div>
    );
  }

  const staff = staffData.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Edit Staff</h1>
          <p className="text-gray-500 mt-1">Perbarui informasi staff {staff.fullName}</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informasi Staff</CardTitle>
          <CardDescription>
            Perbarui informasi staff. Email tidak dapat diubah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Masukkan nama lengkap"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={staff.email} disabled className="bg-gray-50" />
              <p className="text-sm text-gray-500">Email tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("isActive")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/admin/staff" className="flex-1">
                <Button variant="outline" className="w-full">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-secondary hover:bg-secondary/90 text-primary font-medium"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
