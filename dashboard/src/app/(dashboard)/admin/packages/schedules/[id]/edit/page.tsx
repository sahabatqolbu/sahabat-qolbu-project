"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PackageScheduleForm from "@/components/packages/PackageScheduleForm";
import { useToast } from "@/hooks/use-toast";
import { packageScheduleService, type PackageScheduleList } from "@/services/packageScheduleService";

export default function EditPackageSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scheduleId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["package-schedule-list", scheduleId], queryFn: () => packageScheduleService.getById(scheduleId), enabled: Number.isInteger(scheduleId) });
  const mutation = useMutation({
    mutationFn: (data: PackageScheduleList) => packageScheduleService.update(scheduleId, data),
    onSuccess: () => { toast({ title: "Daftar jadwal berhasil diperbarui" }); router.push("/admin/packages"); },
    onError: (error: any) => toast({ variant: "destructive", title: "Gagal menyimpan", description: error.response?.data?.message || "Periksa kembali semua baris jadwal." }),
  });
  const value = query.data?.data as PackageScheduleList | undefined;
  if (query.isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  return <div className="space-y-6"><div><Link href="/admin/packages"><Button variant="ghost" className="mb-3"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button></Link><h1 className="text-3xl font-bold">Edit Daftar Jadwal</h1><p className="mt-1 text-gray-500">Perubahan tersimpan untuk seluruh baris dalam daftar ini.</p></div>{value ? <PackageScheduleForm value={value} saving={mutation.isPending} onSubmit={(data) => mutation.mutate(data)} /> : <p>Daftar jadwal tidak ditemukan.</p>}</div>;
}
