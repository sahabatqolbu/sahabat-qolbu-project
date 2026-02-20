// dashboard/src/app/(dashboard)/admin/master/banks/edit/[id]/page.tsx
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
import { ArrowLeft, Save, Loader2, Landmark } from "lucide-react";
import Link from "next/link";

// Removed .default(true) to fix type mismatch with useForm
const bankSchema = z.object({
  bankName: z.string().min(2, "Nama bank wajib diisi"),
  accountNumber: z.string().min(5, "Nomor rekening minimal 5 digit"),
  accountName: z.string().min(3, "Nama pemilik rekening wajib diisi"),
  branch: z.string().optional(),
  isActive: z.boolean(),
});

type BankFormData = z.infer<typeof bankSchema>;

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

export default function EditBankPage() {
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
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
  });

  // ===== FETCH BANK DATA =====
  const { data, isLoading } = useQuery({
    queryKey: ["bank", id],
    queryFn: async () => {
      const res = await masterService.banks.getById(parseInt(id));
      return res;
    },
  });

  // Populate form when data is available
  useEffect(() => {
    if (data?.data) {
      const bank = data.data;
      reset({
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        branch: bank.branch || "",
        isActive: bank.isActive,
      });
    }
  }, [data, reset]);

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: (data: BankFormData) =>
      masterService.banks.update(parseInt(id), data),
    onSuccess: () => {
      toast({
        title: "✅ Rekening Bank Berhasil Diupdate",
      });
      router.push("/admin/master/banks");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Rekening",
        description: getErrorMessage(error),
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
        <Link href="/admin/master/banks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            Edit Rekening Bank
          </h1>
          <p className="text-gray-600 mt-1">Update rekening perusahaan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Informasi Rekening
            </CardTitle>
            <CardDescription>Detail rekening bank perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bankName">
                Nama Bank <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="BCA, Mandiri, BNI, BRI"
                {...register("bankName")}
              />
              {errors.bankName && (
                <p className="text-sm text-red-500">
                  {errors.bankName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Nomor Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  {...register("accountNumber")}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">
                  Atas Nama <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accountName"
                  placeholder="PT Sahabat Qolbu"
                  {...register("accountName")}
                />
                {errors.accountName && (
                  <p className="text-sm text-red-500">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Cabang (Opsional)</Label>
              <Input
                id="branch"
                placeholder="KCP Jakarta Pusat"
                {...register("branch")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  Rekening dapat dipilih untuk pembayaran
                </p>
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
          <Link href="/admin/master/banks" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
