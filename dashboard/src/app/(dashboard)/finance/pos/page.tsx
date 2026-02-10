"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { jamaahService } from "@/services/jamaahService";
import { packageService } from "@/services/packageService";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, UserCheck } from "lucide-react";

export default function FinancePosPage() {
  const { toast } = useToast();
  const [bookingNumber, setBookingNumber] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [notifTitle, setNotifTitle] = useState("Informasi dari Tim Finance");
  const [notifMessage, setNotifMessage] = useState("");

  const { data: jamaahData, refetch: refetchJamaah, isFetching } = useQuery({
    queryKey: ["finance-pos-jamaah", bookingNumber],
    queryFn: () => jamaahService.getByBookingNumber(bookingNumber),
    enabled: false,
  });

  const { data: packagesData } = useQuery({
    queryKey: ["finance-pos-packages"],
    queryFn: () => packageService.getAll({ limit: 100 }),
  });

  const jamaah = jamaahData?.data;
  const packageList = packagesData?.data?.packages || [];

  const assignPackageMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/finance/pos/assign-package", {
        bookingNumber,
        packageId: Number(selectedPackageId),
      }),
    onSuccess: () => {
      toast({
        title: "✅ Berhasil",
        description: "Jamaah berhasil didaftarkan ke paket terpilih",
      });
      refetchJamaah();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description:
          error.response?.data?.message || "Gagal mendaftarkan jamaah ke paket",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/finance/pos/send-reminder", {
        bookingNumber,
        title: notifTitle,
        message: notifMessage,
      }),
    onSuccess: () => {
      toast({
        title: "✅ Notifikasi Terkirim",
        description: "Pesan berhasil dikirim ke akun jamaah",
      });
      setNotifMessage("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Gagal mengirim notifikasi",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
          POS Jamaah
        </h1>
        <p className="text-gray-600 mt-1">
          Daftarkan jamaah ke paket dan kirim notifikasi ke akun jamaah
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Jamaah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="booking">Nomor Booking</Label>
          <div className="flex gap-2">
            <Input
              id="booking"
              placeholder="Contoh: SQ-20260209-0001"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
            />
            <Button onClick={() => refetchJamaah()} disabled={!bookingNumber || isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
            </Button>
          </div>

          {jamaah && (
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="font-semibold text-gray-900">{jamaah.user?.fullName}</p>
              <p className="text-sm text-gray-600">{jamaah.user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{jamaah.bookingNumber}</Badge>
                <Badge variant="outline">{jamaah.package?.name || "Belum ada paket"}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftarkan ke Paket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih paket umrah" />
            </SelectTrigger>
            <SelectContent>
              {packageList.map((pkg: any) => (
                <SelectItem key={pkg.id} value={String(pkg.id)}>
                  {pkg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full"
            onClick={() => assignPackageMutation.mutate()}
            disabled={!jamaah || !selectedPackageId || assignPackageMutation.isPending}
          >
            {assignPackageMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Simpan Penempatan Paket
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kirim Notifikasi Jamaah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Judul notifikasi"
            />
          </div>
          <div className="space-y-2">
            <Label>Pesan</Label>
            <Textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Tulis pesan untuk jamaah..."
              rows={5}
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => sendNotificationMutation.mutate()}
            disabled={!jamaah || !notifTitle || !notifMessage || sendNotificationMutation.isPending}
          >
            {sendNotificationMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Kirim Notifikasi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
