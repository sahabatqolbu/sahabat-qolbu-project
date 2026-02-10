// dashboard/src/app/(mobile)/jamaah/waiting-approval/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  User,
  FileText,
  Phone,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function WaitingApprovalPage() {
  const router = useRouter();

  // Poll untuk cek status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
    refetchInterval: 10000, // Cek setiap 10 detik
  });

  const profile = data?.data;

  // Redirect logic
  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.registrationStatus === "APPROVED") {
        router.replace("/jamaah");
      } else if (
        profile.registrationStatus === "DRAFT" ||
        profile.registrationStatus === "PENDING_DOCUMENT" ||
        profile.registrationStatus === "REJECTED"
      ) {
        router.replace("/jamaah/onboarding");
      }
    }
  }, [isLoading, profile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 md:max-w-7xl md:px-6 mx-auto">
      <div className="max-w-sm w-full">
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-6 text-center text-white">
              <div className="relative mx-auto mb-4">
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                  <Clock className="h-10 w-10" />
                </div>
                <div className="absolute -bottom-1 -right-1 left-0 right-0 mx-auto w-6 h-6">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  </div>
                </div>
              </div>

              <h1 className="text-xl font-bold mb-1">Menunggu Verifikasi</h1>
              <p className="text-sm text-white/80">
                Data Anda sedang direview oleh admin
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="bg-amber-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-700 font-medium">
                    Status
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                    Dalam Review
                  </Badge>
                </div>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-amber-400 rounded-full animate-pulse" />
                </div>
                <p className="text-[10px] text-amber-600 mt-2">
                  Estimasi: 1-2 hari kerja
                </p>
              </div>

              {/* Booking Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">No. Booking</p>
                <p className="font-bold text-lg tracking-wider">
                  {profile?.bookingNumber}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">
                  Data yang sudah disubmit:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-700">Biodata</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-700">Dokumen</span>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cek Status
              </Button>

              {/* Contact */}
              {profile?.agen && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center mb-3">
                    Ada pertanyaan? Hubungi agen Anda
                  </p>
                  <a
                    href={`https://wa.me/${profile.agen.phone?.replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-green-500 hover:bg-green-600">
                      <Phone className="h-4 w-4 mr-2" />
                      Hubungi {profile.agen.fullName}
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Halaman ini akan otomatis refresh
        </p>
      </div>
    </div>
  );
}
