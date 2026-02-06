// dashboard/src/app/(dashboard)/admin/reports/page.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
} from "recharts";
import {
    Loader2,
    TrendingUp,
    Users,
    CreditCard,
    Target,
    ArrowUpRight,
} from "lucide-react";

// Helpet transform month numbers to names
const getMonthName = (month: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return months[month - 1] || month;
};

export default function ReportsPage() {
    // Fetch Sales Stats
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ["admin", "reports", "sales"],
        queryFn: () => adminService.reports.getSales(),
    });

    // Fetch Growth Stats
    const { data: growthData, isLoading: growthLoading } = useQuery({
        queryKey: ["admin", "reports", "growth"],
        queryFn: () => adminService.reports.getGrowth(),
    });

    if (salesLoading || growthLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const salesStats = salesData?.data || { summary: {}, byPackage: [] };
    const growthStats = growthData?.data || { userGrowth: [], bookingGrowth: [] };

    // Combine growth tables for chart
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const chartData = months.map(m => {
        const user = growthStats.userGrowth.find((u: any) => u.month === m);
        const booking = growthStats.bookingGrowth.find((b: any) => b.month === m);
        return {
            name: getMonthName(m),
            users: user?.count || 0,
            bookings: booking?.count || 0,
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Laporan & Statistik</h1>
                <p className="text-gray-600 mt-1">Analisis performa bisnis Sahabat Qolbu</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Pendapatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            <p className="text-2xl font-bold text-gray-900">
                                Rp {new Intl.NumberFormat("id-ID").format(salesStats.summary.totalRevenue || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Target className="w-5 h-5 text-blue-600" />
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{salesStats.summary.totalTransactions || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Invoice terverifikasi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Pendapatan Rata-rata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <TrendingUp className="w-5 h-5 text-violet-600" />
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                    Rp {new Intl.NumberFormat("id-ID").format(
                                        salesStats.summary.totalTransactions > 0
                                            ? (salesStats.summary.totalRevenue / salesStats.summary.totalTransactions)
                                            : 0
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Per transaksi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Pertumbuhan Pengguna & Booking</CardTitle>
                        <CardDescription>Visualisasi bulanan di tahun {new Date().getFullYear()}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    name="User Baru"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bookings"
                                    name="Booking Baru"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorBookings)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Revenue by Package Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Pendapatan per Paket</CardTitle>
                        <CardDescription>Distribusi nominal dari paket terpopuler</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesStats.byPackage} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="packageName"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11 }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    formatter={(value: any) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="totalRevenue"
                                    name="Pendapatan"
                                    fill="#fbbf24"
                                    radius={[0, 4, 4, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
