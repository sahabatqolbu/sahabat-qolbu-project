"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      // 🔥 ROLE-BASED REDIRECT
      const routes = {
        ADMIN: "/admin",
        FINANCE: "/finance",
        STAFF: "/staff",
        AGEN: "/agen",
        JAMAAH: "/jamaah",
      };
      router.replace(routes[user.role]);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Memuat...</p>
      </div>
    </div>
  );
}
