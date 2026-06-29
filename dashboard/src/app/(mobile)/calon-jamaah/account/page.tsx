"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Mail, Phone, ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useAuthStore } from "@/stores/authStore";
import { prospectService } from "@/services/prospectService";

export default function CalonJamaahAccountPage() {
  const { user, logout } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["prospect-summary", "account"],
    queryFn: () => prospectService.getSummary(),
    staleTime: 30_000,
  });

  const summaryUser = data?.data?.user;
  const prospect = data?.data?.prospect;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <header className="border-b bg-white px-4 py-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold text-gray-900">Akun Calon Jamaah</h1>
          <p className="mt-1 text-sm text-gray-500">
            Data dasar ini dipakai admin untuk follow up dan membantu proses pendaftaran.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5 md:px-8">
        {isLoading ? (
          <Skeleton className="h-56 rounded-2xl" />
        ) : (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <UserCircle className="h-9 w-9" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {summaryUser?.fullName || user?.fullName || "Calon Jamaah"}
                  </p>
                  <p className="text-sm text-gray-500">Status: Calon Jamaah</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <InfoRow icon={Mail} label="Email" value={summaryUser?.email || user?.email || "-"} />
                <InfoRow icon={Phone} label="WhatsApp" value={summaryUser?.phone || user?.phone || "-"} />
                <InfoRow icon={ShieldCheck} label="Follow up" value={prospect?.followUpStatus || "BARU"} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Link href="/calon-jamaah/packages">
              <Button className="w-full">Lihat Paket</Button>
            </Link>
            <Link href="/calon-jamaah/consultation">
              <Button variant="outline" className="w-full">Minta Konsultasi</Button>
            </Link>
            <Button variant="destructive" className="w-full" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNav role="CALON_JAMAAH" />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
