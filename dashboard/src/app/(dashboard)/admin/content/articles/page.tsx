"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  FileText,
  ImagePlus,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

type ArticleStatus = "DRAFT" | "PUBLISHED";
type ArticleCategory =
  "UMRAH" | "HOTEL" | "MASKAPAI" | "PANDUAN" | "LAYANAN" | "LAINNYA";
type RelatedType = "NONE" | "HOTEL" | "AIRLINE" | "PACKAGE" | "SERVICE";

interface ArticleItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  category: ArticleCategory;
  tags?: string[];
  status: ArticleStatus;
  relatedType: RelatedType;
  relatedId?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
}

interface OptionItem {
  id: number;
  name: string;
  code?: string;
}

interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  tags: string;
  status: ArticleStatus;
  relatedType: RelatedType;
  relatedId: string;
  seoTitle: string;
  seoDescription: string;
}

const ARTICLE_ENDPOINT = "/master/articles";
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

const CATEGORIES: Array<{ value: ArticleCategory; label: string }> = [
  { value: "UMRAH", label: "Umroh" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MASKAPAI", label: "Maskapai" },
  { value: "PANDUAN", label: "Panduan" },
  { value: "LAYANAN", label: "Layanan" },
  { value: "LAINNYA", label: "Lainnya" },
];

const RELATED_TYPES: Array<{ value: RelatedType; label: string }> = [
  { value: "NONE", label: "Artikel normal" },
  { value: "HOTEL", label: "Hotel" },
  { value: "AIRLINE", label: "Maskapai" },
  { value: "PACKAGE", label: "Paket" },
  { value: "SERVICE", label: "Layanan" },
];

const emptyForm: ArticleFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "LAINNYA",
  tags: "",
  status: "DRAFT",
  relatedType: "NONE",
  relatedId: "",
  seoTitle: "",
  seoDescription: "",
};

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error === null) return "Terjadi kesalahan";
  const payload = error as { response?: { data?: { message?: string } } };
  return payload.response?.data?.message || "Terjadi kesalahan";
};

const normalizeTags = (tags?: string[]) =>
  Array.isArray(tags) ? tags.join(", ") : "";

export default function AdminArticlesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArticleItem | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState<ArticleFormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["articles", statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get(ARTICLE_ENDPOINT, { params });
      return res.data;
    },
  });

  const { data: hotelsData } = useQuery({
    queryKey: ["hotels-options"],
    queryFn: async () => (await api.get("/master/hotels")).data,
  });
  const { data: airlinesData } = useQuery({
    queryKey: ["airlines-options"],
    queryFn: async () => (await api.get("/master/airlines")).data,
  });
  const { data: packagesData } = useQuery({
    queryKey: ["packages-options"],
    queryFn: async () =>
      (await api.get("/admin/packages", { params: { limit: 100 } })).data,
  });

  const articles: ArticleItem[] = Array.isArray(data?.data) ? data.data : [];
  const hotels: OptionItem[] = Array.isArray(hotelsData?.data)
    ? hotelsData.data
    : [];
  const airlines: OptionItem[] = Array.isArray(airlinesData?.data)
    ? airlinesData.data
    : [];
  const packages: OptionItem[] = Array.isArray(packagesData?.data?.packages)
    ? packagesData.data.packages
    : [];

  const relationOptions = useMemo(() => {
    if (formData.relatedType === "HOTEL") return hotels;
    if (formData.relatedType === "AIRLINE") return airlines;
    if (formData.relatedType === "PACKAGE") return packages;
    return [];
  }, [airlines, formData.relatedType, hotels, packages]);

  const buildPayload = () => {
    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => body.append(key, value));
    if (formData.relatedType === "NONE" || formData.relatedType === "SERVICE") {
      body.set("relatedId", "");
    }
    if (coverFile) body.append("coverImage", coverFile);
    return body;
  };

  const createMutation = useMutation({
    mutationFn: () => api.post(ARTICLE_ENDPOINT, buildPayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Artikel berhasil ditambahkan" });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal menambah artikel",
        description: getErrorMessage(error),
      }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`${ARTICLE_ENDPOINT}/${selectedItem?.id}`, buildPayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Artikel berhasil diupdate" });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal update artikel",
        description: getErrorMessage(error),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${ARTICLE_ENDPOINT}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDeleteDialogOpen(false);
      toast({ title: "Artikel berhasil dihapus" });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal hapus artikel",
        description: getErrorMessage(error),
      }),
  });

  const imageUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("image", file);
      return api.post(`${ARTICLE_ENDPOINT}/images`, body);
    },
    onSuccess: (response) => {
      const url = response.data?.data?.url;
      if (!url) return;
      setFormData((prev) => ({
        ...prev,
        content: `${prev.content}${prev.content ? "\n\n" : ""}![Gambar artikel](${url})`,
      }));
      toast({ title: "Gambar konten ditambahkan" });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal upload gambar",
        description: getErrorMessage(error),
      }),
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setCoverFile(null);
    setSelectedItem(null);
  };

  const handleEdit = (item: ArticleItem) => {
    setSelectedItem(item);
    setCoverFile(null);
    setFormData({
      title: item.title || "",
      slug: item.slug || "",
      excerpt: item.excerpt || "",
      content: item.content || "",
      category: item.category || "LAINNYA",
      tags: normalizeTags(item.tags),
      status: item.status || "DRAFT",
      relatedType: item.relatedType || "NONE",
      relatedId: item.relatedId ? String(item.relatedId) : "",
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
    });
    setDialogOpen(true);
  };

  const handleCoverChange = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Format gambar tidak valid" });
      return;
    }
    setCoverFile(file);
  };

  const handleContentImage = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Format gambar tidak valid" });
      return;
    }
    imageUploadMutation.mutate(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedItem) updateMutation.mutate();
    else createMutation.mutate();
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-serif font-bold text-gray-900 md:text-3xl">
            <FileText className="h-8 w-8" />
            Artikel
          </h1>
          <p className="mt-1 text-gray-600">
            Kelola artikel edukasi, hotel, maskapai, dan layanan.
          </p>
        </div>
        <Button
          className="bg-secondary"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Artikel
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Artikel</CardTitle>
          <CardDescription>Total {articles.length} artikel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Belum ada artikel
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Relasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.coverImage ? (
                        <img
                          src={getImageUrl(item.coverImage)}
                          alt={item.title}
                          className="h-14 w-20 rounded object-cover border"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded border bg-gray-50">
                          <ImagePlus className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-primary">{item.title}</p>
                      <p className="text-xs text-gray-500">/{item.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {item.relatedType === "NONE"
                        ? "Normal"
                        : `${item.relatedType} #${item.relatedId || "-"}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }
                        variant="outline"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedItem(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit Artikel" : "Tambah Artikel"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, slug: e.target.value }))
                  }
                  placeholder="otomatis dari judul jika kosong"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ringkasan</Label>
              <Textarea
                rows={3}
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, excerpt: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      category: value as ArticleCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      status: value as ArticleStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, tags: e.target.value }))
                  }
                  placeholder="umroh, hotel, tips"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hubungkan ke</Label>
                <Select
                  value={formData.relatedType}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      relatedType: value as RelatedType,
                      relatedId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATED_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {relationOptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Pilih data terkait</Label>
                  <Select
                    value={formData.relatedId}
                    onValueChange={(value) =>
                      setFormData((p) => ({ ...p, relatedId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationOptions.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.code
                            ? `${item.code} - ${item.name}`
                            : item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : formData.relatedType === "SERVICE" ? (
                <div className="space-y-2">
                  <Label>Nama/ID layanan</Label>
                  <Input
                    value={formData.relatedId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, relatedId: e.target.value }))
                    }
                    placeholder="opsional"
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Cover Artikel</Label>
              {selectedItem?.coverImage && !coverFile ? (
                <img
                  src={getImageUrl(selectedItem.coverImage)}
                  alt="Cover"
                  className="h-36 w-full rounded border object-cover"
                />
              ) : null}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                {coverFile ? coverFile.name : "Upload cover"}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                  className="hidden"
                  onChange={(e) => handleCoverChange(e.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-gray-500">
                Cover otomatis dikonversi menjadi WebP.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Konten *</Label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                  <ImagePlus className="h-4 w-4" />
                  Upload gambar konten
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                    className="hidden"
                    onChange={(e) => handleContentImage(e.target.files?.[0])}
                  />
                </label>
              </div>
              <Textarea
                rows={14}
                value={formData.content}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, content: e.target.value }))
                }
                required
                placeholder="Tulis artikel. Gambar konten akan masuk otomatis dalam format markdown."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={formData.seoTitle}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, seoTitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Input
                  value={formData.seoDescription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      seoDescription: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Artikel?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Artikel <strong>{selectedItem?.title}</strong> akan dihapus
            permanen.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedItem && deleteMutation.mutate(selectedItem.id)
              }
              disabled={deleteMutation.isPending}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
