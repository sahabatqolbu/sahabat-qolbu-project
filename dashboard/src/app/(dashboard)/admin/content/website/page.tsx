"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImagePlus, Loader2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULTS, FIELD_LABELS, SECTION_LABELS, type ContentKey } from "@/lib/site-content-schema";

type Json = string | number | boolean | Json[] | { [key: string]: Json };
type Obj = { [key: string]: Json };

const PAGES: { key: ContentKey; label: string; url: string; help: string }[] = [
  { key: "home", label: "Beranda", url: "https://sahabatqolbu.com/", help: "Slide sambutan, legalitas, keunggulan, cara daftar, galeri, tanya jawab, dan ajakan penutup. Slide promo diatur di menu Hero Slider." },
  { key: "about", label: "Tentang Kami", url: "https://sahabatqolbu.com/tentang-kami", help: "Semua bagian halaman Tentang Kami. Foto yang belum diupload tidak ditampilkan di website." },
];

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.";

const isObj = (v: unknown): v is Obj => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const label = (key: string) => FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const isImageKey = (key: string) => /(url|photo|image)$/i.test(key);

/** Isian admin di atas bawaan, supaya field baru selalu muncul di form. */
const merge = (def: Json, saved: unknown): Json => {
  if (Array.isArray(def)) {
    if (!Array.isArray(saved) || !saved.length) return def;
    return saved.map((item, i) => merge(def[i] ?? def[0], item));
  }
  if (isObj(def)) {
    const src = isObj(saved) ? saved : {};
    return Object.fromEntries(Object.entries(def).map(([k, v]) => [k, merge(v, src[k])]));
  }
  if (typeof def === "boolean") return typeof saved === "boolean" ? saved : def;
  return typeof saved === "string" ? saved : def;
};

const setIn = (root: Json, path: (string | number)[], value: Json): Json => {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const obj = root as Obj;
  return { ...obj, [head]: setIn(obj[head as string], rest, value) };
};

function ImageField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "File harus berupa gambar" });
      return;
    }
    const body = new FormData();
    body.append("image", file);
    setUploading(true);
    try {
      const res = await api.post("/master/site-content/images", body);
      onChange(res.data?.data?.url || "");
    } catch (error) {
      toast({ variant: "destructive", title: "Upload gagal", description: errorMessage(error) });
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getImageUrl(value)} alt="" className="h-20 w-28 rounded-md border object-cover" />
      ) : (
        <div className="grid h-20 w-28 place-items-center rounded-md border border-dashed text-xs text-gray-400">Belum ada</div>
      )}
      <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {value ? "Ganti foto" : "Upload foto"}
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
      {value ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
          <X className="mr-1 h-4 w-4" />Hapus
        </Button>
      ) : null}
    </div>
  );
}

function Field({ name, value, def, path, onChange }: { name: string; value: Json; def: Json; path: (string | number)[]; onChange: (path: (string | number)[], v: Json) => void }) {
  const id = path.join("-");
  if (typeof def === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(path, e.target.checked)} className="h-4 w-4" />
        {label(name)}
      </label>
    );
  }
  if (typeof def === "string") {
    if (isImageKey(name)) {
      return (
        <div className="space-y-2">
          <Label>{label(name)}</Label>
          <ImageField id={id} value={String(value || "")} onChange={(v) => onChange(path, v)} />
        </div>
      );
    }
    const long = def.length > 90;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label(name)}</Label>
        {long ? (
          <Textarea id={id} rows={3} value={String(value ?? "")} placeholder={def} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <Input id={id} value={String(value ?? "")} placeholder={def || (/link$/i.test(name) ? "https://..." : "")} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </div>
    );
  }
  if (Array.isArray(def)) {
    const list = Array.isArray(value) ? value : [];
    const template = def[0];
    return (
      <div className="space-y-3">
        <Label>{label(name)}</Label>
        {list.map((item, i) => (
          <div key={i} className="relative rounded-md border bg-gray-50/60 p-3 pr-12">
            {isObj(template) ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(template).map(([k, d]) => (
                  <div key={k} className={typeof d === "string" && d.length > 90 ? "md:col-span-2" : ""}>
                    <Field name={k} value={(item as Obj)[k]} def={d} path={[...path, i, k]} onChange={onChange} />
                  </div>
                ))}
              </div>
            ) : (
              <Field name={`${label(name)} ${i + 1}`} value={item} def={template} path={[...path, i]} onChange={onChange} />
            )}
            <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1" aria-label="Hapus baris" onClick={() => onChange(path, list.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {list.length < 12 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange(path, [...list, isObj(template) ? Object.fromEntries(Object.keys(template).map((k) => [k, ""])) : ""])}
          >
            <Plus className="mr-1 h-4 w-4" />Tambah
          </Button>
        ) : null}
      </div>
    );
  }
  if (isObj(def)) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(def).map(([k, d]) => (
          <div key={k} className={Array.isArray(d) || (typeof d === "string" && (d.length > 90 || isImageKey(k))) ? "md:col-span-2" : ""}>
            <Field name={k} value={(value as Obj)?.[k]} def={d} path={[...path, k]} onChange={onChange} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function WebsiteContentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState<ContentKey>("home");
  const page = PAGES.find((p) => p.key === pageKey)!;
  const defaults = DEFAULTS[pageKey] as Obj;

  const query = useQuery({
    queryKey: ["site-content", pageKey],
    queryFn: async () => (await api.get(`/master/site-content/${pageKey}`)).data?.data,
  });
  const loaded = useMemo(() => merge(defaults, query.data?.content) as Obj, [defaults, query.data]);
  const [draft, setDraft] = useState<Obj | null>(null);
  const dirty = draft !== null;
  const current = draft ?? loaded;

  const save = useMutation({
    mutationFn: async () => api.put(`/master/site-content/${pageKey}`, { content: current }),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["site-content", pageKey] });
      toast({ title: "Konten website tersimpan", description: "Perubahan tampil di website dalam sekitar satu menit." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Gagal menyimpan", description: errorMessage(error) }),
  });

  const change = (path: (string | number)[], value: Json) => {
    setDraft((d) => setIn(d || loaded, path, value) as Obj);
  };

  const switchPage = (key: ContentKey) => {
    if (dirty && !window.confirm("Perubahan belum disimpan. Pindah halaman dan buang perubahan?")) return;
    setDraft(null);
    setPageKey(key);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Konten Website</h1>
          <p className="mt-1 max-w-2xl text-gray-600">
            Ubah teks dan foto halaman publik sahabatqolbu.com. Kolom yang dikosongkan memakai teks bawaan. Kontak, alamat, dan nomor PPIU diambil dari Profil Perusahaan.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={page.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Lihat halaman</a>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilih halaman">
        {PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={pageKey === p.key}
            onClick={() => switchPage(p.key)}
            className={`rounded-md border px-4 py-2 text-sm font-medium ${pageKey === p.key ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">{page.help}</p>

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-5"
        >
          {Object.entries(defaults).map(([section, def]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-lg">{SECTION_LABELS[section] || label(section)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Field name={section} value={current[section]} def={def as Json} path={[section]} onChange={change} />
              </CardContent>
            </Card>
          ))}

          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur md:left-64">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-gray-600">{dirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan sudah tersimpan."}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!dirty}
                  onClick={() => setDraft(null)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />Batalkan
                </Button>
                <Button type="submit" disabled={!dirty || save.isPending}>
                  {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
