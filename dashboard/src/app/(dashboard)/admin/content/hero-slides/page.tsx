"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { packageService } from "@/services/packageService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SlidePackage {
  id: number;
  name: string;
  departureDate?: string | null;
  duration?: number | null;
  airline?: string | null;
  priceQuad?: string | number | null;
  discountPrice?: string | number | null;
  price?: string | number | null;
  remainingSeats?: number | null;
  image?: string | null;
}

interface HeroSlide {
  id: number;
  title?: string | null;
  imageUrl?: string | null;
  altText?: string | null;
  kind?: string | null;
  packageId?: number | null;
  tag?: string | null;
  headline?: string | null;
  note?: string | null;
  priceLabel?: string | null;
  oldPriceLabel?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  background?: string | null;
  isActive: boolean;
  sortOrder: number;
  package?: SlidePackage | null;
}

interface PackageOption {
  id: number;
  name: string;
  departureDate?: string;
  isPublished?: boolean;
}

const endpoint = "/master/hero-slides";
const emptyForm = {
  kind: "PROMO",
  packageId: "",
  title: "",
  tag: "",
  headline: "",
  note: "",
  priceLabel: "",
  oldPriceLabel: "",
  ctaLabel: "",
  ctaUrl: "",
  background: "HARAM",
  altText: "",
  sortOrder: "0",
  isActive: true,
  removeImage: false,
};

const BACKGROUNDS = [
  { value: "HARAM", label: "Foto Masjidil Haram malam" },
  { value: "CLOCK", label: "Foto menara jam Makkah" },
  { value: "FLYER", label: "Flyer diburamkan" },
];

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  "Terjadi kesalahan. Silakan coba lagi.";

const juta = (value?: string | number | null) => {
  const n = Number(value || 0);
  return n > 0 ? `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} juta` : "";
};

const shortDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

export default function HeroSlidesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => (await api.get(endpoint)).data,
  });
  const items: HeroSlide[] = Array.isArray(data?.data) ? data.data : [];

  const { data: packagesResponse } = useQuery({
    queryKey: ["hero-slide-packages"],
    queryFn: () => packageService.getAll({ page: 1, limit: 100 }),
  });
  const packages: PackageOption[] = useMemo(() => {
    const list: PackageOption[] = Array.isArray(packagesResponse?.data?.packages) ? packagesResponse.data.packages : [];
    return [...list].sort((a, b) => String(b.departureDate || "").localeCompare(String(a.departureDate || "")));
  }, [packagesResponse]);

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));
  const preview = localPreview || (editing?.imageUrl && !form.removeImage ? getImageUrl(editing.imageUrl) : "");
  const linkedPackage = editing?.package && String(editing.package.id) === form.packageId ? editing.package : null;

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setLocalPreview("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      if (file) body.append("image", file);
      return editing ? api.put(`${endpoint}/${editing.id}`, body) : api.post(endpoint, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: editing ? "Slide hero diperbarui" : "Slide hero dibuat", description: "Perubahan langsung tampil di beranda website." });
      reset();
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal menyimpan slide", description: errorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Slide hero dihapus" });
      reset();
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal menghapus slide", description: errorMessage(error) }),
  });

  const startEdit = (item: HeroSlide) => {
    setEditing(item);
    setFile(null);
    setLocalPreview("");
    setForm({
      kind: item.kind || "PROMO",
      packageId: item.packageId ? String(item.packageId) : "",
      title: item.title || "",
      tag: item.tag || "",
      headline: item.headline || "",
      note: item.note || "",
      priceLabel: item.priceLabel || "",
      oldPriceLabel: item.oldPriceLabel || "",
      ctaLabel: item.ctaLabel || "",
      ctaUrl: item.ctaUrl || "",
      background: item.background || "HARAM",
      altText: item.altText || "",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: Boolean(item.isActive),
      removeImage: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "File harus berupa gambar" });
      return;
    }
    setFile(selected);
    setLocalPreview(URL.createObjectURL(selected));
    set({ removeImage: false });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const hasImage = Boolean(file || (editing?.imageUrl && !form.removeImage));
    if (form.kind === "BANNER" && !hasImage) {
      toast({ variant: "destructive", title: "Slide banner wajib memakai gambar" });
      return;
    }
    if (form.kind === "PROMO" && !hasImage && !form.packageId) {
      toast({ variant: "destructive", title: "Pilih paket atau upload flyer untuk slide promo" });
      return;
    }
    saveMutation.mutate();
  };

  const isPromo = form.kind === "PROMO";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
            <ImageIcon className="h-7 w-7 text-primary" /> Hero Slider
          </h1>
          <p className="mt-1 max-w-2xl text-gray-600">
            Slide promo yang berganti otomatis di bagian atas beranda, setelah slide sambutan. Pilih paket, maka tanggal, durasi, maskapai, harga, dan sisa seat terisi otomatis. Teks sambutan diatur di menu Konten Website.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="https://sahabatqolbu.com/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Lihat beranda
          </a>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit slide" : "Tambah slide"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Jenis slide">
                {[
                  { value: "PROMO", title: "Promo paket", text: "Teks promo di kiri, flyer di kanan. Disarankan." },
                  { value: "BANNER", title: "Banner gambar", text: "Hanya gambar penuh, misalnya poster event." },
                ].map((option) => (
                  <label key={option.value} className={`cursor-pointer rounded-md border p-4 ${form.kind === option.value ? "border-primary bg-primary/5" : "border-gray-200"}`}>
                    <input type="radio" name="kind" value={option.value} checked={form.kind === option.value} onChange={() => set({ kind: option.value })} className="sr-only" />
                    <strong className="block text-sm">{option.title}</strong>
                    <span className="text-xs text-gray-500">{option.text}</span>
                  </label>
                ))}
              </div>

              {isPromo && (
                <div className="space-y-2">
                  <Label htmlFor="hs-package">Paket yang dipromosikan</Label>
                  <select id="hs-package" value={form.packageId} onChange={(e) => set({ packageId: e.target.value })} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
                    <option value="">Tanpa paket (isi teks sendiri)</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.departureDate ? ` · ${shortDate(p.departureDate)}` : ""}{p.isPublished === false ? " (tidak tampil di website)" : ""}
                      </option>
                    ))}
                  </select>
                  {linkedPackage ? (
                    <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                      Otomatis dari paket: {shortDate(linkedPackage.departureDate)}, {linkedPackage.duration} hari, {linkedPackage.airline}, {juta(linkedPackage.priceQuad || linkedPackage.discountPrice || linkedPackage.price)}, sisa {linkedPackage.remainingSeats} seat.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Tanggal, durasi, maskapai, harga, dan sisa seat diambil langsung dari data paket.</p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hs-title">Nama slide (untuk tombol navigasi)</Label>
                  <Input id="hs-title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Contoh: Lailatul Qadar 1448 H" maxLength={60} />
                </div>
                {isPromo && (
                  <div className="space-y-2">
                    <Label htmlFor="hs-tag">Label kecil</Label>
                    <Input id="hs-tag" value={form.tag} onChange={(e) => set({ tag: e.target.value })} placeholder="Promo spesial" maxLength={60} />
                  </div>
                )}
              </div>

              {isPromo && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="hs-headline">Judul promo</Label>
                    <Input id="hs-headline" value={form.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Kosongkan untuk memakai nama paket" maxLength={160} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hs-price">Harga promo</Label>
                      <Input id="hs-price" value={form.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} placeholder="Kosongkan: Rp 48,9 juta dari paket" maxLength={60} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hs-old">Harga coret</Label>
                      <Input id="hs-old" value={form.oldPriceLabel} onChange={(e) => set({ oldPriceLabel: e.target.value })} placeholder="Contoh: Rp 51,5 jt" maxLength={60} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs-note">Catatan singkat</Label>
                    <Input id="hs-note" value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Contoh: Full i'tikaf 10 malam terakhir. Sisa 15 seat." maxLength={255} />
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hs-cta">Teks tombol</Label>
                  <Input id="hs-cta" value={form.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder={isPromo ? "Booking sekarang" : "Lihat selengkapnya"} maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hs-url">Link tombol</Label>
                  <Input id="hs-url" value={form.ctaUrl} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder={isPromo ? "Kosongkan: buka WhatsApp admin" : "https://... atau /paket"} maxLength={500} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hs-image">
                  {isPromo ? "Flyer promo (opsional bila memilih paket)" : "Gambar banner *"}
                </Label>
                <Input id="hs-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectFile(e.target.files?.[0])} />
                <p className="text-xs text-gray-500">
                  {isPromo ? "Kosongkan untuk memakai flyer pertama dari paket. " : ""}Gambar otomatis dikonversi ke WebP.
                </p>
                {preview ? (
                  <div className="overflow-hidden rounded-md border bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Pratinjau gambar slide" className="max-h-72 w-full object-contain" />
                  </div>
                ) : null}
                {editing?.imageUrl && !file ? (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={form.removeImage} onChange={(e) => set({ removeImage: e.target.checked })} />
                    Hapus gambar ini dan pakai flyer dari paket
                  </label>
                ) : null}
              </div>

              {isPromo && (
                <div className="space-y-2">
                  <Label htmlFor="hs-bg">Latar slide</Label>
                  <select id="hs-bg" value={form.background} onChange={(e) => set({ background: e.target.value })} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
                    {BACKGROUNDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hs-alt">Teks alternatif gambar</Label>
                  <Input id="hs-alt" value={form.altText} onChange={(e) => set({ altText: e.target.value })} placeholder="Deskripsi singkat gambar" maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hs-order">Urutan tampil</Label>
                  <Input id="hs-order" type="number" min="0" max="999" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} />
                  <p className="text-xs text-gray-500">Angka kecil tampil lebih awal.</p>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-md border p-4">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-4 w-4" />
                <span>
                  <strong className="block text-sm">Tampilkan di website</strong>
                  <span className="text-xs text-gray-500">Slide nonaktif tetap tersimpan tetapi tidak ditampilkan.</span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Simpan slide
                </Button>
                {editing && <Button type="button" variant="outline" onClick={reset}>Batal edit</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Daftar slide <Badge variant="outline">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="grid place-items-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                <Plus className="mx-auto mb-2 h-8 w-8" />Belum ada slide promo. Beranda hanya menampilkan slide sambutan.
              </div>
            ) : (
              items.map((item) => {
                const image = item.imageUrl || item.package?.image;
                return (
                  <div key={item.id} className="overflow-hidden rounded-md border">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImageUrl(image)} alt={item.altText || item.title || "Slide hero"} className="aspect-video w-full bg-slate-950 object-contain" />
                    ) : null}
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{item.headline || item.package?.name || item.title || `Slide #${item.id}`}</p>
                          <p className="text-xs text-gray-500">
                            {item.kind === "BANNER" ? "Banner gambar" : "Promo paket"} · urutan {item.sortOrder ?? 0}
                            {item.package ? ` · ${shortDate(item.package.departureDate)}` : ""}
                          </p>
                        </div>
                        <Badge className={item.isActive ? "bg-emerald-600" : "bg-gray-500"}>{item.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm("Hapus slide hero ini?")) deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
