// dashboard/src/app/(mobile)/agen/jamaah/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Plus,
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/mobile/BottomNav";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ProfileGuard } from "@/components/agen/ProfileGuard";

export default function JamaahListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dataFilter, setDataFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["my-jamaah", search, statusFilter],
    queryFn: () =>
      agenService.getMyJamaah({
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  // ✅ DEBUG - TAMBAHKAN INI
  console.log("========= DEBUG =========");
  console.log("isLoading:", isLoading);
  console.log("error:", data);
  console.log("data (full):", data);
  console.log("data?.success:", data?.success);
  console.log("data?.data:", data?.data);
  console.log("data?.data?.jamaah:", data?.data?.jamaah);
  console.log("=========================");

  let jamaahList = data?.data?.jamaah || [];


  // ===== HELPER: Check Profile Completeness (SAMA dengan detail page) =====
  const checkProfileComplete = (jamaah: any) => {
    const requiredFields = [
      jamaah.namaPaspor,
      jamaah.nik,
      jamaah.birthDate,
      jamaah.birthPlace,
      jamaah.gender,
      jamaah.maritalStatus,
      jamaah.address,
      jamaah.province,
      jamaah.city,
      jamaah.passportNumber,
      jamaah.passportExpiry,
      jamaah.passportIssuePlace,
      jamaah.emergencyName,
      jamaah.emergencyPhone,
      jamaah.packageId,
      jamaah.roomTypeMakkah,
      jamaah.roomTypeMadinah,
    ];

    const requiredDocs = [
      jamaah.fotoUrl,
      jamaah.ktpUrl,
      jamaah.kkUrl,
      jamaah.pasporUrl,
    ];

    const allFields = [...requiredFields, ...requiredDocs];
    const filled = allFields.filter(
      (val) => val && val !== "" && val !== null,
    ).length;
    const total = allFields.length;
    const percentage = Math.round((filled / total) * 100);

    return {
      isComplete: percentage >= 80,
      percentage,
      filled,
      total,
    };
  };

  // Filter kelengkapan data (pakai fungsi yang sama)
  if (dataFilter !== "all") {
    jamaahList = jamaahList.filter((j: any) => {
      const status = checkProfileComplete(j);
      if (dataFilter === "complete") return status.isComplete;
      if (dataFilter === "incomplete") return !status.isComplete;
      return true;
    });
  }

  // Recalculate stats dengan logic yang sama
  const recalculatedStats = {
    total: jamaahList.length,
    complete: jamaahList.filter((j: any) => checkProfileComplete(j).isComplete)
      .length,
    incomplete: jamaahList.filter(
      (j: any) => !checkProfileComplete(j).isComplete,
    ).length,
    lunas: jamaahList.filter((j: any) => j.statusPayment === "LUNAS").length,
  };

  return (
    <ProfileGuard requireComplete={true}>
      <div className="min-h-screen bg-gray-50 pb-24 lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-7 w-7" />
                Jamaah Saya
              </h1>
              <p className="text-sm opacity-90 mt-1">
                {recalculatedStats.complete}/{recalculatedStats.total} data
                lengkap
              </p>
            </div>
            <Link href="/agen/jamaah/create">
              <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/40">
                <Plus className="h-5 w-5 mr-2" />
                Tambah
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau booking number..."
              className="pl-10 bg-white/20 backdrop-blur-lg border-white/40 text-white placeholder:text-white/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_DOCUMENT">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dataFilter} onValueChange={setDataFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="complete">Lengkap</SelectItem>
                    <SelectItem value="incomplete">Belum Lengkap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jamaahList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {search || statusFilter !== "all" || dataFilter !== "all"
                    ? "Tidak ada hasil"
                    : "Belum ada jamaah"}
                </p>
                <Link href="/agen/jamaah/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Jamaah
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jamaahList.map((jamaah: any) => {
                const profileStatus = checkProfileComplete(jamaah);

                return (
                  <Card
                    key={jamaah.id}
                    className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                    onClick={() => router.push(`/agen/jamaah/${jamaah.id}`)}
                  >
                    <CardContent>
                      <div className="flex items-start justify-between">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                          {/* Nama & Status Icon */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {jamaah.namaPaspor ||
                                jamaah.user?.fullName ||
                                "Belum ada nama"}
                            </h3>
                            {profileStatus.isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>

                          {/* Booking Number */}
                          <p className="text-xs text-gray-500 font-mono mb-2">
                            {jamaah.bookingNumber}
                          </p>

                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            {/* Data Status - Simple: Lengkap / Belum Lengkap */}
                            <Badge
                              variant="outline"
                              className={`text-xs ${profileStatus.isComplete
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                            >
                              {profileStatus.isComplete ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lengkap
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Belum Lengkap
                                </>
                              )}
                            </Badge>

                            {/* Payment Status */}
                            <Badge
                              variant="outline"
                              className={`text-xs ${jamaah.statusPayment === "LUNAS"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : jamaah.statusPayment === "CICILAN"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                }`}
                            >
                              {jamaah.statusPayment === "LUNAS"
                                ? "Lunas"
                                : jamaah.statusPayment === "CICILAN"
                                  ? "Cicilan"
                                  : "Belum Bayar"}
                            </Badge>
                          </div>

                          {/* Package Info */}
                          {jamaah.package ? (
                            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                              <div className="flex items-start gap-2">
                                <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {jamaah.package.title ||
                                      jamaah.package.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {jamaah.package.type}
                                    </Badge>
                                    {jamaah.package.departureDate && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(
                                          new Date(
                                            jamaah.package.departureDate,
                                          ),
                                          "dd MMM yyyy",
                                          { locale: localeId },
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Package className="h-4 w-4" />
                                <p className="text-sm">Belum pilih paket</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Arrow */}
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-3 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}
