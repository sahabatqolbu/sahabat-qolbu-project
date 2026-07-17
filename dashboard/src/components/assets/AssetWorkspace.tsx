"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { assetService, type Asset, type AssetStatus, type AssetType } from "@/services/assetService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const assetStatuses: AssetStatus[] = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST"];
export const assetTypes: AssetType[] = ["DEVICE", "ACCOUNT"];

export const statusLabels: Record<AssetStatus, string> = {
  AVAILABLE: "Tersedia",
  ASSIGNED: "Dipinjam",
  MAINTENANCE: "Maintenance",
  RETIRED: "Nonaktif",
  LOST: "Hilang",
};

export const typeLabels: Record<AssetType, string> = {
  DEVICE: "Device",
  ACCOUNT: "Akun",
};

export const statusClass = (status: AssetStatus) => {
  const classes: Record<AssetStatus, string> = {
    AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ASSIGNED: "border-slate-300 bg-slate-100 text-slate-700",
    MAINTENANCE: "border-yellow-200 bg-yellow-50 text-yellow-700",
    RETIRED: "border-slate-200 bg-slate-100 text-slate-600",
    LOST: "border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
};

const getSecondaryIdentity = (asset: Asset) => {
  if (asset.type === "DEVICE") return [asset.brand, asset.model, asset.serialNumber || asset.identifier].filter(Boolean).join(" / ");
  return [asset.platform, asset.accountUsername].filter(Boolean).join(" / ");
};

export default function AssetWorkspace() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const { user } = useAuthStore();
  const readOnly = user?.role !== "ADMIN";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [page, search, typeFilter, statusFilter],
  );

  const { data: assetData, isLoading } = useQuery({
    queryKey: ["assets", queryParams],
    queryFn: () => assetService.getAssets(queryParams),
  });

  const assets = assetData?.data || [];
  const pageStats = useMemo(
    () => assetStatuses.map((status) => ({ status, total: assets.filter((asset) => asset.status === status).length })),
    [assets],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Berhasil", description: "Aset berhasil dihapus" });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal dihapus",
        variant: "destructive",
      }),
  });

  const removeAsset = (asset: Asset) => {
    if (!window.confirm(`Hapus aset ${asset.name}?`)) return;
    deleteMutation.mutate(asset.id);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">Data Aset</h2>
            <p className="mt-1 text-sm text-slate-500">List dibuat ringkas. Detail teknis, dokumen, dan riwayat pindah ke halaman detail per aset.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-md border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700">Total: {assetData?.pagination.total || 0}</Badge>
            {!readOnly && (
              <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/assets/create"><Plus className="mr-2 h-4 w-4" /> Tambah Aset</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 px-4 py-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari kode, nama, kategori, serial, username..."
                className="h-10 border-slate-300 bg-white pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
              <SelectTrigger className="h-10 border-slate-300 bg-white md:w-40"><SelectValue placeholder="Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tipe</SelectItem>
                {assetTypes.map((type) => <SelectItem key={type} value={type}>{typeLabels[type]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="h-10 border-slate-300 bg-white md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {assetStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageStats.map(({ status, total }) => (
              <button
                key={status}
                type="button"
                onClick={() => { setStatusFilter(statusFilter === status ? "all" : status); setPage(1); }}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${statusFilter === status ? statusClass(status) : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
              >
                {statusLabels[status]}: {total}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[920px] text-sm">
            <TableHeader className="bg-slate-100">
              <TableRow className="hover:bg-slate-100">
                <TableHead className="font-bold text-slate-700">Aset</TableHead>
                <TableHead className="font-bold text-slate-700">Tipe / Kategori</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Pemegang</TableHead>
                <TableHead className="w-[210px] text-right font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-3 text-sm text-slate-500">Memuat data aset...</p>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-500">Belum ada data aset yang cocok dengan filter.</TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/70">
                    <TableCell>
                      <Link href={`/assets/${asset.id}`} className="font-semibold text-slate-950 hover:text-slate-700">{asset.name}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">{asset.assetCode}</span>
                        <span>{getSecondaryIdentity(asset) || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{typeLabels[asset.type]}</div>
                      <div className="text-xs text-slate-500">{asset.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded-md ${statusClass(asset.status)}`}>{statusLabels[asset.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {asset.activeAssignment?.holder ? (
                        <div>
                          <div className="font-medium text-slate-800">{asset.activeAssignment.holder.fullName}</div>
                          <div className="text-xs text-slate-500">{asset.activeAssignment.holder.role}</div>
                        </div>
                      ) : <span className="text-slate-400">Belum dipegang</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm"><Link href={`/assets/${asset.id}`}><Eye className="mr-1 h-4 w-4" /> Detail</Link></Button>
                        {!readOnly && <Button asChild variant="outline" size="sm"><Link href={`/assets/${asset.id}/edit`}><Pencil className="mr-1 h-4 w-4" /> Edit</Link></Button>}
                        {!readOnly && <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={deleteMutation.isPending} onClick={() => removeAsset(asset)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {assetData?.pagination && assetData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">Menampilkan {assets.length} dari {assetData.pagination.total} aset</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
              <span className="min-w-24 text-center text-xs font-medium text-slate-600">{assetData.pagination.page} / {assetData.pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === assetData.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Selanjutnya</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}