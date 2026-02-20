// dashboard/src/app/%28dashboard%29/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user) {
      console.log("❌ Not authenticated, redirecting to login");
      router.replace("/login");
      return;
    }

    if (user) {
      const defaultRoutes: Record<string, string> = {
        ADMIN: "/admin",
        FINANCE: "/finance",
        STAFF: "/staff",
        AGEN: "/agen",
        JAMAAH: "/jamaah",
      };

      const allowedPrefixes: Record<string, string[]> = {
        ADMIN: ["/admin"],
        FINANCE: ["/finance"],
        STAFF: ["/staff"],
        AGEN: ["/agen"],
        JAMAAH: ["/jamaah"],
      };

      const blockedStaffPrefixes = ["/staff/reports", "/staff/transactions"];
      if (
        user.role === "STAFF" &&
        blockedStaffPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
        )
      ) {
        router.replace("/staff");
        return;
      }

      if (user.role === "FINANCE") {
        const blockedFinancePatterns = [
          /^\/finance\/users\/create(?:\/|$)/,
          /^\/finance\/users\/[^/]+\/edit(?:\/|$)/,
          /^\/finance\/packages\/create(?:\/|$)/,
          /^\/finance\/packages\/[^/]+\/edit(?:\/|$)/,
          /^\/finance\/packages\/[^/]+\/itinerary(?:\/|$)/,
          /^\/finance\/jamaah\/create(?:\/|$)/,
          /^\/finance\/jamaah\/[^/]+\/edit(?:\/|$)/,
          /^\/finance\/agen\/[^/]+\/edit(?:\/|$)/,
        ];

        if (blockedFinancePatterns.some((pattern) => pattern.test(pathname))) {
          router.replace("/finance");
          return;
        }
      }

      const role = user.role;
      const isAllowed =
        allowedPrefixes[role]?.some(
          (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
        ) ?? false;

      if (!isAllowed) {
        router.replace(defaultRoutes[role] || "/login");
      }
    }
  }, [hasHydrated, user, pathname, router]);

  // Show loading during hydration
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading if not authenticated (before redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
