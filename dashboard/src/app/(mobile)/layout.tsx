// dashboard/src/app/%28mobile%29/layout.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Loader2,
  Package,
  UserCircle,
  Users,
} from "lucide-react";

const isDevelopment = process.env.NODE_ENV === "development";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();

  const isAgenDesktop = pathname?.startsWith("/agen") && user?.role === "AGEN";
  const isAgenHome = pathname === "/agen";
  const isJamaahDesktop =
    pathname?.startsWith("/jamaah") && user?.role === "JAMAAH";
  const isJamaahHome = pathname === "/jamaah";

  const desktopAgenNav = [
    { href: "/agen", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agen/jamaah", label: "Jamaah", icon: Users },
    { href: "/agen/website", label: "Website", icon: Globe },
    { href: "/agen/calendar", label: "Kalender", icon: Calendar },
    { href: "/agen/profile", label: "Profil", icon: UserCircle },
  ];

  const desktopJamaahNav = [
    { href: "/jamaah", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jamaah/packages", label: "Paket", icon: Package },
    { href: "/jamaah/documents", label: "Dokumen", icon: FileText },
    { href: "/jamaah/payments", label: "Pembayaran", icon: CreditCard },
    { href: "/jamaah/profile", label: "Profil", icon: UserCircle },
    { href: "/jamaah/calendar", label: "Kalender", icon: Calendar },
  ];

  const isActivePath = (href: string) => {
    if (!pathname) return false;
    if (href === "/agen" || href === "/jamaah") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      if (isDevelopment) {
        console.log("❌ Not authenticated, redirecting to login");
      }
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  // Loading states
  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAgenDesktop && (
        <div className="hidden md:block border-b bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!isAgenHome && (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="text-xs text-gray-500">Area Agen</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Navigasi Desktop
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {desktopAgenNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isJamaahDesktop && (
        <div className="hidden md:block border-b bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!isJamaahHome && (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="text-xs text-gray-500">Area Jamaah</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Navigasi Desktop
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {desktopJamaahNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Tanpa Sidebar & Header Desktop */}
      {/* ✅ Cuma render children langsung */}
      {children}
    </div>
  );
}
