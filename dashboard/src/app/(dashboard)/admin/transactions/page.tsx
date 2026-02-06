"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Wallet,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Status helpers
const getStatusBadge = (status: string) => {
    switch (status) {
        case "PAID":
        case "VERIFIED":
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Lunas / Terverifikasi</Badge>;
        case "PENDING":
            return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Menunggu</Badge>;
        case "PARTIAL":
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Cicil</Badge>;
        case "CANCELLED":
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Dibatalkan</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function TransactionsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Fetch Transactions
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["admin", "transactions", { search, statusFilter }],
        queryFn: () => adminService.transactions.getAll({
            search,
            status: statusFilter === "all" ? undefined : statusFilter
        }),
    });

    // Verify Mutation
    const verifyMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.transactions.verify(id, { status }),
        onSuccess: () => {
            toast.success("Status transaksi berhasil diperbarui");
            queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
            setIsDetailOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Gagal memperbarui transaksi");
        }
    });

    const txList = transactions?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Data Transaksi</h1>
                    <p className="text-gray-600 mt-1">Pantau semua aliran dana dan pembayaran jamaah</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 text-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari Invoice atau Nama Jamaah..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="PENDING">Menunggu</SelectItem>
                                    <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                                    <SelectItem value="PAID">Lunas</SelectItem>
                                    <SelectItem value="PARTIAL">Cicilan</SelectItem>
                                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[150px]">No. Invoice</TableHead>
                                    <TableHead>Jamaah</TableHead>
                                    <TableHead>Paket</TableHead>
                                    <TableHead>Total Tagihan</TableHead>
                                    <TableHead>Telah Dibayar</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : txList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                                            Tidak ada transaksi ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    txList.map((tx: any) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">{tx.invoiceNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">{tx.jamaah?.user?.fullName}</span>
                                                    <span className="text-xs text-gray-500">{tx.jamaah?.bookingNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{tx.package?.name}</TableCell>
                                            <TableCell className="font-medium text-gray-900">
                                                Rp {new Intl.NumberFormat("id-ID").format(tx.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-primary font-bold">
                                                Rp {new Intl.NumberFormat("id-ID").format(tx.paidAmount)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedTx(tx);
                                                        setIsDetailOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>Invoice: {selectedTx?.invoiceNumber}</DialogDescription>
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 mb-1">Nama Jamaah</p>
                                    <p className="font-bold">{selectedTx.jamaah?.user?.fullName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 mb-1">Paket</p>
                                    <p className="font-bold">{selectedTx.package?.name}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 mb-1">Metode Bayar</p>
                                    <Badge variant="outline">{selectedTx.paymentMethod || "Belum dipilih"}</Badge>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 mb-1">Waktu Transaksi</p>
                                    <p className="font-bold">
                                        {format(new Date(selectedTx.createdAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-lg">
                                    <span>Total Tagihan:</span>
                                    <span className="font-bold">Rp {new Intl.NumberFormat("id-ID").format(selectedTx.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-primary">
                                    <span>Telah Dibayar:</span>
                                    <span className="font-bold">Rp {new Intl.NumberFormat("id-ID").format(selectedTx.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-red-600 font-bold">
                                    <span>Sisa Pelunasan:</span>
                                    <span>Rp {new Intl.NumberFormat("id-ID").format(selectedTx.remainingAmount)}</span>
                                </div>
                            </div>

                            {selectedTx.status === "PENDING" && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        className="flex-1 bg-secondary hover:bg-secondary/90 text-primary font-medium"
                                        onClick={() => verifyMutation.mutate({ id: selectedTx.id, status: "VERIFIED" })}
                                        disabled={verifyMutation.isPending}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Terima Pembayaran
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => verifyMutation.mutate({ id: selectedTx.id, status: "CANCELLED" })}
                                        disabled={verifyMutation.isPending}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Batalkan
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
