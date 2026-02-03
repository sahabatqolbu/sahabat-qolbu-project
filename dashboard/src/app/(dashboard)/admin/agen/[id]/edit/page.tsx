"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FormData {
  fullName: string;
  phone: string;
  isActive: boolean;
  fullNameKtp: string;
  nickname: string;
  birthPlace: string;
  birthDate: string;
  nik: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  instagram: string;
  tiktok: string;
  currentStar: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  status: string;
  isComplete: boolean;
}

export default function EditAgenPage({ params }: PageProps) {
  const { id: agentId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // ===== FETCH AGENT =====
  const { data, isLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => adminService.agen.getById(parseInt(agentId)),
  });

  const agent = data?.data;
  const agentData = agent?.agentData;

  // Populate form
  useEffect(() => {
    if (agent) {
      reset({
        fullName: agent.fullName || "",
        phone: agent.phone || "",
        isActive: agent.isActive ?? true,
        fullNameKtp: agentData?.fullNameKtp || "",
        nickname: agentData?.nickname || "",
        birthPlace: agentData?.birthPlace || "",
        birthDate: agentData?.birthDate
          ? new Date(agentData.birthDate).toISOString().split("T")[0]
          : "",
        nik: agentData?.nik || "",
        address: agentData?.address || "",
        province: agentData?.province || "",
        city: agentData?.city || "",
        postalCode: agentData?.postalCode || "",
        instagram: agentData?.instagram || "",
        tiktok: agentData?.tiktok || "",
        currentStar: agentData?.currentStar || 0,
        accountName: agentData?.accountName || "",
        accountNumber: agentData?.accountNumber || "",
        bankName: agentData?.bankName || "",
        status: agentData?.status || "DRAFT",
        isComplete: agentData?.isComplete || false,
      });
    }
  }, [agent, agentData, reset]);

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      adminService.agen.update(parseInt(agentId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      toast({
        title: "✅ Data Agen Berhasil Diupdate",
        description: "Perubahan telah disimpan",
      });
      router.push(`/admin/agen/${agentId}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Data",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
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

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agen tidak ditemukan</p>
        <Link href="/admin/agen">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/agen/${agentId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Edit Data Agen
          </h1>
          <p className="text-gray-600 mt-1">Ubah data {agent.fullName}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>Data user dari table users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email (Read Only)</Label>
              <Input value={agent.email} disabled className="bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  Agen nonaktif tidak dapat login
                </p>
              </div>
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullNameKtp">Nama Sesuai KTP</Label>
                <Input
                  id="fullNameKtp"
                  {...register("fullNameKtp")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nama Panggilan</Label>
                <Input
                  id="nickname"
                  {...register("nickname")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  {...register("nik")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input
                  id="birthPlace"
                  {...register("birthPlace")}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Alamat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                rows={3}
                {...register("address")}
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Input
                  id="province"
                  {...register("province")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Kota/Kabupaten</Label>
                <Input
                  id="city"
                  {...register("city")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Kode Pos</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>Media Sosial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="username"
                  {...register("instagram")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  placeholder="username"
                  {...register("tiktok")}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input
                  id="bankName"
                  {...register("bankName")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Nama Rekening</Label>
                <Input
                  id="accountName"
                  {...register("accountName")}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input
                  id="accountNumber"
                  {...register("accountNumber")}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Agen</CardTitle>
            <CardDescription>
              Pengaturan bintang dan status approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bintang</Label>
                <Select
                  value={watch("currentStar")?.toString()}
                  onValueChange={(value) =>
                    setValue("currentStar", parseInt(value))
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pra-Agent</SelectItem>
                    <SelectItem value="1">Bintang 1</SelectItem>
                    <SelectItem value="2">Bintang 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Approval</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Data Lengkap</Label>
                <p className="text-sm text-gray-500">
                  Tandai jika semua data sudah lengkap
                </p>
              </div>
              <Switch
                checked={watch("isComplete")}
                onCheckedChange={(checked) => setValue("isComplete", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
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
          <Link href={`/admin/agen/${agentId}`}>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
