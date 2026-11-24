"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2, MessageCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { jamaahService, type CreatedDataLink } from "@/services/jamaahService";

const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "-";

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Permintaan gagal";

export default function DataLinkDialog({ bookingNumber }: { bookingNumber: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedDataLink | null>(null);
  const queryKey = ["jamaah-data-link", bookingNumber];

  const status = useQuery({
    queryKey,
    queryFn: () => jamaahService.getDataLink(bookingNumber),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () => jamaahService.createDataLink(bookingNumber),
    onSuccess: (link) => {
      setCreated(link);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal membuat link", description: errorMessage(error) }),
  });

  const revokeMutation = useMutation({
    mutationFn: () => jamaahService.revokeDataLink(bookingNumber),
    onSuccess: () => {
      setCreated(null);
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Link dicabut", description: "Link lama tidak bisa dipakai lagi." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal mencabut link", description: errorMessage(error) }),
  });

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} disalin` });
    } catch {
      toast({ variant: "destructive", title: "Tidak bisa menyalin", description: "Salin manual dari kotak di atas." });
    }
  };

  const active = status.data?.active;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setCreated(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Link2 className="mr-2 h-4 w-4" /> Link isi data</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link pengisian data jamaah</DialogTitle>
          <DialogDescription>
            Jamaah cukup membuka link ini di HP untuk mengisi datanya sendiri, tanpa membuat akun atau password.
            Satu link berlaku untuk semua anggota keluarga di akun ini.
          </DialogDescription>
        </DialogHeader>

        {status.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border border-gray-200 p-3">
              {active ? (
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">Link aktif sampai {dateTime(status.data?.expiresAt)}</p>
                  <p className="text-gray-600">
                    {status.data?.lastUsedAt
                      ? `Terakhir dibuka jamaah ${dateTime(status.data.lastUsedAt)} (${status.data.useCount}x)`
                      : "Belum pernah dibuka jamaah"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">Belum ada link aktif.</p>
              )}
            </div>

            {created && (
              <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="break-all font-mono text-xs text-gray-800">{created.url}</p>
                <p className="text-xs text-gray-500">Link hanya ditampilkan sekali. Buat link baru bila perlu mengirim ulang.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {created.whatsappUrl ? (
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                      <a href={created.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Kirim via WhatsApp</a>
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-700 sm:col-span-2">Nomor HP jamaah belum ada. Salin pesan lalu kirim manual.</p>
                  )}
                  <Button variant="outline" onClick={() => copy(created.message, "Pesan")}><Copy className="mr-2 h-4 w-4" /> Salin pesan</Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                {active ? "Buat link baru" : "Buat link"}
              </Button>
              {active && (
                <Button variant="outline" className="text-red-700" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>
                  <XCircle className="mr-2 h-4 w-4" /> Cabut link
                </Button>
              )}
            </div>
            {active && !created && (
              <p className="text-xs text-gray-500">Membuat link baru otomatis mematikan link lama.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
