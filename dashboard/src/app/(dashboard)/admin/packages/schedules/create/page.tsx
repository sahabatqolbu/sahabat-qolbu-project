"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PackageScheduleForm from "@/components/packages/PackageScheduleForm";
import { useToast } from "@/hooks/use-toast";
import { packageScheduleService, type PackageScheduleList } from "@/services/packageScheduleService";

export default function CreatePackageSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: packageScheduleService.create,
    onSuccess: () => { toast({ title: "Daftar jadwal berhasil dibuat" }); router.push("/admin/packages"); },
    onError: (error: any) => toast({ variant: "destructive", title: "Gagal menyimpan", description: error.response?.data?.message || "Periksa kembali semua baris jadwal." }),
  });
  return <div className="space-y-6"><div><Link href="/admin/packages"><Button variant="ghost" className="mb-3"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button></Link><h1 className="text-3xl font-bold">Buat Daftar Jadwal Bulanan</h1><p className="mt-1 text-gray-500">Masukkan banyak tanggal keberangkatan dalam satu program.</p></div><PackageScheduleForm saving={mutation.isPending} onSubmit={(data: PackageScheduleList) => mutation.mutate(data)} /></div>;
}
