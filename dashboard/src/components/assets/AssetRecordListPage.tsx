"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { assetService, type AssignmentStatus } from "@/services/assetService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusLabel: Record<AssignmentStatus, string> = {
  ACTIVE: "Aktif",
  RETURNED: "Sudah Kembali",
};

const statusClass: Record<AssignmentStatus, string> = {
  ACTIVE: "border-slate-300 bg-slate-100 text-slate-700",
  RETURNED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function AssetAssignmentListPage({ mode }: { mode: "handover" | "returns" }) {
  const [page, setPage] = useState(1);
  const status = mode === "handover" ? "ACTIVE" : "RETURNED";
  const title = mode === "handover" ? "List Serah Terima" : "List Pengembalian";
  const description = mode === "handover" ? "Aset yang sedang aktif dipegang oleh staff/admin/finance." : "Riwayat aset yang sudah dikembalikan.";

  const { data, isLoading } = useQuery({
    queryKey: ["asset-assignments", status, page],
    queryFn: () => assetService.getAssignments({ status, page, limit: 20 }),
  });

  const rows = data?.data || [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[920px] text-sm">
          <TableHeader className="bg-slate-100">
            <TableRow className="hover:bg-slate-100">
              <TableHead className="font-bold text-slate-700">Aset</TableHead>
              <TableHead className="font-bold text-slate-700">Pemegang</TableHead>
              <TableHead className="font-bold text-slate-700">Tanggal</TableHead>
              <TableHead className="font-bold text-slate-700">Kondisi</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-slate-400" />Memuat data...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500">Belum ada data.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/70">
                <TableCell>
                  <Link href={`/assets/${row.assetId}`} className="font-semibold text-slate-950 hover:text-slate-700">{row.asset?.name || "-"}</Link>
                  <div className="mt-1 font-mono text-xs font-semibold text-slate-500">{row.asset?.assetCode || "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-800">{row.holder?.fullName || "-"}</div>
                  <div className="text-xs text-slate-500">{row.holder?.role || "-"}</div>
                </TableCell>
                <TableCell>
                  <div>Serah: {row.assignedAt}</div>
                  <div className="text-xs text-slate-500">{mode === "returns" ? `Kembali: ${row.returnedAt || "-"}` : `Estimasi: ${row.expectedReturnAt || "-"}`}</div>
                </TableCell>
                <TableCell>
                  <div>{mode === "returns" ? row.returnCondition || "-" : row.initialCondition}</div>
                  <div className="max-w-xs truncate text-xs text-slate-500">{mode === "returns" ? row.returnNotes || row.notes || "-" : row.purpose}</div>
                </TableCell>
                <TableCell><Badge variant="outline" className={`rounded-md ${statusClass[row.status]}`}>{statusLabel[row.status]}</Badge></TableCell>
                <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/assets/${row.assetId}`}>Detail Aset</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">Menampilkan {rows.length} dari {data.pagination.total} data</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
            <span className="min-w-24 text-center text-xs font-medium text-slate-600">{data.pagination.page} / {data.pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Selanjutnya</Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function AssetDocumentListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["asset-documents", page],
    queryFn: () => assetService.getDocuments({ page, limit: 20 }),
  });
  const rows = data?.data || [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">List Dokumen Aset</h2>
        <p className="text-sm text-slate-500">Semua PDF surat serah terima dan pengembalian aset.</p>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[880px] text-sm">
          <TableHeader className="bg-slate-100">
            <TableRow className="hover:bg-slate-100">
              <TableHead className="font-bold text-slate-700">Dokumen</TableHead>
              <TableHead className="font-bold text-slate-700">Aset</TableHead>
              <TableHead className="font-bold text-slate-700">Pemegang</TableHead>
              <TableHead className="font-bold text-slate-700">Tanggal Dibuat</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-slate-400" />Memuat dokumen...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-500">Belum ada dokumen.</TableCell></TableRow>
            ) : rows.map((document) => (
              <TableRow key={document.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/70">
                <TableCell>
                  <div className="flex items-center gap-2 font-semibold text-slate-950"><FileText className="h-4 w-4" />{document.documentNumber}</div>
                  <div className="mt-1 text-xs text-slate-500">{document.type === "HANDOVER" ? "Serah Terima" : "Pengembalian"}</div>
                </TableCell>
                <TableCell>
                  <Link href={`/assets/${document.assetId}`} className="font-semibold text-slate-900 hover:text-slate-700">{document.asset?.name || "-"}</Link>
                  <div className="mt-1 font-mono text-xs text-slate-500">{document.asset?.assetCode || "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-800">{document.holder?.fullName || "-"}</div>
                  <div className="text-xs text-slate-500">{document.holder?.role || "-"}</div>
                </TableCell>
                <TableCell>{document.createdAt}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => assetService.downloadDocument(document.assetId, document.id, document.fileName)}><Download className="mr-2 h-4 w-4" />PDF</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">Menampilkan {rows.length} dari {data.pagination.total} dokumen</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
            <span className="min-w-24 text-center text-xs font-medium text-slate-600">{data.pagination.page} / {data.pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Selanjutnya</Button>
          </div>
        </div>
      )}
    </section>
  );
}