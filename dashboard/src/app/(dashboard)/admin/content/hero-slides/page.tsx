"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HeroSlide {
  id: number;
  title?: string | null;
  imageUrl: string;
  altText?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const endpoint = "/master/hero-slides";
const emptyForm = {
  title: "",
  altText: "",
  sortOrder: "0",
  isActive: true,
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || "Terjadi kesalahan. Silakan coba lagi.";

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
  const preview = useMemo(
    () => localPreview || (editing ? getImageUrl(editing.imageUrl) : ""),
    [editing, localPreview],
  );

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setLocalPreview("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, String(value)),
      );
      if (file) body.append("image", file);
      if (editing) return api.put(`${endpoint}/${editing.id}`, body);
      return api.post(endpoint, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({
        title: editing
          ? "Slide hero berhasil diperbarui"
          : "Slide hero berhasil dibuat",
      });
      reset();
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal menyimpan slide hero",
        description: errorMessage(error),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Slide hero berhasil dihapus" });
      reset();
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal menghapus slide hero",
        description: errorMessage(error),
      }),
  });

  const startEdit = (item: HeroSlide) => {
    setEditing(item);
    setFile(null);
    setLocalPreview("");
    setForm({
      title: item.title || "",
      altText: item.altText || "",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: Boolean(item.isActive),
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
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing && !file) {
      toast({ variant: "destructive", title: "Gambar hero wajib dipilih" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
          <ImageIcon className="h-7 w-7 text-primary" /> Hero Slider
        </h1>
        <p className="mt-1 text-gray-600">
          Kelola banner utama yang berganti otomatis di halaman beranda.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? "Edit Slide Hero" : "Tambah Slide Hero"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label>Judul internal</Label>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Contoh: Banner Umroh Utama"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Gambar banner {editing ? "(opsional jika tidak diganti)" : "*"}
                </Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
                <p className="text-xs text-gray-500">
                  Disarankan rasio 16:9. Gambar otomatis dikonversi ke WebP.
                </p>
              </div>

              {preview && (
                <div className="overflow-hidden rounded-md border bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview slide hero"
                    className="aspect-video w-full object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Teks alternatif gambar</Label>
                <Input
                  value={form.altText}
                  onChange={(event) =>
                    setForm({ ...form, altText: event.target.value })
                  }
                  placeholder="Deskripsi singkat gambar untuk aksesibilitas"
                />
              </div>

              <div className="space-y-2">
                <Label>Urutan tampil</Label>
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm({ ...form, sortOrder: event.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Angka lebih kecil tampil lebih awal.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-md border p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span>
                  <strong className="block text-sm">Tampilkan di website</strong>
                  <span className="text-xs text-gray-500">
                    Slide nonaktif tetap tersimpan tetapi tidak ditampilkan.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Simpan Slide
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Batal Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Daftar Slide <Badge variant="outline">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                <Plus className="mx-auto mb-2 h-8 w-8" />
                Belum ada slide hero.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.altText || item.title || "Slide hero"}
                    className="aspect-video w-full bg-slate-950 object-contain"
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.title || `Slide #${item.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Urutan {item.sortOrder ?? 0}
                        </p>
                      </div>
                      <Badge
                        className={item.isActive ? "bg-emerald-600" : "bg-gray-500"}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Hapus slide hero ini?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
