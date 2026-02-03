"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Loader2,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Users,
} from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ProfileGuard } from "@/components/agen/ProfileGuard";

export default function CommissionsPage() {
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // ===== FETCH COMMISSION DATA =====
  const { data, isLoading } = useQuery({
    queryKey: ["commissions", periodFilter],
    queryFn: () => agenService.getCommission(),
  });

  const commissionData = data?.data || {
    total: 0,
    pending: 0,
    paid: 0,
    history: [],
  };

  // Helper: Get Status Badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      VERIFIED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    return config[status] || config.PENDING;
  };

  return (
    <ProfileGuard requireComplete={true}>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl">
          <div className="text-center mb-6">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h1 className="text-2xl font-bold">Komisi Saya</h1>
            <p className="text-sm opacity-90 mt-1">
              Pendapatan dari closing jamaah
            </p>
          </div>

          {/* Total Balance Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm opacity-90 mb-2">Total Komisi</p>
              <p className="text-4xl font-bold mb-1">
                Rp {commissionData.total.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <div>
                  <p className="opacity-75">Pending</p>
                  <p className="font-bold">
                    Rp {commissionData.pending.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/30" />
                <div>
                  <p className="opacity-75">Sudah Dibayar</p>
                  <p className="font-bold">
                    Rp {commissionData.paid.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <p className="text-xs text-gray-600">Rate Komisi</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">10%</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <p className="text-xs text-gray-600">Total Closing</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionData.history?.length || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="this-month">Bulan Ini</SelectItem>
                  <SelectItem value="last-month">Bulan Lalu</SelectItem>
                  <SelectItem value="this-year">Tahun Ini</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Komisi</CardTitle>
              <CardDescription>
                {commissionData.history?.length || 0} transaksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !commissionData.history ||
                commissionData.history.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Belum ada komisi masuk
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Closing jamaah untuk dapat komisi
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissionData.history.map((item: any) => {
                    const statusConfig = getStatusBadge(item.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {item.jamaahName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.packageName}
                            </p>
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {item.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(item.date), "dd MMM yyyy", {
                                locale: localeId,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-600">
                              Rp {item.amount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdraw Button (if available) */}
          {commissionData.paid > 0 && (
            <Card className="border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Saldo Tersedia
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Rp {commissionData.paid.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600">
                    <Download className="mr-2 h-4 w-4" />
                    Tarik Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}
