// dashboard/src/components/mobile/NotificationDropdownAgen.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  Check,
  CheckCheck,
  UserPlus,
  CreditCard,
  FileText,
  Users,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  Upload,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

// Icon mapping
const notificationIcons: Record<string, any> = {
  AGENT_APPROVED: Check,
  AGENT_REJECTED: AlertCircle,
  JAMAAH_REGISTERED: Users,
  JAMAAH_SUBMITTED: FileText,
  PAYMENT_CREATED: CreditCard,
  PAYMENT_VERIFIED: CheckCheck,
  REMINDER_DOCUMENT: FileText,
  REMINDER_PAYMENT: CreditCard,
  REMINDER_PROFILE: UserPlus,
  REMINDER_GENERAL: Bell,
  SYSTEM: Bell,
  AGENT_KTP_REUPLOAD: Upload,
  AGENT_DOCS_REQUEST: FileText,
};

// Color mapping
const notificationColors: Record<string, string> = {
  AGENT_APPROVED: "bg-green-100 text-green-600",
  AGENT_REJECTED: "bg-red-100 text-red-600",
  JAMAAH_REGISTERED: "bg-purple-100 text-purple-600",
  JAMAAH_SUBMITTED: "bg-amber-100 text-amber-600",
  PAYMENT_CREATED: "bg-emerald-100 text-emerald-600",
  PAYMENT_VERIFIED: "bg-green-100 text-green-600",
  REMINDER_DOCUMENT: "bg-orange-100 text-orange-600",
  REMINDER_PAYMENT: "bg-red-100 text-red-600",
  REMINDER_PROFILE: "bg-blue-100 text-blue-600",
  REMINDER_GENERAL: "bg-gray-100 text-gray-600",
  SYSTEM: "bg-gray-100 text-gray-600",
  AGENT_KTP_REUPLOAD: "bg-amber-100 text-amber-700",
  AGENT_DOCS_REQUEST: "bg-indigo-100 text-indigo-600",
};

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdownAgen() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeUploadNotif, setActiveUploadNotif] = useState<Notification | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["agen-notifications"],
    queryFn: () => adminService.agenNotifications.getAll({ limit: 20 }),
    refetchInterval: 30000,
  });

  // Fetch reminder stats
  const { data: reminderData } = useQuery({
    queryKey: ["agen-jamaah-reminders"],
    queryFn: () =>
      adminService.agenNotifications.getJamaahReminders("all-issues"),
    refetchInterval: 60000,
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  const reminderStats = reminderData?.data?.stats || {
    withAnyIssues: 0,
    urgent: 0,
  };

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => adminService.agenNotifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => adminService.agenNotifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-notifications"] });
    },
  });

  const uploadKtpMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !activeUploadNotif) {
        throw new Error("File dan notifikasi wajib dipilih");
      }
      return adminService.agenProfile.uploadKtp(selectedFile, activeUploadNotif.id);
    },
    onSuccess: (response: any) => {
      const uploadedUrl = response?.data?.url;
      const returnedAgentData = response?.data?.agent?.agentData;

      queryClient.setQueryData(["agen-profile"], (prev: any) => {
        if (!prev?.data) return prev;

        return {
          ...prev,
          data: {
            ...prev.data,
            agentData: {
              ...prev.data.agentData,
              ...(returnedAgentData || {}),
              ktpPhoto: uploadedUrl || returnedAgentData?.ktpPhoto || prev.data.agentData?.ktpPhoto,
              updatedAt:
                returnedAgentData?.updatedAt ||
                new Date().toISOString(),
            },
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ["agen-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      setUploadDialogOpen(false);
      setActiveUploadNotif(null);
      setSelectedFile(null);
      setUploadError(null);
      setIsOpen(false);
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.message || error.message || "Gagal upload");
    },
  });

  const isKtpReuploadExpired = (notif: Notification): boolean => {
    const created = new Date(notif.createdAt).getTime();
    if (Number.isNaN(created)) return true;
    const expiryHours = 72;
    return Date.now() > created + expiryHours * 60 * 60 * 1000;
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead && notif.type !== "AGENT_KTP_REUPLOAD") {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
    }
  };

  const totalBadge = unreadCount + reminderStats.withAnyIssues;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <Bell className="h-5 w-5 text-white" />
          {totalBadge > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifikasi</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-3 w-3 mr-1" />
                )}
                Tandai dibaca
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          {/* Jamaah Reminder Banner */}
          {reminderStats.withAnyIssues > 0 && (
            <Link href="/agen/reminders" onClick={() => setIsOpen(false)}>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm">
                        Jamaah Perlu Diingatkan
                      </p>
                      <p className="text-xs text-amber-700">
                        {reminderStats.withAnyIssues} jamaah belum lengkap
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-amber-600" />
                </div>
                {reminderStats.urgent > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                    <Clock className="h-3 w-3" />
                    {reminderStats.urgent} mendekati deadline!
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* Notification List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Tidak ada notifikasi</p>
              <p className="text-xs text-gray-400 mt-1">
                Notifikasi akan muncul di sini
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => {
                const Icon = notificationIcons[notif.type] || Bell;
                const colorClass =
                  notificationColors[notif.type] || "bg-gray-100 text-gray-600";

                const content = (
                  <div
                    className={`
                      flex gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors
                      ${!notif.isRead ? "bg-blue-50/50" : ""}
                    `}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${!notif.isRead ? "font-semibold" : "font-medium"} text-gray-900 line-clamp-1`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </p>
                    </div>
                  </div>
                );

                if (notif.type === "AGENT_KTP_REUPLOAD") {
                  const expired = isKtpReuploadExpired(notif) || notif.isRead;
                  return (
                    <div key={notif.id}>
                      <div onClick={(e) => e.stopPropagation()}>{content}</div>
                      <div className="px-4 pb-4 -mt-2">
                        <Button
                          className="w-full"
                          variant={expired ? "outline" : "default"}
                          disabled={expired}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveUploadNotif(notif);
                            setUploadDialogOpen(true);
                            setUploadError(null);
                            setSelectedFile(null);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {expired ? "Link Upload Kedaluwarsa" : "Upload Foto KTP"}
                        </Button>
                      </div>
                    </div>
                  );
                }

                return notif.link ? (
                  <Link
                    href={notif.link}
                    key={notif.id}
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
      </Sheet>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Ulang Foto KTP</DialogTitle>
            <DialogDescription>
              Pilih foto KTP baru. Setelah berhasil, permintaan ini akan otomatis dianggap selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                setUploadError(null);
              }}
            />
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
            <Button
              className="w-full"
              onClick={() => uploadKtpMutation.mutate()}
              disabled={!selectedFile || uploadKtpMutation.isPending}
            >
              {uploadKtpMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengupload...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
