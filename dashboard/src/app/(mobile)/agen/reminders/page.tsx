// dashboard/src/app/(mobile)/agen/reminders/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  ArrowLeft,
  Search,
  Loader2,
  Send,
  Users,
  FileText,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Phone,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

// Helper: Format phone for WhatsApp
const formatPhoneForWA = (phone: string): string => {
  if (!phone || phone === "-") return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
};

// Helper: Generate WA message
const generateWAMessage = (item: any): string => {
  const allIssues = [
    ...(item.documentIssues || []),
    ...(item.paymentIssues || []),
  ];

  let message = `Assalamualaikum ${item.fullName},\n\n`;
  message += `Saya dari Sahabat Qolbu ingin mengingatkan bahwa data Anda belum lengkap:\n\n`;

  allIssues.forEach((issue: string, idx: number) => {
    message += `${idx + 1}. ${issue}\n`;
  });

  if (
    item.deadline &&
    item.daysUntilDeadline !== null &&
    item.daysUntilDeadline >= 0
  ) {
    if (item.daysUntilDeadline <= 7) {
      message += `\n⚠️ *Deadline: ${item.daysUntilDeadline} hari lagi!*\n`;
    }
  }

  message += `\nMohon segera lengkapi agar proses dapat dilanjutkan.\n`;
  message += `\nTerima kasih 🙏`;

  return encodeURIComponent(message);
};

export default function AgenRemindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("all-issues");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJamaah, setSelectedJamaah] = useState<any>(null);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  // Fetch jamaah reminders
  const { data, isLoading } = useQuery({
    queryKey: ["agen-jamaah-reminders", filter],
    queryFn: () => adminService.agenNotifications.getJamaahReminders(filter),
  });

  const jamaahList = data?.data?.data || [];
  const stats = data?.data?.stats || {};

  // Filter by search
  const filteredList = jamaahList.filter((item: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.fullName?.toLowerCase().includes(searchLower) ||
      item.bookingNumber?.toLowerCase().includes(searchLower)
    );
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: () =>
      adminService.agenNotifications.sendReminder({
        jamaahUserId: selectedJamaah.userId,
        type: "REMINDER_GENERAL",
        title: reminderTitle,
        message: reminderMessage,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-jamaah-reminders"] });
      setDialogOpen(false);
      setSelectedJamaah(null);
      setReminderTitle("");
      setReminderMessage("");
      toast({
        title: "✅ Pengingat Terkirim",
        description: "Notifikasi berhasil dikirim ke jamaah",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Render deadline badge
  const renderDeadline = (item: any) => {
    if (!item.deadline || item.daysUntilDeadline === null) {
      return null;
    }

    const deadlineDate = new Date(item.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return null;
    }

    if (item.daysUntilDeadline <= 0) {
      return (
        <Badge className="bg-red-100 text-red-700 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Terlewat
        </Badge>
      );
    } else if (item.daysUntilDeadline <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-700 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {item.daysUntilDeadline} hari
        </Badge>
      );
    }
    return null;
  };

  // Open send dialog with pre-filled message
  const openSendDialog = (item: any) => {
    setSelectedJamaah(item);
    const allIssues = [
      ...(item.documentIssues || []),
      ...(item.paymentIssues || []),
    ];
    setReminderTitle("Pengingat: Lengkapi Data Pendaftaran");
    setReminderMessage(
      `Assalamualaikum ${item.fullName},\n\nMohon segera lengkapi:\n${allIssues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}\n\nTerima kasih.`,
    );
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 w-full md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/agen">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Pengingat Jamaah</h1>
            <p className="text-xs text-gray-500">
              {stats.withAnyIssues || 0} jamaah perlu diingatkan
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-4 gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`p-3 rounded-xl text-center transition-colors ${
            filter === "all" ? "bg-primary text-white" : "bg-white shadow-sm"
          }`}
        >
          <p className="text-lg font-bold">{stats.total || 0}</p>
          <p className="text-[10px]">Total</p>
        </button>
        <button
          onClick={() => setFilter("urgent")}
          className={`p-3 rounded-xl text-center transition-colors ${
            filter === "urgent" ? "bg-red-500 text-white" : "bg-white shadow-sm"
          }`}
        >
          <p className="text-lg font-bold">{stats.urgent || 0}</p>
          <p className="text-[10px]">Urgent</p>
        </button>
        <button
          onClick={() => setFilter("document")}
          className={`p-3 rounded-xl text-center transition-colors ${
            filter === "document"
              ? "bg-blue-500 text-white"
              : "bg-white shadow-sm"
          }`}
        >
          <p className="text-lg font-bold">{stats.withDocumentIssues || 0}</p>
          <p className="text-[10px]">Dokumen</p>
        </button>
        <button
          onClick={() => setFilter("payment")}
          className={`p-3 rounded-xl text-center transition-colors ${
            filter === "payment"
              ? "bg-emerald-500 text-white"
              : "bg-white shadow-sm"
          }`}
        >
          <p className="text-lg font-bold">{stats.withPaymentIssues || 0}</p>
          <p className="text-[10px]">Bayar</p>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama atau booking..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              Semua jamaah sudah lengkap!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tidak ada yang perlu diingatkan
            </p>
          </div>
        ) : (
          filteredList.map((item: any) => {
            const allIssues = [
              ...(item.documentIssues || []),
              ...(item.paymentIssues || []),
            ];
            const waPhone = formatPhoneForWA(item.phone);
            const waMessage = generateWAMessage(item);
            const waLink = waPhone
              ? `https://wa.me/${waPhone}?text=${waMessage}`
              : null;

            return (
              <Card
                key={item.id}
                className={`border-0 shadow-sm rounded-xl overflow-hidden ${
                  item.isUrgent ? "border-l-4 border-l-red-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {item.fullName}
                        </p>
                        {renderDeadline(item)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.bookingNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.packageName}
                      </p>
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="space-y-1 mb-3">
                    {allIssues.slice(0, 3).map((issue: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded"
                      >
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {issue}
                      </div>
                    ))}
                    {allIssues.length > 3 && (
                      <p className="text-xs text-gray-400 pl-2">
                        +{allIssues.length - 3} masalah lainnya
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openSendDialog(item)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Notifikasi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Send Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Kirim Notifikasi</DialogTitle>
            <DialogDescription>
              Kirim pengingat ke {selectedJamaah?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Judul</Label>
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Judul pengingat"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pesan</Label>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Isi pesan"
                rows={5}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => sendReminderMutation.mutate()}
              disabled={
                sendReminderMutation.isPending ||
                !reminderTitle ||
                !reminderMessage
              }
            >
              {sendReminderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav role="AGEN" />
    </div>
  );
}
