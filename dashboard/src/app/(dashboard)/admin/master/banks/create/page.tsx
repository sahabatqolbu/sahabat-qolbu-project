// dashboard/src/app/(dashboard)/admin/master/banks/create/page.tsx
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
import { ArrowLeft, Save, Loader2, Landmark } from "lucide-react";
import Link from "next/link";

// Removed .default(true) to ensure strict type compatibility
const bankSchema = z.object({
  bankName: z.string().min(2, "Nama bank wajib diisi"),
  accountNumber: z.string().min(5, "Nomor rekening minimal 5 digit"),
  accountName: z.string().min(3, "Nama pemilik rekening wajib diisi"),
  branch: z.string().optional(),
  isActive: z.boolean(),
});

type BankFormData = z.infer<typeof bankSchema>;

export default function CreateBankPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      isActive: true, // Default handled here
      bankName: "",
      accountNumber: "",
      accountName: "",
      branch: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BankFormData) => masterService.banks.create(data),
    onSuccess: () => {
      toast({
        title: "✅ Rekening Bank Berhasil Ditambahkan",
      });
      router.push("/admin/master/banks");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menambahkan Rekening",
        description: error.response?.data?.message,
      });
    },
  });

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
            Tambah Rekening Bank
          </h1>
          <p className="text-gray-600 mt-1">Tambah rekening perusahaan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
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
