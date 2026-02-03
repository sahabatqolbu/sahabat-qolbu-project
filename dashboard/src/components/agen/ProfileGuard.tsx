"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileGuardProps {
  children: React.ReactNode;
  requireComplete?: boolean; // Wajib profil lengkap?
  requireApproved?: boolean; // Wajib sudah approved?
}

export function ProfileGuard({
  children,
  requireComplete = true,
  requireApproved = false,
}: ProfileGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
    retry: 1,
  });

  const profile = data?.data;
  const agentData = profile?.agentData;

  useEffect(() => {
    if (!isLoading && profile) {
      const isProfilePage = pathname === "/agen/profile";
      const isComplete = agentData?.isComplete;
      const isApproved = agentData?.status === "APPROVED";

      // ✅ PAKSA KE PROFILE KALAU BELUM LENGKAP
      if (requireComplete && !isComplete && !isProfilePage) {
        console.log(
          "🚫 BLOCKED: Profil belum lengkap, redirect ke /agen/profile"
        );
        router.replace("/agen/profile");
        return;
      }

      // ✅ PAKSA NUNGGU APPROVAL KALAU DIPERLUKAN
      if (requireApproved && !isApproved && pathname !== "/agen") {
        console.log("🚫 BLOCKED: Belum approved, redirect ke /agen");
        router.replace("/agen");
        return;
      }
    }
  }, [
    isLoading,
    profile,
    agentData,
    pathname,
    requireComplete,
    requireApproved,
    router,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  // ✅ SHOW WARNING KALAU BELUM COMPLETE TAPI MASIH DI PROFILE PAGE
  if (
    requireComplete &&
    !agentData?.isComplete &&
    pathname === "/agen/profile"
  ) {
    return (
      <>
        <div className="bg-red-50 border-b-2 border-red-200 p-4">
          <div className="flex items-start gap-3 max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-900">
              <strong>⚠️ Profil Wajib Dilengkapi</strong>
              <p className="mt-1">
                Anda tidak bisa mengakses fitur lain sebelum profil lengkap dan
                disubmit.
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
