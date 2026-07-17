"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Loader2, Pencil, RotateCcw, Send } from "lucide-react";
import { assetService, type AssetStatus } from "@/services/assetService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assetStatuses, statusClass, statusLabels, typeLabels } from "./AssetWorkspace";

const today = () => new Date().toISOString().slice(0, 10);

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value || <span className="font-normal text-slate-400">-</span>}</div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-semibold text-slate-800">{label}</Label>
      {children}
    </div>
  );
}

export default function AssetDetailPage({ assetId }: { assetId: number }) {
  const { user } = useAuthStore();
  const readOnly = user?.role !== "ADMIN";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ holderUserId: "", assignedAt: today(), initialCondition: "Baik", purpose: "Operasional kerja", notes: "", expectedReturnAt: "" });
  const [returnForm, setReturnForm] = useState({ returnedAt: today(), returnCondition: "Baik", returnNotes: "", nextStatus: "AVAILABLE" as Exclude<AssetStatus, "ASSIGNED"> });

  const { data, isLoading } = useQuery({ queryKey: ["asset-detail", assetId], queryFn: () => assetService.getAsset(assetId) });
  const { data: holderData } = useQuery({ queryKey: ["asset-holders"], queryFn: () => assetService.getHolders(), enabled: !readOnly });
  const asset = data?.data;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["asset-detail", assetId] });
  };

  const assignMutation = useMutation({
    mutationFn: () => assetService.assignAsset(assetId, { holderUserId: Number(assignForm.holderUserId), assignedAt: assignForm.assignedAt, initialCondition: assignForm.initialCondition, purpose: assignForm.purpose, notes: assignForm.notes || undefined, expectedReturnAt: assignForm.expectedReturnAt || undefined }),
    onSuccess: () => { refresh(); setAssignOpen(false); toast({ title: "Berhasil", description: "Serah terima aset dibuat dan PDF digenerate" }); },
    onError: (error: any) => toast({ title: "Gagal", description: error.response?.data?.message || "Serah terima gagal", variant: "destructive" }),
  });

  const returnMutation = useMutation({
    mutationFn: () => assetService.returnAsset(assetId, returnForm),
    onSuccess: () => { refresh(); setReturnOpen(false); toast({ title: "Berhasil", description: "Pengembalian aset diproses dan PDF digenerate" }); },
    onError: (error: any) => toast({ title: "Gagal", description: error.response?.data?.message || "Pengembalian gagal", variant: "destructive" }),
  });

  if (isLoading) return <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Memuat detail aset...</div>;
  if (!asset) return <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">Aset tidak ditemukan.</div>;

  const identity = asset.type === "DEVICE" ? [asset.brand, asset.model, asset.serialNumber || asset.identifier].filter(Boolean).join(" / ") : [asset.platform, asset.accountUsername].filter(Boolean).join(" / ");

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Button asChild variant="ghost" className="mb-3 -ml-3 text-slate-600"><Link href="/assets"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke list</Link></Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{asset.assetCode}</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{asset.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{identity || "Detail identitas belum dilengkapi"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`rounded-md px-3 py-1.5 ${statusClass(asset.status)}`}>{statusLabels[asset.status]}</Badge>
            {!readOnly && <Button asChild variant="outline"><Link href={`/assets/${asset.id}/edit`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link></Button>}
            {!readOnly && asset.status === "AVAILABLE" && <Button onClick={() => setAssignOpen((v) => !v)}><Send className="mr-2 h-4 w-4" /> Serah Terima</Button>}
            {!readOnly && asset.status === "ASSIGNED" && <Button onClick={() => setReturnOpen((v) => !v)}><RotateCcw className="mr-2 h-4 w-4" /> Pengembalian</Button>}
          </div>
        </div>
      </section>

      {assignOpen && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Form Serah Terima</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormRow label="Pemegang">
              <Select value={assignForm.holderUserId} onValueChange={(value) => setAssignForm({ ...assignForm, holderUserId: value })}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih pemegang" /></SelectTrigger>
                <SelectContent>{(holderData?.data || []).map((holder) => <SelectItem key={holder.id} value={String(holder.id)}>{holder.fullName} - {holder.role}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Tanggal Serah"><Input type="date" value={assignForm.assignedAt} onChange={(e) => setAssignForm({ ...assignForm, assignedAt: e.target.value })} className="bg-white" /></FormRow>
            <FormRow label="Estimasi Kembali"><Input type="date" value={assignForm.expectedReturnAt} onChange={(e) => setAssignForm({ ...assignForm, expectedReturnAt: e.target.value })} className="bg-white" /></FormRow>
            <FormRow label="Kondisi Awal"><Input value={assignForm.initialCondition} onChange={(e) => setAssignForm({ ...assignForm, initialCondition: e.target.value })} className="bg-white" /></FormRow>
            <div className="md:col-span-2"><FormRow label="Tujuan Pemakaian"><Textarea value={assignForm.purpose} onChange={(e) => setAssignForm({ ...assignForm, purpose: e.target.value })} className="min-h-24 bg-white" /></FormRow></div>
            <div className="md:col-span-2"><FormRow label="Catatan"><Textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} className="min-h-24 bg-white" /></FormRow></div>
          </div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setAssignOpen(false)}>Batal</Button><Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>{assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit</Button></div>
        </section>
      )}

      {returnOpen && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Form Pengembalian</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormRow label="Tanggal Kembali"><Input type="date" value={returnForm.returnedAt} onChange={(e) => setReturnForm({ ...returnForm, returnedAt: e.target.value })} className="bg-white" /></FormRow>
            <FormRow label="Status Setelah Kembali">
              <Select value={returnForm.nextStatus} onValueChange={(value: Exclude<AssetStatus, "ASSIGNED">) => setReturnForm({ ...returnForm, nextStatus: value })}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{assetStatuses.filter((status) => status !== "ASSIGNED").map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <div className="md:col-span-2"><FormRow label="Kondisi Kembali"><Input value={returnForm.returnCondition} onChange={(e) => setReturnForm({ ...returnForm, returnCondition: e.target.value })} className="bg-white" /></FormRow></div>
            <div className="md:col-span-2"><FormRow label="Catatan"><Textarea value={returnForm.returnNotes} onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })} className="min-h-24 bg-white" /></FormRow></div>
          </div>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setReturnOpen(false)}>Batal</Button><Button onClick={() => returnMutation.mutate()} disabled={returnMutation.isPending}>{returnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit</Button></div>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Tipe" value={typeLabels[asset.type]} />
        <InfoItem label="Kategori" value={asset.category} />
        <InfoItem label="Lokasi" value={asset.location} />
        <InfoItem label="Kondisi" value={asset.condition} />
        {asset.type === "DEVICE" ? <><InfoItem label="Brand" value={asset.brand} /><InfoItem label="Model" value={asset.model} /><InfoItem label="Serial" value={asset.serialNumber} /><InfoItem label="Identifier" value={asset.identifier} /></> : <><InfoItem label="Platform" value={asset.platform} /><InfoItem label="Username" value={asset.accountUsername} /><InfoItem label="Recovery" value={asset.recoveryContact} /><InfoItem label="PIC Akun" value={asset.accountPic} /></>}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Riwayat Pemegang</h3>
          <div className="mt-4 space-y-3">
            {(asset.assignments || []).length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Belum ada riwayat serah terima.</p> : (asset.assignments || []).map((assignment) => (
              <div key={assignment.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-slate-900">{assignment.holder?.fullName || "-"}</div><Badge variant="outline">{assignment.status}</Badge></div>
                <div className="mt-2 text-sm text-slate-600">Serah: {assignment.assignedAt} {assignment.returnedAt ? `• Kembali: ${assignment.returnedAt}` : ""}</div>
                <div className="mt-1 text-sm text-slate-500">{assignment.purpose}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Dokumen</h3>
          <div className="mt-4 space-y-3">
            {(asset.documents || []).length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Belum ada dokumen untuk aset ini.</p> : (asset.documents || []).map((document) => (
              <div key={document.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div><div className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-4 w-4" />{document.documentNumber}</div><div className="text-xs text-slate-500">{document.type}</div></div>
                <Button variant="outline" size="sm" onClick={() => assetService.downloadDocument(document.assetId, document.id, document.fileName)}><Download className="mr-2 h-4 w-4" />PDF</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(asset.notes || asset.accountNotes) && <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-lg font-black text-slate-950">Catatan</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{asset.notes || asset.accountNotes}</p></section>}
    </div>
  );
}