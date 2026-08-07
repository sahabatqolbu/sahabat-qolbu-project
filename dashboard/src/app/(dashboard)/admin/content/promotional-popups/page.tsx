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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PopupItem {
  id: number;
  title?: string | null;
  imageUrl: string;
  altText?: string | null;
  targetUrl?: string | null;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  delaySeconds: number;
  updatedAt?: string | null;
}

const endpoint = "/master/promotional-popups";
const emptyForm = {
  title: "",
  altText: "",
  targetUrl: "",
  startAt: "",
  endAt: "",
  delaySeconds: "2",
  isActive: true,
};

const toDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || "Terjadi kesalahan. Silakan coba lagi.";

export default function PromotionalPopupsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<PopupItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["promotional-popups"],
    queryFn: async () => (await api.get(endpoint)).data,
  });
  const items: PopupItem[] = Array.isArray(data?.data) ? data.data : [];
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
      queryClient.invalidateQueries({ queryKey: ["promotional-popups"] });
      toast({
        title: editing ? "Popup berhasil diperbarui" : "Popup berhasil dibuat",
      });
      reset();
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal menyimpan popup",
        description: errorMessage(error),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotional-popups"] });
      toast({ title: "Popup berhasil dihapus" });
      reset();
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal menghapus popup",
        description: errorMessage(error),
      }),
  });

  const startEdit = (item: PopupItem) => {
    setEditing(item);
    setFile(null);
    setLocalPreview("");
    setForm({
      title: item.title || "",
      altText: item.altText || "",
      targetUrl: item.targetUrl || "",
      startAt: toDateTimeInput(item.startAt),
      endAt: toDateTimeInput(item.endAt),
      delaySeconds: String(item.delaySeconds ?? 2),
      isActive: Boolean(item.isActive),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing && !file) {
      toast({ variant: "destructive", title: "Gambar popup wajib dipilih" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 md:text-3xl">
          <ImageIcon className="h-7 w-7 text-primary" /> Popup Website
        </h1>
        <p className="mt-1 text-gray-600">
          Atur campaign gambar yang tampil sekali untuk setiap pengunjung.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Popup" : "Buat Popup Baru"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label>Judul internal</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Promo Umroh September"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Gambar popup {editing ? "(opsional jika tidak diganti)" : "*"}
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    setLocalPreview(
                      selected ? URL.createObjectURL(selected) : "",
                    );
                  }}
                />
                <p className="text-xs text-gray-500">
                  JPG, PNG, atau WebP. Sistem otomatis menyimpan sebagai WebP.
                </p>
              </div>
              {preview && (
                <div className="overflow-hidden rounded-md border bg-gray-50 p-2">
                  <img
                    src={preview}
                    alt="Preview popup"
                    className="mx-auto max-h-80 object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Teks alternatif gambar</Label>
                <Input
                  value={form.altText}
                  onChange={(e) =>
                    setForm({ ...form, altText: e.target.value })
                  }
                  placeholder="Informasi paket terbaru Sahabat Qolbu"
                />
              </div>
              <div className="space-y-2">
                <Label>Link tujuan</Label>
                <Input
                  value={form.targetUrl}
                  onChange={(e) =>
                    setForm({ ...form, targetUrl: e.target.value })
                  }
                  placeholder="https://sahabatqolbu.com/paket atau /paket"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mulai tayang</Label>
                  <Input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm({ ...form, startAt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selesai tayang</Label>
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm({ ...form, endAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Delay tampil (detik)</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={form.delaySeconds}
                  onChange={(e) =>
                    setForm({ ...form, delaySeconds: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-3 rounded-md border p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span>
                  <strong className="block text-sm">Aktifkan popup</strong>
                  <span className="text-xs text-gray-500">
                    Mengaktifkan campaign ini otomatis menonaktifkan campaign
                    lain.
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
                  Simpan Popup
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
              Daftar Popup <Badge variant="outline">{items.length}</Badge>
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
                Belum ada popup.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-md border"
                >
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.altText || item.title || "Popup"}
                    className="h-44 w-full bg-gray-50 object-contain"
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.title || `Popup #${item.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Delay {item.delaySeconds || 0} detik
                        </p>
                      </div>
                      <Badge
                        className={
                          item.isActive ? "bg-emerald-600" : "bg-gray-500"
                        }
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Hapus popup ini?"))
                            deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Hapus
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
