// dashboard/src/components/dashboard/NotificationDropdown.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ExternalLink,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

// Icon mapping berdasarkan type
const notificationIcons: Record<string, any> = {
  AGENT_REGISTERED: UserPlus,
  AGENT_SUBMITTED: FileText,
  AGENT_APPROVED: Check,
  AGENT_REJECTED: AlertCircle,
  JAMAAH_REGISTERED: Users,
  JAMAAH_SUBMITTED: FileText,
  JAMAAH_APPROVED: Check,
  PAYMENT_CREATED: CreditCard,
  PAYMENT_VERIFIED: CheckCheck,
  BOOKING_CREATED: FileText,
  SYSTEM: Bell,
  REMINDER_DOCUMENT: FileText,
  REMINDER_PAYMENT: CreditCard,
  REMINDER_PROFILE: UserPlus,
  REMINDER_GENERAL: Bell,
};

// Color mapping
const notificationColors: Record<string, string> = {
  AGENT_REGISTERED: "bg-blue-100 text-blue-600",
  AGENT_SUBMITTED: "bg-amber-100 text-amber-600",
  AGENT_APPROVED: "bg-green-100 text-green-600",
  AGENT_REJECTED: "bg-red-100 text-red-600",
  JAMAAH_REGISTERED: "bg-purple-100 text-purple-600",
  JAMAAH_SUBMITTED: "bg-amber-100 text-amber-600",
  JAMAAH_APPROVED: "bg-green-100 text-green-600",
  PAYMENT_CREATED: "bg-emerald-100 text-emerald-600",
  PAYMENT_VERIFIED: "bg-green-100 text-green-600",
  BOOKING_CREATED: "bg-indigo-100 text-indigo-600",
  SYSTEM: "bg-gray-100 text-gray-600",
  REMINDER_DOCUMENT: "bg-orange-100 text-orange-600",
  REMINDER_PAYMENT: "bg-red-100 text-red-600",
  REMINDER_PROFILE: "bg-blue-100 text-blue-600",
  REMINDER_GENERAL: "bg-gray-100 text-gray-600",
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

export function NotificationDropdown() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const canUseAdminNotifFeatures = user?.role === "ADMIN" || user?.role === "STAFF";

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => adminService.notifications.getAll({ limit: 10 }),
    refetchInterval: 30000,
  });

  // Fetch reminder stats (untuk shortcut di atas)
  const { data: reminderData } = useQuery({
    queryKey: ["reminder-stats"],
    queryFn: async () => {
      const [jamaah, agen] = await Promise.all([
        adminService.reminders.getJamaahList("all-issues"),
        adminService.reminders.getAgenList("all-issues"),
      ]);
      return {
        jamaahCount: jamaah?.data?.stats?.withAnyIssues || 0,
        agenCount: agen?.data?.stats?.withAnyIssues || 0,
        urgentCount: jamaah?.data?.stats?.urgent || 0,
      };
    },
    refetchInterval: 60000,
    enabled: canUseAdminNotifFeatures,
  });

  const { data: pendingApprovalsData } = useQuery({
    queryKey: ["pending-agent-approvals"],
    queryFn: () => adminService.notifications.getPendingAgentApprovals(),
    refetchInterval: 30000,
    enabled: canUseAdminNotifFeatures,
  });

  const { data: dashboardStatsData } = useQuery({
    queryKey: ["admin-dashboard-stats-lite"],
    queryFn: () => adminService.dashboard.getStats(),
    refetchInterval: 30000,
    enabled: canUseAdminNotifFeatures,
  });

  const { data: pendingAgentsData } = useQuery({
    queryKey: ["admin-pending-agents-dropdown"],
    queryFn: () =>
      adminService.agen.getAll({
        status: "PENDING",
      }),
    refetchInterval: 30000,
    enabled: canUseAdminNotifFeatures,
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  const reminderStats = reminderData || {
    jamaahCount: 0,
    agenCount: 0,
    urgentCount: 0,
  };
  const totalReminders = reminderStats.jamaahCount + reminderStats.agenCount;
  const pendingApprovalsFromNotifApi =
    pendingApprovalsData?.data?.pendingApprovals ||
    pendingApprovalsData?.pendingApprovals ||
    0;
  const pendingApprovalsFromStatsApi =
    dashboardStatsData?.data?.agents?.pending ||
    dashboardStatsData?.agents?.pending ||
    0;
  const pendingApprovalsFromAgenApi =
    pendingAgentsData?.data?.length ||
    pendingAgentsData?.data?.agents?.length ||
    pendingAgentsData?.agents?.length ||
    0;
  const pendingApprovals = Math.max(
    pendingApprovalsFromNotifApi,
    pendingApprovalsFromStatsApi,
    pendingApprovalsFromAgenApi,
  );
  const todaySubmitted =
    pendingApprovalsData?.data?.todaySubmitted ||
    pendingApprovalsData?.todaySubmitted ||
    0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => adminService.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => adminService.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Handle notification click
  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount > 0 || totalReminders > 0 || pendingApprovals > 0) && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500">
              {pendingApprovals > 0
                ? pendingApprovals > 9
                  ? "9+"
                  : pendingApprovals
                : unreadCount > 0
                ? unreadCount > 9
                  ? "9+"
                  : unreadCount
                : totalReminders}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 md:w-96">
        {canUseAdminNotifFeatures && pendingApprovals > 0 && (
          <>
            <Link href="/admin/agen" onClick={() => setIsOpen(false)}>
              <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-colors cursor-pointer border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900 text-sm">
                        Approval Agen Menunggu
                      </p>
                      <p className="text-xs text-red-700">
                        {pendingApprovals} akun agen perlu ditinjau
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-600" />
                </div>
                {todaySubmitted > 0 && (
                  <p className="mt-2 text-xs text-red-700 font-medium">
                    +{todaySubmitted} pengajuan baru hari ini
                  </p>
                )}
              </div>
            </Link>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ✅ REMINDER SHORTCUT - BAGIAN PALING ATAS */}
        {canUseAdminNotifFeatures && totalReminders > 0 && (
          <>
            <Link href="/admin/reminders" onClick={() => setIsOpen(false)}>
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm">
                        Perlu Diingatkan
                      </p>
                      <p className="text-xs text-amber-700">
                        {reminderStats.jamaahCount} jamaah,{" "}
                        {reminderStats.agenCount} agen
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-amber-600" />
                </div>
                {reminderStats.urgentCount > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                    <Clock className="h-3 w-3" />
                    {reminderStats.urgentCount} mendekati deadline!
                  </div>
                )}
              </div>
            </Link>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0 text-base">
            Notifikasi
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-primary hover:text-primary"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notification List */}
        <div className="h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notif) => {
                const Icon = notificationIcons[notif.type] || Bell;
                const colorClass =
                  notificationColors[notif.type] || "bg-gray-100 text-gray-600";

                const content = (
                  <div
                    className={`
                      flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
                      ${!notif.isRead ? "bg-blue-50/50" : ""}
                    `}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
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

                    {/* Link indicator */}
                    {notif.link && (
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                );

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

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="ghost" className="w-full text-sm">
                  Lihat Semua Notifikasi
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
