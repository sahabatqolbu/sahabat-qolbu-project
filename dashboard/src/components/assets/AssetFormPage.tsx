"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { assetService, type AssetPayload, type AssetStatus, type AssetType } from "@/services/assetService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assetStatuses, assetTypes, statusLabels, typeLabels } from "./AssetWorkspace";

const emptyAssetForm: AssetPayload = {
  name: "",
  type: "DEVICE",
  category: "",
  assetCode: "",
  status: "AVAILABLE",
  brand: "",
  model: "",
  serialNumber: "",
  identifier: "",
  location: "",
  condition: "",
  notes: "",
  platform: "",
  accountUsername: "",
  recoveryContact: "",
  accountPic: "",
  accountNotes: "",
};

const toAssetForm = (asset: any): AssetPayload => ({
  name: asset.name || "",
  type: asset.type || "DEVICE",
  category: asset.category || "",
  assetCode: asset.assetCode || "",
  status: asset.status || "AVAILABLE",
  brand: asset.brand || "",
  model: asset.model || "",
  serialNumber: asset.serialNumber || "",
  identifier: asset.identifier || "",
  location: asset.location || "",
  condition: asset.condition || "",
  notes: asset.notes || "",
  platform: asset.platform || "",
  accountUsername: asset.accountUsername || "",
  recoveryContact: asset.recoveryContact || "",
  accountPic: asset.accountPic || "",
  accountNotes: asset.accountNotes || "",
});

function FormRow({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Label className="text-base font-bold text-slate-950">{label}{required && <span className="ml-1 text-red-500">*</span>}</Label>
      {hint && <p className="mt-1 text-sm leading-relaxed text-slate-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AssetFormPage({ assetId }: { assetId?: number }) {
  const isEdit = Boolean(assetId);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AssetPayload>(emptyAssetForm);

  const { data, isLoading } = useQuery({
    queryKey: ["asset-detail", assetId],
    queryFn: () => assetService.getAsset(assetId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.data) setForm(toAssetForm(data.data));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return assetService.updateAsset(assetId!, form);
      return assetService.createAsset(form);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-detail", assetId] });
      toast({ title: "Berhasil", description: isEdit ? "Aset berhasil diperbarui" : "Aset berhasil dibuat" });
      const id = isEdit ? assetId : response.data.id;
      router.push(`/assets/${id}`);
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.response?.data?.message || "Aset gagal disimpan", variant: "destructive" });
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Memuat aset...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <Button asChild variant="ghost" className="mb-3 -ml-3 text-slate-200 hover:bg-white/10 hover:text-white">
          <Link href={isEdit ? `/assets/${assetId}` : "/assets"}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
        </Button>
        <h2 className="text-2xl font-black tracking-tight">{isEdit ? "Edit Aset" : "Tambah Aset Baru"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Isi data seperti Google Form: satu bagian satu input agar gampang dicek oleh staff/admin.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <FormRow label="Nama Aset" hint="Contoh: Laptop Admin 01, Akun Google Ads, HP Operasional." required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="border-slate-300" />
        </FormRow>
        <FormRow label="Kode Aset" hint="Boleh dikosongkan. Sistem akan buat kode otomatis saat tambah aset.">
          <Input value={form.assetCode || ""} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} placeholder="Auto jika kosong" className="border-slate-300" />
        </FormRow>
        <FormRow label="Tipe Aset" required>
          <Select value={form.type} onValueChange={(value: AssetType) => setForm({ ...form, type: value })}>
            <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
            <SelectContent>{assetTypes.map((type) => <SelectItem key={type} value={type}>{typeLabels[type]}</SelectItem>)}</SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Kategori" hint="Laptop, HP, Email, Social Media, Ads, Domain, Hosting, dll." required>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="border-slate-300" />
        </FormRow>
        <FormRow label="Status">
          <Select value={form.status || "AVAILABLE"} onValueChange={(value: AssetStatus) => setForm({ ...form, status: value })}>
            <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
            <SelectContent>{assetStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Lokasi">
          <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kantor, rumah staff, cloud, dll" className="border-slate-300" />
        </FormRow>

        {form.type === "DEVICE" ? (
          <>
            <FormRow label="Brand"><Input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="border-slate-300" /></FormRow>
            <FormRow label="Model"><Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} className="border-slate-300" /></FormRow>
            <FormRow label="Serial Number"><Input value={form.serialNumber || ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border-slate-300" /></FormRow>
            <FormRow label="Identifier" hint="IMEI, kode inventaris lama, atau identifier lain."><Input value={form.identifier || ""} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className="border-slate-300" /></FormRow>
          </>
        ) : (
          <>
            <FormRow label="Platform"><Input value={form.platform || ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Google, Meta, TikTok, domain, hosting" className="border-slate-300" /></FormRow>
            <FormRow label="Email / Username" hint="Jangan isi password, token, API key, atau secret di sistem ini."><Input value={form.accountUsername || ""} onChange={(e) => setForm({ ...form, accountUsername: e.target.value })} className="border-slate-300" /></FormRow>
            <FormRow label="Recovery Contact"><Input value={form.recoveryContact || ""} onChange={(e) => setForm({ ...form, recoveryContact: e.target.value })} className="border-slate-300" /></FormRow>
            <FormRow label="PIC Akun"><Input value={form.accountPic || ""} onChange={(e) => setForm({ ...form, accountPic: e.target.value })} className="border-slate-300" /></FormRow>
          </>
        )}

        <FormRow label="Kondisi"><Input value={form.condition || ""} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Baik, layar retak, perlu service, dll" className="border-slate-300" /></FormRow>
        <FormRow label="Catatan"><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-28 border-slate-300" /></FormRow>
        {form.type === "ACCOUNT" && <FormRow label="Catatan Akun" hint="Catatan operasional tanpa data rahasia."><Textarea value={form.accountNotes || ""} onChange={(e) => setForm({ ...form, accountNotes: e.target.value })} className="min-h-28 border-slate-300" /></FormRow>}

        <div className="sticky bottom-3 z-10 flex justify-end gap-2 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <Button asChild variant="outline"><Link href={isEdit ? `/assets/${assetId}` : "/assets"}>Batal</Link></Button>
          <Button type="submit" disabled={saveMutation.isPending} className="bg-slate-950 text-white hover:bg-slate-800">
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Aset
          </Button>
        </div>
      </form>
    </div>
  );
}