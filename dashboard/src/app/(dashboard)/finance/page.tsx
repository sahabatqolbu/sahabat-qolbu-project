"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Clock } from "lucide-react";

export default function FinanceDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== "FINANCE") {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  const stats = [
    {
      title: "Menunggu Verifikasi",
      value: "12",
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Transaksi Hari Ini",
      value: "Rp 45 Juta",
      icon: Receipt,
      color: "bg-green-500",
    },
    {
      title: "Komisi Pending",
      value: "Rp 8.5 Juta",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Total Bulan Ini",
      value: "Rp 125 Juta",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
          Dashboard Finance
        </h1>
        <p className="text-gray-600 mt-1">Kelola transaksi dan keuangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaksi Menunggu Verifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Belum ada data</p>
        </CardContent>
      </Card>
    </div>
  );
}
