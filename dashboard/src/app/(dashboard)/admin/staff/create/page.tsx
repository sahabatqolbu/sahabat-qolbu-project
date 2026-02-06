// dashboard/src/app/(dashboard)/admin/staff/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, UserPlus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const staffSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

export default function CreateStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: StaffFormData) => staffService.createStaff(data),
    onSuccess: (response) => {
      setCreatedStaff(response.data);
      setShowSuccessDialog(true);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Staff",
        description:
          error.response?.data?.message || "Terjadi kesalahan saat membuat staff",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormData) => {
    createMutation.mutate(data);
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    router.push("/admin/staff");
  };

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
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Tambah Staff Baru</h1>
          <p className="text-gray-500 mt-1">
            Buat akun staff baru untuk mengelola sistem
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informasi Staff</CardTitle>
          <CardDescription>
            Masukkan informasi lengkap staff baru. Password akan dibuat secara
            otomatis dan dikirim ke email.
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
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-sm text-gray-500">
                Password login akan dikirim ke email ini
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                {...register("phone")}
              />
              <p className="text-sm text-gray-500">Opsional</p>
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Buat Staff
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Staff Berhasil Dibuat
            </DialogTitle>
            <DialogDescription>
              Akun staff telah berhasil dibuat. Password login dikirim langsung
              ke email staff.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Nama:</strong> {createdStaff?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {createdStaff?.email}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p>
                <strong>Catatan:</strong> Demi keamanan, password tidak ditampilkan
                di dashboard. Jika staff tidak menerima email, gunakan fitur reset
                password.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseSuccess} className="w-full">
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
