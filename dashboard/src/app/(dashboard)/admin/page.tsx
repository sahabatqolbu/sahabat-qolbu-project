// dashboard/src/app/(dashboard)/admin/page.tsx
"use client";

import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  TrendingUp,
  UserPlus,
  PackagePlus,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  // ✅ Single query untuk semua stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => adminService.dashboard.getStats(),
    staleTime: 30000, // Cache 30 detik
    refetchInterval: 60000, // Auto refresh setiap 1 menit
  });

  const stats = statsData?.data;

  const statCards = [
    {
      title: "Total User",
      value: stats?.users?.total || 0,
      subtitle: `${stats?.users?.admin || 0} Admin, ${
        stats?.users?.finance || 0
      } Finance`,
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/users",
    },
    {
      title: "Total Jamaah",
      value: stats?.users?.jamaah || 0,
      subtitle: `${stats?.jamaahData?.completed || 0} lengkap`,
      icon: Users,
      color: "bg-green-500",
      href: "/admin/jamaah",
    },
    {
      title: "Total Agen",
      value: stats?.users?.agen || 0,
      subtitle: `${stats?.agents?.pending || 0} pending approval`,
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/admin/agen",
    },
    {
      title: "Paket Aktif",
      value: `${stats?.packages?.active || 0}/${stats?.packages?.total || 0}`,
      subtitle: `${stats?.packages?.availableSeats || 0} seat tersisa`,
      icon: Package,
      color: "bg-orange-500",
      href: "/admin/packages",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
          Dashboard Admin
        </h1>
        <p className="text-gray-600 mt-1">
          Selamat datang kembali, {user?.fullName}! 👋
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/users/create">
          <Button className="bg-secondary hover:bg-secondary/90 text-primary font-medium">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah User
          </Button>
        </Link>
        <Link href="/admin/packages/create">
          <Button variant="outline">
            <PackagePlus className="h-4 w-4 mr-2" />
            Tambah Paket
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={index} href={stat.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {stat.subtitle}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pending Approvals Alert */}
      {stats?.agents?.pending > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    {stats.agents.pending} Agen Menunggu Approval
                  </p>
                  <p className="text-sm text-amber-700">
                    Segera review dan approve/reject
                  </p>
                </div>
              </div>
              <Link href="/admin/agen?status=PENDING">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Review Sekarang
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">User Terbaru</CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : stats?.recent?.users?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent.users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user.fullName?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.fullName || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="secondary"
                        className={
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "FINANCE"
                            ? "bg-green-100 text-green-800"
                            : user.role === "AGEN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        {user.role}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Belum ada user
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Packages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Paket Terbaru</CardTitle>
              <Link href="/admin/packages">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : stats?.recent?.packages?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent.packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pkg.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-900 font-semibold">
                          Rp{" "}
                          {parseFloat(
                            pkg.discountPrice || pkg.price || 0
                          ).toLocaleString("id-ID")}
                        </span>
                        {pkg.discountPrice &&
                          parseFloat(pkg.discountPrice) <
                            parseFloat(pkg.price) && (
                            <span className="text-gray-400 line-through">
                              Rp {parseFloat(pkg.price).toLocaleString("id-ID")}
                            </span>
                          )}
                        <span className="text-gray-500">
                          • {pkg.duration} Hari
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {pkg.remainingSeats}/{pkg.totalSeats}
                      </p>
                      <p className="text-xs text-gray-500">seat</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Belum ada paket
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Agents List */}
      {stats?.recent?.pendingAgents?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Agen Menunggu Approval
              </CardTitle>
              <Link href="/admin/agen?status=PENDING">
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.pendingAgents.map((agent: any) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-amber-700">
                        {agent.fullName?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{agent.fullName}</p>
                      <p className="text-xs text-gray-500">{agent.email}</p>
                    </div>
                  </div>
                  <Link href={`/admin/agen/${agent.id}`}>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status Sistem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 font-semibold">Database</p>
              </div>
              <p className="text-xs text-green-600 mt-1">Terhubung</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 font-semibold">
                  Email Service
                </p>
              </div>
              <p className="text-xs text-green-600 mt-1">Aktif</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800 font-semibold">Storage</p>
              </div>
              <p className="text-xs text-green-600 mt-1">Normal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
