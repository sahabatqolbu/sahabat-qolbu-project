// dashboard/src/components/mobile/NotificationDropdownJamaah.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  CreditCard,
  FileText,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Clock,
  User,
  Plane,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

// Icon mapping
const notificationIcons: Record<string, any> = {
  JAMAAH_APPROVED: Check,
  JAMAAH_REJECTED: AlertCircle,
  PAYMENT_VERIFIED: CheckCheck,
  PAYMENT_CREATED: CreditCard,
  REMINDER_DOCUMENT: FileText,
  REMINDER_PAYMENT: CreditCard,
  REMINDER_PROFILE: User,
  REMINDER_GENERAL: MessageSquare,
  BOOKING_CREATED: Calendar,
  SYSTEM: Bell,
};

// Color mapping
const notificationColors: Record<string, string> = {
  JAMAAH_APPROVED: "bg-green-100 text-green-600",
  JAMAAH_REJECTED: "bg-red-100 text-red-600",
  PAYMENT_VERIFIED: "bg-green-100 text-green-600",
  PAYMENT_CREATED: "bg-emerald-100 text-emerald-600",
  REMINDER_DOCUMENT: "bg-orange-100 text-orange-600",
  REMINDER_PAYMENT: "bg-red-100 text-red-600",
  REMINDER_PROFILE: "bg-blue-100 text-blue-600",
  REMINDER_GENERAL: "bg-purple-100 text-purple-600",
  BOOKING_CREATED: "bg-indigo-100 text-indigo-600",
  SYSTEM: "bg-gray-100 text-gray-600",
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

export function NotificationDropdownJamaah() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications - reuse generic endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-notifications"],
    queryFn: () => adminService.notifications.getAll({ limit: 20 }),
    refetchInterval: 30000,
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => adminService.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jamaah-notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => adminService.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jamaah-notifications"] });
    },
  });

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
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
                Notifikasi dari admin dan agen akan muncul di sini
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
  );
}
