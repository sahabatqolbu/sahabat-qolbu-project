"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  UserCheck,
  Wallet,
  FileText,
} from "lucide-react";

// ✅ Bottom Nav Items (Custom per role - essentials only)
const getBottomNavItems = (role: string) => {
  const items: Record<string, any[]> = {
    ADMIN: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      { label: "Paket", href: "/admin/packages", icon: Package },
      { label: "Jamaah", href: "/admin/jamaah", icon: UserCheck },
      { label: "Transaksi", href: "/admin/transactions", icon: Wallet },
    ],
    FINANCE: [
      {
        label: "Dashboard",
        href: "/finance",
        icon: LayoutDashboard,
        exact: true,
      },
      { label: "Pembayaran", href: "/finance/payments", icon: Wallet },
      { label: "Komisi", href: "/finance/commissions", icon: Wallet },
      { label: "Laporan", href: "/finance/reports", icon: FileText },
    ],
    AGEN: [
      { label: "Dashboard", href: "/agen", icon: LayoutDashboard, exact: true },
      { label: "Jamaah", href: "/agen/jamaah", icon: Users },
      { label: "Paket", href: "/agen/packages", icon: Package },
      { label: "Komisi", href: "/agen/commissions", icon: Wallet },
    ],
    JAMAAH: [
      {
        label: "Dashboard",
        href: "/jamaah",
        icon: LayoutDashboard,
        exact: true,
      },
      { label: "Biodata", href: "/jamaah/profile", icon: UserCheck },
      { label: "Dokumen", href: "/jamaah/documents", icon: FileText },
      { label: "Bayar", href: "/jamaah/payments", icon: Wallet },
    ],
  };

  return items[role] || [];
};

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const bottomNavItems = getBottomNavItems(user.role);

  const isActive = (href?: string, exact?: boolean) => {
    if (!href) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="grid grid-cols-4 h-16">
        {bottomNavItems.map((item, index) => {
          const itemActive = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={`bottomnav-${item.href}-${index}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                itemActive ? "text-primary" : "text-gray-500"
              )}
            >
              {/* Active Indicator */}
              {itemActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
              )}

              <Icon className={cn("h-5 w-5", itemActive && "scale-110")} />

              <span
                className={cn(
                  "text-[10px] font-medium truncate max-w-[60px]",
                  itemActive && "font-semibold"
                )}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && (
                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
