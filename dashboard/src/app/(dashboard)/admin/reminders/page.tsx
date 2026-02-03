// dashboard/src/app/(dashboard)/admin/reminders/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Search,
  Loader2,
  Send,
  Users,
  UserCog,
  FileText,
  CreditCard,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Clock,
  Phone,
  MessageCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ✅ HELPER: Format phone for WhatsApp
const formatPhoneForWA = (phone: string): string => {
  if (!phone || phone === "-") return "";
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");
  // If starts with 0, replace with 62 (Indonesia)
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  // If doesn't start with country code, assume Indonesia
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
};

// ✅ HELPER: Generate WhatsApp message based on issues
const generateWAMessage = (item: any, type: "jamaah" | "agen"): string => {
  const allIssues = [
    ...(item.profileIssues || []),
    ...(item.documentIssues || []),
    ...(item.paymentIssues || []),
  ];

  let message = `Assalamualaikum ${item.fullName},\n\n`;
  message += `Kami dari Sahabat Qolbu ingin mengingatkan bahwa data Anda belum lengkap:\n\n`;

  allIssues.forEach((issue: string, idx: number) => {
    message += `${idx + 1}. ${issue}\n`;
  });

  if (item.deadline && item.daysUntilDeadline !== null) {
    if (item.daysUntilDeadline <= 0) {
      message += `\n⚠️ *Deadline sudah terlewat!*\n`;
    } else if (item.daysUntilDeadline <= 7) {
      message += `\n⚠️ *Deadline: ${item.daysUntilDeadline} hari lagi!*\n`;
    } else {
      message += `\n📅 Deadline: ${format(new Date(item.deadline), "dd MMMM yyyy", { locale: localeId })}\n`;
    }
  }

  message += `\nMohon segera lengkapi agar proses dapat dilanjutkan.\n`;
  message += `\nTerima kasih.\n`;
  message += `\n_Sahabat Qolbu_`;

  return encodeURIComponent(message);
};

// ✅ WhatsApp Button Component
const WhatsAppButton = ({
  phone,
  item,
  type,
}: {
  phone: string;
  item: any;
  type: "jamaah" | "agen";
}) => {
  const formattedPhone = formatPhoneForWA(phone);
  const message = generateWAMessage(item, type);
  const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

  if (!formattedPhone) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled className="h-8 w-8">
              <Phone className="h-4 w-4 text-gray-300" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No. HP tidak tersedia</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>Hubungi via WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Template pesan
const MESSAGE_TEMPLATES = {
  REMINDER_DOCUMENT: {
    jamaah: {
      title: "Pengingat: Lengkapi Dokumen Anda",
      message:
        "Assalamualaikum, mohon segera lengkapi dokumen pendaftaran Anda (KTP, Paspor, Foto, dll) agar proses pendaftaran dapat dilanjutkan. Terima kasih.",
    },
    agen: {
      title: "Pengingat: Upload Dokumen KTP",
      message:
        "Assalamualaikum, mohon segera upload foto KTP Anda untuk melengkapi proses pendaftaran agen. Terima kasih.",
    },
  },
  REMINDER_PAYMENT: {
    jamaah: {
      title: "Pengingat: Pembayaran Anda",
      message:
        "Assalamualaikum, kami ingatkan untuk segera melakukan pembayaran paket umrah Anda. Hubungi admin jika ada kendala. Terima kasih.",
    },
    agen: {
      title: "Pengingat: Bukti Pembayaran Registrasi",
      message:
        "Assalamualaikum, mohon upload bukti pembayaran registrasi agen Anda. Terima kasih.",
    },
  },
  REMINDER_PROFILE: {
    jamaah: {
      title: "Pengingat: Lengkapi Data Diri",
      message:
        "Assalamualaikum, mohon lengkapi data diri Anda di aplikasi. Terima kasih.",
    },
    agen: {
      title: "Pengingat: Lengkapi Profil Anda",
      message:
        "Assalamualaikum, mohon lengkapi data profil agen Anda (data diri, alamat, rekening bank) dan submit untuk approval. Terima kasih.",
    },
  },
  REMINDER_GENERAL: {
    jamaah: {
      title: "Pemberitahuan",
      message: "",
    },
    agen: {
      title: "Pemberitahuan",
      message: "",
    },
  },
};

export default function AdminRemindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [activeTab, setActiveTab] = useState<"jamaah" | "agen">("jamaah");
  const [filter, setFilter] = useState("all-issues");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminderType, setReminderType] = useState<string>("REMINDER_GENERAL");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  // ===== FETCH DATA =====
  const { data: jamaahData, isLoading: jamaahLoading } = useQuery({
    queryKey: ["reminders-jamaah", filter],
    queryFn: () => adminService.reminders.getJamaahList(filter),
    enabled: activeTab === "jamaah",
  });

  const { data: agenData, isLoading: agenLoading } = useQuery({
    queryKey: ["reminders-agen", filter],
    queryFn: () => adminService.reminders.getAgenList(filter),
    enabled: activeTab === "agen",
  });

  const jamaahList = jamaahData?.data?.data || [];
  const jamaahStats = jamaahData?.data?.stats || {};
  const agenList = agenData?.data?.data || [];
  const agenStats = agenData?.data?.stats || {};

  const currentList = activeTab === "jamaah" ? jamaahList : agenList;
  const currentStats = activeTab === "jamaah" ? jamaahStats : agenStats;
  const isLoading = activeTab === "jamaah" ? jamaahLoading : agenLoading;

  // Filter by search
  const filteredList = currentList.filter((item: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.fullName?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower) ||
      item.bookingNumber?.toLowerCase().includes(searchLower)
    );
  });

  // ===== SEND REMINDER MUTATION =====
  const sendReminderMutation = useMutation({
    mutationFn: (data: any) => {
      if (selectedIds.length === 1) {
        return adminService.reminders.send({
          userId: selectedIds[0],
          type: data.type,
          title: data.title,
          message: data.message,
        });
      } else {
        return adminService.reminders.sendBulk({
          userIds: selectedIds,
          type: data.type,
          title: data.title,
          message: data.message,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reminders-jamaah"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-agen"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setDialogOpen(false);
      setSelectedIds([]);
      resetForm();
      toast({
        title: "✅ Pengingat Terkirim",
        description: data.message || "Pengingat berhasil dikirim",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Mengirim",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // ===== HANDLERS =====
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredList.map((item: any) => item.userId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, userId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== userId));
    }
  };

  const openSendDialog = () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Pilih minimal 1 orang",
      });
      return;
    }
    setDialogOpen(true);
  };

  const applyTemplate = (type: string) => {
    setReminderType(type);
    const template = MESSAGE_TEMPLATES[type as keyof typeof MESSAGE_TEMPLATES];
    if (template) {
      const targetTemplate = template[activeTab as keyof typeof template];
      setReminderTitle(targetTemplate.title);
      setReminderMessage(targetTemplate.message);
    }
  };

  const resetForm = () => {
    setReminderType("REMINDER_GENERAL");
    setReminderTitle("");
    setReminderMessage("");
  };

  const handleSend = () => {
    if (!reminderTitle || !reminderMessage) {
      toast({
        variant: "destructive",
        title: "Judul dan pesan wajib diisi",
      });
      return;
    }
    sendReminderMutation.mutate({
      type: reminderType,
      title: reminderTitle,
      message: reminderMessage,
    });
  };

  // ===== RENDER DEADLINE (FIXED) =====
  const renderDeadline = (item: any) => {
    // ✅ Cek dulu apakah deadline ada dan valid
    if (!item.deadline || item.daysUntilDeadline === null) {
      return <span className="text-xs text-gray-400">-</span>;
    }

    // ✅ Validasi date object
    const deadlineDate = new Date(item.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return <span className="text-xs text-gray-400">-</span>;
    }

    if (item.daysUntilDeadline <= 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <Clock className="h-3 w-3 mr-1" />
          Terlewat!
        </Badge>
      );
    } else if (item.daysUntilDeadline <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          {item.daysUntilDeadline} hari lagi
        </Badge>
      );
    } else {
      return (
        <span className="text-xs text-gray-500">
          {format(deadlineDate, "dd MMM yyyy", { locale: localeId })}
        </span>
      );
    }
  };

  // ===== RENDER ISSUES =====
  const renderIssues = (item: any) => {
    const allIssues = [
      ...(item.profileIssues || []),
      ...(item.documentIssues || []),
      ...(item.paymentIssues || []),
    ];

    if (allIssues.length === 0) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Lengkap
        </Badge>
      );
    }

    return (
      <div className="space-y-1">
        {allIssues.slice(0, 2).map((issue: string, idx: number) => (
          <Badge
            key={idx}
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 text-xs block w-fit"
          >
            <AlertTriangle className="h-3 w-3 mr-1 inline" />
            {issue}
          </Badge>
        ))}
        {allIssues.length > 2 && (
          <span className="text-xs text-gray-500">
            +{allIssues.length - 2} lainnya
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Pengingat
          </h1>
          <p className="text-gray-600 mt-1">
            Kirim pengingat ke jamaah atau agen yang perlu melengkapi data
          </p>
        </div>

        {selectedIds.length > 0 && (
          <Button onClick={openSendDialog} className="gap-2">
            <Send className="h-4 w-4" />
            Kirim Notifikasi ke {selectedIds.length} orang
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "jamaah" | "agen");
          setSelectedIds([]);
          setFilter("all-issues");
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="jamaah" className="gap-2">
            <Users className="h-4 w-4" />
            Jamaah
          </TabsTrigger>
          <TabsTrigger value="agen" className="gap-2">
            <UserCog className="h-4 w-4" />
            Agen
          </TabsTrigger>
        </TabsList>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <Card
            className={`cursor-pointer hover:border-primary transition-colors ${filter === "all" ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {currentStats.total || 0}
              </span>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-red-500 transition-colors ${filter === "urgent" ? "border-red-500 bg-red-50" : ""}`}
            onClick={() => setFilter("urgent")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {currentStats.urgent || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-amber-500 transition-colors ${filter === "all-issues" ? "border-amber-500 bg-amber-50" : ""}`}
            onClick={() => setFilter("all-issues")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Perlu Diingatkan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-amber-600">
                  {currentStats.withAnyIssues || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-blue-500 transition-colors ${filter === "document" ? "border-blue-500 bg-blue-50" : ""}`}
            onClick={() => setFilter("document")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {currentStats.withDocumentIssues || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-emerald-500 transition-colors ${filter === "payment" ? "border-emerald-500 bg-emerald-50" : ""}`}
            onClick={() => setFilter("payment")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold">
                  {currentStats.withPaymentIssues || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, email, atau booking number..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent (≤7 hari)</SelectItem>
                  <SelectItem value="all-issues">Perlu Diingatkan</SelectItem>
                  <SelectItem value="document">
                    Dokumen Belum Lengkap
                  </SelectItem>
                  <SelectItem value="payment">Pembayaran Pending</SelectItem>
                  {activeTab === "agen" && (
                    <SelectItem value="profile">
                      Profil Belum Lengkap
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table Content - JAMAAH */}
        <TabsContent value="jamaah" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Jamaah</CardTitle>
              <CardDescription>
                {filteredList.length} jamaah ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedIds.length === filteredList.length &&
                              filteredList.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Masalah</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredList.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className={item.isUrgent ? "bg-red-50" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.userId)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(item.userId, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.fullName}</p>
                              <p className="text-xs text-gray-500">
                                {item.email}
                              </p>
                              <code className="text-xs bg-gray-100 px-1 rounded">
                                {item.bookingNumber}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {item.packageName}
                              </p>
                              {item.packageDepartureDate && (
                                <p className="text-xs text-gray-500">
                                  Berangkat:{" "}
                                  {format(
                                    new Date(item.packageDepartureDate),
                                    "dd MMM yyyy",
                                    { locale: localeId },
                                  )}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{renderDeadline(item)}</TableCell>
                          <TableCell>{renderIssues(item)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <WhatsAppButton
                                phone={item.phone}
                                item={item}
                                type="jamaah"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedIds([item.userId]);
                                        setDialogOpen(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kirim Notifikasi</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Content - AGEN */}
        <TabsContent value="agen" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Agen</CardTitle>
              <CardDescription>
                {filteredList.length} agen ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-12">
                  <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada data ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedIds.length === filteredList.length &&
                              filteredList.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Masalah</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredList.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className={item.isUrgent ? "bg-red-50" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.userId)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(item.userId, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {item.fullName?.charAt(0) || "A"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{item.fullName}</p>
                                <p className="text-xs text-gray-500">
                                  {item.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className="w-fit text-xs"
                              >
                                {item.status}
                              </Badge>
                              {item.isComplete ? (
                                <Badge className="bg-green-100 text-green-800 w-fit text-xs">
                                  Data Lengkap
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="w-fit text-xs"
                                >
                                  Belum Lengkap
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{renderDeadline(item)}</TableCell>
                          <TableCell>{renderIssues(item)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <WhatsAppButton
                                phone={item.phone}
                                item={item}
                                type="agen"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedIds([item.userId]);
                                        setDialogOpen(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kirim Notifikasi</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Reminder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Kirim Notifikasi
            </DialogTitle>
            <DialogDescription>
              Kirim notifikasi ke {selectedIds.length}{" "}
              {activeTab === "jamaah" ? "jamaah" : "agen"} yang dipilih.
              Notifikasi akan muncul di dashboard mereka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Buttons */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Template Cepat
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate("REMINDER_DOCUMENT")}
                  className="gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Dokumen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate("REMINDER_PAYMENT")}
                  className="gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  Pembayaran
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate("REMINDER_PROFILE")}
                  className="gap-1"
                >
                  <User className="h-3 w-3" />
                  Profil
                </Button>
              </div>
            </div>

            {/* Type */}
            <div>
              <Label>Tipe Pengingat</Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMINDER_DOCUMENT">📄 Dokumen</SelectItem>
                  <SelectItem value="REMINDER_PAYMENT">
                    💳 Pembayaran
                  </SelectItem>
                  <SelectItem value="REMINDER_PROFILE">👤 Profil</SelectItem>
                  <SelectItem value="REMINDER_GENERAL">📢 Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label>Judul</Label>
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Masukkan judul pengingat"
                className="mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label>Pesan</Label>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Masukkan pesan pengingat"
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendReminderMutation.isPending ||
                !reminderTitle ||
                !reminderMessage
              }
            >
              {sendReminderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Notifikasi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
