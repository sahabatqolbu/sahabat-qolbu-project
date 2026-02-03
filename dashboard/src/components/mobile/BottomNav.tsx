// dashboard/src/components/mobile/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCircle,
  Package,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const agenNav = [
  { href: "/agen", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agen/jamaah", label: "Jamaah", icon: Users },
  { href: "/agen/packages", label: "Paket", icon: Package },
  { href: "/agen/commissions", label: "Komisi", icon: DollarSign },
  { href: "/agen/profile", label: "Profil", icon: UserCircle },
];

const jamaahNav = [
  { href: "/jamaah", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/jamaah/packages", label: "Paket", icon: Package },
  { href: "/jamaah/payments", label: "Bayar", icon: CreditCard },
  { href: "/jamaah/documents", label: "Dokumen", icon: FileText },
  { href: "/jamaah/profile", label: "Profil", icon: UserCircle },
];

// ✅ PATHS DI MANA BOTTOM NAV DISEMBUNYIKAN
const HIDE_BOTTOM_NAV_PATHS = [
  "/agen/profile",
  "/agen/payment",
  "/agen/jamaah/create",
  "/agen/register",
  "/jamaah/profile",
  "/jamaah/onboarding", // ✅ TAMBAH
  "/jamaah/waiting-approval", // ✅ TAMBAH
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export function BottomNav({ role }: { role: "AGEN" | "JAMAAH" }) {
  const pathname = usePathname();
  const navItems: NavItem[] = role === "AGEN" ? agenNav : jamaahNav;

  // ✅ CHECK: Hide bottom nav kalau di form pages
  const shouldHide = HIDE_BOTTOM_NAV_PATHS.some((path) =>
    pathname?.startsWith(path),
  );

  if (shouldHide) {
    return null;
  }

  // ✅ FIX: Improved isActive logic
  const checkIsActive = (item: NavItem): boolean => {
    if (!pathname) return false;

    // Untuk item dengan exact: true (Dashboard), hanya match exact path
    if (item.exact) {
      return pathname === item.href;
    }

    // Untuk item lain, match exact atau startsWith
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = checkIsActive(item);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
