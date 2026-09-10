"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Edit, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { packageScheduleService, type PackageScheduleList } from "@/services/packageScheduleService";

export default function ScheduleListAdminSection({ readOnly = false }: { readOnly?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["package-schedule-lists"], queryFn: packageScheduleService.getAll });
  const remove = useMutation({
    mutationFn: packageScheduleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-schedule-lists"] });
      toast({ title: "Daftar jadwal berhasil dihapus" });
    },
    onError: (error: any) => toast({ variant: "destructive", title: "Gagal menghapus", description: error.response?.data?.message }),
  });
  const lists: PackageScheduleList[] = query.data?.data?.lists || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-secondary" /> Daftar Jadwal Bulanan</CardTitle>
        <CardDescription>Jadwal ringkas dengan pilihan tanggal, hotel, maskapai, rute, dan harga kamar.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : lists.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">Belum ada daftar jadwal bulanan.</div>
        ) : (
          <div className="divide-y rounded-lg border">
            {lists.map((list) => (
              <div key={list.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{list.name}</p>
                    <Badge variant={list.isPublished ? "default" : "secondary"}>{list.isPublished ? "Publik" : "Draft"}</Badge>
                    {!list.isActive ? <Badge variant="outline">Nonaktif</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{list.month} · {list.items.length} jadwal keberangkatan</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/packages/schedules/${list.id}/edit`}><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button></Link>
                  {!readOnly ? <Button variant="outline" size="sm" className="text-red-600" disabled={remove.isPending} onClick={() => { if (window.confirm(`Hapus ${list.name}?`)) remove.mutate(Number(list.id)); }}><Trash2 className="mr-2 h-4 w-4" />Hapus</Button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
