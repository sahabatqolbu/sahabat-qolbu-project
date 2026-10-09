"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileCheck2, FilePlus2, Loader2, Plus, Printer, Search, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  financialDocumentService,
  type FinancialDocumentType,
  type FinancialPayload,
  type FinancialPreview,
  type FinancialSourceType,
} from "@/services/financialDocumentService";

const currency = (value: number | string | undefined) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
const initial = (type: FinancialDocumentType): FinancialPayload => ({
  type, sourceType: "MANUAL", customerName: "", customerPhone: "", memberCount: 1,
  programName: "", items: [{ description: "", qty: 1, unitPrice: 0 }],
  previousPaid: 0, currentPayment: 0, paymentMethod: "Transfer bank", paidBy: "",
  confirmedReceived: false,
});
const sources: Record<FinancialDocumentType, Array<{ value: FinancialSourceType; label: string; hint: string }>> = {
  INVOICE: [
    { value: "MANUAL", label: "Tagihan manual", hint: "Masukkan rincian sendiri" },
    { value: "BOOKING", label: "Booking jamaah / keluarga", hint: "Masukkan nomor booking" },
    { value: "TRANSACTION", label: "Transaksi lama", hint: "Masukkan ID transaksi" },
    { value: "AGENT", label: "Biaya agen", hint: "Masukkan ID user agen" },
  ],
  RECEIPT: [
    { value: "MANUAL", label: "Penerimaan manual", hint: "Catat pembayaran yang diterima" },
    { value: "PAYMENT", label: "Pembayaran jamaah / keluarga", hint: "Masukkan ID pembayaran" },
    { value: "TRANSACTION", label: "Transaksi lama", hint: "Masukkan ID transaksi" },
    { value: "AGENT_PAYMENT", label: "Pembayaran biaya agen", hint: "Masukkan ID pembayaran agen" },
  ],
};

const openPdf = (blob: Blob, fileName: string, download = false) => {
  const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  if (download) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const getMessage = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message || "Permintaan gagal. Periksa kembali data Anda.";
};

export default function FinancialDocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [type, setType] = useState<FinancialDocumentType>("INVOICE");
  const [payload, setPayload] = useState<FinancialPayload>(initial("INVOICE"));
  const [preview, setPreview] = useState<FinancialPreview | null>(null);
  const [search, setSearch] = useState("");
  const [voidId, setVoidId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [signerName, setSignerName] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedType = query.get("type") === "RECEIPT" ? "RECEIPT" : "INVOICE";
    const requestedSource = query.get("sourceType") as FinancialSourceType | null;
    const sourceId = query.get("sourceId") || "";
    if (requestedSource && sources[requestedType].some((entry) => entry.value === requestedSource)) {
      setType(requestedType);
      setPayload({ ...initial(requestedType), sourceType: requestedSource, sourceId });
    }
  }, []);

  const listQuery = useQuery({ queryKey: ["financial-documents", type], queryFn: () => financialDocumentService.list({ type }) });
  const banksQuery = useQuery({ queryKey: ["financial-banks"], queryFn: financialDocumentService.banks });
  const settingsQuery = useQuery({ queryKey: ["financial-settings"], queryFn: financialDocumentService.settings, enabled: isAdmin });
  const prepareMutation = useMutation({ mutationFn: financialDocumentService.prepare, onSuccess: setPreview, onError: (error) => toast.error(getMessage(error)) });
  const issueMutation = useMutation({
    mutationFn: financialDocumentService.issue,
    onSuccess: (document) => {
      toast.success(`${document.number} berhasil diterbitkan`);
      setPreview(null);
      setPayload(initial(type));
      queryClient.invalidateQueries({ queryKey: ["financial-documents"] });
    },
    onError: (error) => toast.error(getMessage(error)),
  });
  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => financialDocumentService.void(id, reason),
    onSuccess: () => {
      toast.success("Dokumen dibatalkan");
      setVoidId(null);
      setVoidReason("");
      queryClient.invalidateQueries({ queryKey: ["financial-documents"] });
    },
    onError: (error) => toast.error(getMessage(error)),
  });
  const filtered = useMemo(() => (listQuery.data || []).filter((entry) =>
    `${entry.number} ${entry.customerName}`.toLowerCase().includes(search.toLowerCase())), [listQuery.data, search]);
  const source = sources[type].find((option) => option.value === payload.sourceType);

  const change = (patch: Partial<FinancialPayload>) => {
    setPayload((current) => ({ ...current, ...patch }));
    setPreview(null);
  };
  const changeLine = (index: number, patch: Record<string, string | number>) => {
    const items = [...(payload.items || [])];
    items[index] = { ...items[index], ...patch };
    change({ items });
  };
  const switchType = (next: FinancialDocumentType) => {
    setType(next);
    setPayload(initial(next));
    setPreview(null);
  };
  const showPdf = async (id: number | null, download = false) => {
    try {
      const blob = id ? await financialDocumentService.pdf(id) : await financialDocumentService.previewPdf(payload);
      openPdf(blob, id ? `${type.toLowerCase()}-${id}.pdf` : "pratinjau.pdf", download);
    } catch (error) { toast.error(getMessage(error)); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#09253d] md:text-3xl">Invoice & Kwitansi</h1>
          <p className="mt-1 text-sm text-slate-600">Terbitkan dan arsipkan dokumen pembayaran pelanggan.</p>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-white p-1">
          {(["INVOICE", "RECEIPT"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => switchType(tab)} className={`rounded px-4 py-2 text-sm font-semibold ${type === tab ? "bg-[#09253d] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {tab === "INVOICE" ? "Invoice" : "Kwitansi"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6">
          <div className="mb-5 flex items-center gap-2 border-b pb-4 text-[#09253d]"><FilePlus2 className="h-5 w-5" /><h2 className="font-semibold">Buat {type === "INVOICE" ? "invoice" : "kwitansi"}</h2></div>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Sumber data</Label><select value={payload.sourceType} onChange={(event) => change({ sourceType: event.target.value as FinancialSourceType, sourceId: "" })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{sources[type].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="text-xs text-slate-500">{source?.hint}</p></div>
            {payload.sourceType !== "MANUAL" && <div className="space-y-2"><Label>{payload.sourceType === "BOOKING" ? "Nomor booking" : "ID data sumber"}</Label><Input value={payload.sourceId || ""} onChange={(event) => change({ sourceId: event.target.value })} placeholder={payload.sourceType === "BOOKING" ? "Contoh: SQ-20261009-0001" : "Masukkan ID dari dashboard"} /></div>}
            {payload.sourceType === "AGENT" && <div className="space-y-2"><Label>Level agen</Label><select value={payload.targetStar || ""} onChange={(event) => change({ targetStar: Number(event.target.value) })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Pilih level</option><option value="1">Bintang 1</option><option value="2">Bintang 2</option></select></div>}
            {payload.sourceType === "MANUAL" && <>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nama pelanggan</Label><Input value={payload.customerName || ""} onChange={(event) => change({ customerName: event.target.value })} /></div><div className="space-y-2"><Label>Nomor WhatsApp</Label><Input value={payload.customerPhone || ""} onChange={(event) => change({ customerPhone: event.target.value })} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Program / layanan</Label><Input value={payload.programName || ""} onChange={(event) => change({ programName: event.target.value })} /></div><div className="space-y-2"><Label>Jumlah jamaah / peserta</Label><Input type="number" min="1" value={payload.memberCount || 1} onChange={(event) => change({ memberCount: Number(event.target.value) })} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tanggal keberangkatan (opsional)</Label><Input type="date" value={payload.departureDate || ""} onChange={(event) => change({ departureDate: event.target.value })} /></div><div className="space-y-2"><Label>Tipe kamar (opsional)</Label><Input value={payload.roomType || ""} onChange={(event) => change({ roomType: event.target.value })} /></div></div>
              <div className="space-y-3 border-t pt-4"><div className="flex items-center justify-between"><Label>Rincian tagihan</Label><Button type="button" variant="outline" size="sm" onClick={() => change({ items: [...(payload.items || []), { description: "", qty: 1, unitPrice: 0 }] })}><Plus className="mr-1 h-4 w-4" /> Tambah</Button></div>{(payload.items || []).map((line, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_72px_110px_36px]"><Input className="col-span-3 sm:col-span-1" aria-label={`Deskripsi ${index + 1}`} placeholder="Deskripsi" value={line.description} onChange={(event) => changeLine(index, { description: event.target.value })} /><Input aria-label={`Jumlah ${index + 1}`} type="number" min="1" value={line.qty} onChange={(event) => changeLine(index, { qty: Number(event.target.value) })} /><Input aria-label={`Harga ${index + 1}`} type="number" min="0" value={line.unitPrice} onChange={(event) => changeLine(index, { unitPrice: Number(event.target.value) })} /><button aria-label={`Hapus baris ${index + 1}`} type="button" disabled={(payload.items || []).length === 1} onClick={() => change({ items: (payload.items || []).filter((_, i) => i !== index) })} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}</div>
              <div className="space-y-2"><Label>Pembayaran sebelumnya</Label><Input type="number" min="0" value={payload.previousPaid || 0} onChange={(event) => change({ previousPaid: Number(event.target.value) })} /></div>
              {type === "RECEIPT" && <><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Pembayaran diterima</Label><Input type="number" min="1" value={payload.currentPayment || 0} onChange={(event) => change({ currentPayment: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Nama pembayar</Label><Input value={payload.paidBy || ""} onChange={(event) => change({ paidBy: event.target.value })} /></div></div><div className="space-y-2"><Label>Metode pembayaran</Label><Input value={payload.paymentMethod || ""} onChange={(event) => change({ paymentMethod: event.target.value })} /></div></>}
            </>}
            <div className="space-y-2"><Label>Rekening resmi pada dokumen {type === "INVOICE" ? "*" : "(opsional)"}</Label><select value={payload.bankId || ""} onChange={(event) => change({ bankId: event.target.value ? Number(event.target.value) : null })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Pilih rekening</option>{(banksQuery.data || []).map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNumber}</option>)}</select></div>
            {type === "RECEIPT" && ["MANUAL", "AGENT_PAYMENT"].includes(payload.sourceType) && <label className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={payload.confirmedReceived || false} onChange={(event) => change({ confirmedReceived: event.target.checked })} className="mt-1" /><span>Saya sudah memastikan pembayaran ini diterima perusahaan dan data nominalnya benar.</span></label>}
            <Button className="w-full bg-[#09253d] hover:bg-[#123955]" disabled={prepareMutation.isPending} onClick={() => prepareMutation.mutate(payload)}>{prepareMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />} Periksa Dokumen</Button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6"><h2 className="mb-4 font-semibold text-[#09253d]">Pratinjau data</h2>{preview ? <div className="space-y-3 text-sm"><div><span className="text-slate-500">Pelanggan</span><p className="font-semibold">{preview.customerName}</p></div><div><span className="text-slate-500">Program</span><p className="font-semibold">{preview.programName}</p></div><div className="border-t pt-3">{preview.items.map((line, index) => <div key={index} className="flex justify-between gap-2 py-1"><span className="min-w-0 break-words">{line.description} ({line.qty}x)</span><span className="whitespace-nowrap">{currency(line.amount)}</span></div>)}</div><div className="space-y-1 border-t pt-3"><div className="flex justify-between"><span>Total tagihan</span><strong>{currency(preview.totalAmount)}</strong></div><div className="flex justify-between"><span>Pembayaran sebelumnya</span><span>{currency(preview.previousPaid)}</span></div>{type === "RECEIPT" && <div className="flex justify-between"><span>Diterima saat ini</span><strong>{currency(preview.currentPayment)}</strong></div>}<div className="flex justify-between border-t pt-2 font-bold text-[#09253d]"><span>Sisa tagihan</span><span>{currency(preview.remaining)}</span></div></div><div className="grid gap-2 pt-2 sm:grid-cols-2"><Button variant="outline" onClick={() => showPdf(null)}><Eye className="mr-2 h-4 w-4" /> Lihat PDF A4</Button><Button disabled={issueMutation.isPending} onClick={() => issueMutation.mutate(payload)} className="bg-[#09253d] hover:bg-[#123955]">{issueMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />} Terbitkan</Button></div></div> : <p className="text-sm text-slate-500">Isi data lalu pilih Periksa Dokumen.</p>}</section>

          {isAdmin && <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6"><h2 className="mb-4 font-semibold text-[#09253d]">Pengesahan dokumen</h2><div className="space-y-3"><div className="space-y-2"><Label>Nama penandatangan</Label><div className="flex gap-2"><Input placeholder={settingsQuery.data?.signerName || "Nama pada dokumen"} value={signerName} onChange={(event) => setSignerName(event.target.value)} /><Button variant="outline" onClick={async () => { try { await financialDocumentService.saveSigner(signerName); toast.success("Nama tersimpan"); setSignerName(""); settingsQuery.refetch(); } catch (error) { toast.error(getMessage(error)); } }}>Simpan</Button></div></div>{(["signature", "stamp"] as const).map((kind) => <label key={kind} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-slate-300 p-3 text-sm"><span>{kind === "signature" ? "Tanda tangan" : "Stempel"} <strong>{(kind === "signature" ? settingsQuery.data?.hasSignature : settingsQuery.data?.hasStamp) ? "tersimpan" : "belum diunggah"}</strong></span><span className="rounded bg-slate-100 px-3 py-1">Unggah</span><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { await financialDocumentService.uploadMark(kind, file); toast.success("Gambar tersimpan"); settingsQuery.refetch(); } catch (error) { toast.error(getMessage(error)); } event.target.value = ""; }} /></label>)}</div></section>}
        </div>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 md:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-[#09253d]">Dokumen diterbitkan</h2><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor atau nama" /></div></div>{listQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : filtered.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Belum ada dokumen.</p> : <div className="space-y-2">{filtered.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3"><div className="min-w-0"><p className="break-all font-semibold text-[#09253d]">{entry.number}</p><p className="text-sm text-slate-600">{entry.customerName} · {currency(entry.totalAmount)} · {new Date(entry.issuedAt).toLocaleDateString("id-ID")}</p><span className={`text-xs font-semibold ${entry.status === "VOID" ? "text-red-600" : "text-emerald-700"}`}>{entry.status === "VOID" ? "Dibatalkan" : "Terbit"}</span>{entry.voidReason && <p className="text-xs text-red-600">{entry.voidReason}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => showPdf(entry.id)} title="Buka PDF"><Printer className="mr-1 h-4 w-4" /> Cetak</Button><Button size="sm" variant="outline" onClick={() => showPdf(entry.id, true)} title="Unduh PDF"><Download className="mr-1 h-4 w-4" /> PDF</Button>{entry.status === "ISSUED" && <Button size="sm" variant="outline" onClick={() => { setVoidId(entry.id); setVoidReason(""); }} className="text-red-700"><XCircle className="mr-1 h-4 w-4" /> Batalkan</Button>}</div></div>)}</div>}</section>

      {voidId !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-md bg-white p-5 shadow-xl"><h2 className="font-semibold text-[#09253d]">Batalkan dokumen?</h2><p className="mt-2 text-sm text-slate-600">Dokumen tetap tersimpan untuk arsip. Isi alasan sebelum membatalkan.</p><Textarea className="mt-4" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Alasan pembatalan" /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setVoidId(null)}>Kembali</Button><Button variant="destructive" disabled={voidReason.trim().length < 5 || voidMutation.isPending} onClick={() => voidMutation.mutate({ id: voidId, reason: voidReason })}>Batalkan dokumen</Button></div></div></div>}
    </div>
  );
}
