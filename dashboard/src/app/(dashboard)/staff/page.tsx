"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboardPage from "../admin/page";
import { useAuthStore } from "@/stores/authStore";

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    if (user.role !== "STAFF") {
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        FINANCE: "/finance",
        STAFF: "/staff",
        AGEN: "/agen",
        JAMAAH: "/jamaah",
      };

      router.replace(roleRoutes[user.role] || "/login");
    }
  }, [user, router]);

  if (!user || user.role !== "STAFF") {
    return null;
  }

  return <AdminDashboardPage />;
}
