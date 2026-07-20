"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileText,
  ImagePlus,
  Loader2,
  Save,
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
}

interface OptionItem {
  id: number;
  name: string;
  code?: string;
}

type ApiListPayload = {
  data?: unknown;
  hotels?: unknown;
  airlines?: unknown;
  packages?: unknown;
};

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

interface ArticleFormPageProps {
  basePath: string;
  mode: "create" | "edit";
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

const articleCategoryValues = CATEGORIES.map((item) => item.value);
const relatedTypeValues = RELATED_TYPES.map((item) => item.value);

const normalizeArticleCategory = (value: unknown) =>
  normalizeEnumValue(value, articleCategoryValues, "LAINNYA", {
    AIRLINE: "MASKAPAI",
    AIRLINES: "MASKAPAI",
    MASKAPAI: "MASKAPAI",
  });

const normalizeArticleStatus = (value: unknown) =>
  normalizeEnumValue(value, ["DRAFT", "PUBLISHED"], "DRAFT", {
    ACTIVE: "PUBLISHED",
    PUBLISH: "PUBLISHED",
    TERBIT: "PUBLISHED",
  });

const inferRelatedType = (
  relatedType: unknown,
  category: ArticleCategory,
  relatedId?: number | null,
) => {
  const normalized = normalizeEnumValue(
    relatedType,
    relatedTypeValues,
    "NONE",
    {
      MASKAPAI: "AIRLINE",
      AIRLINES: "AIRLINE",
      PAKET: "PACKAGE",
    },
  );

  if (normalized !== "NONE") return normalized;
  if (!relatedId) return "NONE";
  if (category === "HOTEL") return "HOTEL";
  if (category === "MASKAPAI") return "AIRLINE";
  if (category === "UMRAH") return "PACKAGE";
  if (category === "LAYANAN") return "SERVICE";
  return "NONE";
};

const mapArticleToFormData = (article: ArticleItem): ArticleFormData => {
  const category = normalizeArticleCategory(article.category);
  return {
    title: article.title || "",
    slug: article.slug || "",
    excerpt: article.excerpt || "",
    content: article.content || "",
    category,
    tags: normalizeTags(article.tags),
    status: normalizeArticleStatus(article.status),
    relatedType: inferRelatedType(
      article.relatedType,
      category,
      article.relatedId,
    ),
    relatedId: article.relatedId ? String(article.relatedId) : "",
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
  };
};

const normalizeEnumValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  aliases: Partial<Record<string, T>> = {},
) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
};

const resolveOptionList = (
  payload: unknown,
  key?: "hotels" | "airlines" | "packages",
) => {
  if (Array.isArray(payload)) return payload as OptionItem[];
  if (!payload || typeof payload !== "object") return [];

  const data = payload as ApiListPayload;
  if (key && Array.isArray(data[key])) return data[key] as OptionItem[];
  if (Array.isArray(data.data)) return data.data as OptionItem[];

  if (data.data && typeof data.data === "object") {
    const nested = data.data as ApiListPayload;
    if (key && Array.isArray(nested[key])) return nested[key] as OptionItem[];
    if (Array.isArray(nested.data)) return nested.data as OptionItem[];
  }

  return [];
};

const resolveArticlePayload = (payload: unknown): ArticleItem | null => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as {
    data?: unknown;
    article?: unknown;
  };
  if (data.article && typeof data.article === "object") {
    return data.article as ArticleItem;
  }
  if (data.data && typeof data.data === "object") {
    const nested = data.data as { article?: unknown };
    if (nested.article && typeof nested.article === "object") {
      return nested.article as ArticleItem;
    }
    return data.data as ArticleItem;
  }
  return payload as ArticleItem;
};

const extractContentImages = (content: string) =>
  Array.from(content.matchAll(/!?\[([^\]]*)\]\(([^)]+)\)/g)).map((match) => ({
    alt: match[1] || "Gambar artikel",
    src: match[2],
  }));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function ArticleFormPage({
  basePath,
  mode,
}: ArticleFormPageProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ArticleFormData>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const hydratedArticleSignatureRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);

  const articleId = params?.id;
  const isEdit = mode === "edit";

  const { data: articleData, isLoading: articleLoading } = useQuery({
    queryKey: ["article", articleId],
    enabled: isEdit && Boolean(articleId),
    queryFn: async () =>
      (await api.get(`${ARTICLE_ENDPOINT}/${articleId}`)).data,
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

  const article: ArticleItem | null = resolveArticlePayload(articleData);
  const hotels = resolveOptionList(hotelsData, "hotels");
  const airlines = resolveOptionList(airlinesData, "airlines");
  const packages = resolveOptionList(packagesData, "packages");

  useEffect(() => {
    if (!article) return;

    const nextSignature = JSON.stringify({
      id: article.id || articleId || "",
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category || "",
      status: article.status || "",
      relatedType: article.relatedType || "",
      relatedId: article.relatedId || null,
      tags: article.tags || [],
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
    });

    if (hydratedArticleSignatureRef.current === nextSignature) return;
    if (hydratedArticleSignatureRef.current && isDirtyRef.current) return;

    hydratedArticleSignatureRef.current = nextSignature;
    setFormData(mapArticleToFormData(article));
    setCoverFile(null);
    setRemoveCoverImage(false);
  }, [article, articleId]);

  const relationOptions = useMemo(() => {
    if (formData.relatedType === "HOTEL") return hotels;
    if (formData.relatedType === "AIRLINE") return airlines;
    if (formData.relatedType === "PACKAGE") return packages;
    return [];
  }, [airlines, formData.relatedType, hotels, packages]);

  const contentImages = useMemo(
    () => extractContentImages(formData.content),
    [formData.content],
  );

  const updateFormData = useCallback(
    (updater: (prev: ArticleFormData) => ArticleFormData) => {
      isDirtyRef.current = true;
      setFormData(updater);
    },
    [],
  );

  const buildPayload = () => {
    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => body.append(key, value));
    if (formData.relatedType === "NONE" || formData.relatedType === "SERVICE") {
      body.set("relatedId", "");
    }
    if (coverFile) body.append("coverImage", coverFile);
    if (removeCoverImage && !coverFile) body.append("removeCoverImage", "true");
    return body;
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isEdit
        ? api.put(`${ARTICLE_ENDPOINT}/${articleId}`, buildPayload())
        : api.post(ARTICLE_ENDPOINT, buildPayload()),
    onSuccess: () => {
      isDirtyRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: isEdit
          ? "Artikel berhasil diupdate"
          : "Artikel berhasil ditambahkan",
      });
      router.push(basePath);
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: isEdit ? "Gagal update artikel" : "Gagal menambah artikel",
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
      updateFormData((prev) => ({
        ...prev,
        content: `${prev.content}${prev.content ? "\n\n" : ""}![Gambar artikel](${url})`,
      }));
      toast({
        title: "Gambar konten ditambahkan",
        description: "Preview gambar tampil di bawah editor konten.",
      });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal upload gambar",
        description: getErrorMessage(error),
      }),
  });

  const handleCoverChange = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Format gambar tidak valid" });
      return;
    }
    setCoverFile(file);
    setRemoveCoverImage(false);
  };

  const handleContentImage = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Format gambar tidak valid" });
      return;
    }
    imageUploadMutation.mutate(file);
  };

  const handleRemoveContentImage = (src: string) => {
    const pattern = new RegExp(
      `\\n{0,2}!?\\[[^\\]]*\\]\\(${escapeRegExp(src)}\\)\\n{0,2}`,
      "g",
    );
    updateFormData((prev) => ({
      ...prev,
      content: prev.content.replace(pattern, "\n\n").trim(),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  if (articleLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={basePath}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-serif font-bold text-gray-900 md:text-3xl">
            <FileText className="h-7 w-7" />
            {isEdit ? "Edit Artikel" : "Tambah Artikel"}
          </h1>
          <p className="mt-1 text-gray-600">
            Tulis konten artikel di halaman penuh supaya tidak hilang karena
            klik di luar popup.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Utama</CardTitle>
            <CardDescription>
              Judul, ringkasan, kategori, status, dan relasi artikel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    updateFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    updateFormData((p) => ({ ...p, slug: e.target.value }))
                  }
                  placeholder="otomatis dari judul jika kosong"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ringkasan</Label>
              <Textarea
                rows={4}
                value={formData.excerpt}
                onChange={(e) =>
                  updateFormData((p) => ({ ...p, excerpt: e.target.value }))
                }
                placeholder="Ringkasan singkat yang tampil di kartu/list artikel"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category || "LAINNYA"}
                  onValueChange={(value) =>
                    updateFormData((p) => ({
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
                  value={formData.status || "DRAFT"}
                  onValueChange={(value) =>
                    updateFormData((p) => ({
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
                    updateFormData((p) => ({ ...p, tags: e.target.value }))
                  }
                  placeholder="umroh, hotel, tips"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hubungkan ke</Label>
                <Select
                  value={formData.relatedType || "NONE"}
                  onValueChange={(value) =>
                    updateFormData((p) => ({
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
                      updateFormData((p) => ({ ...p, relatedId: value }))
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
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Artikel</CardTitle>
            <CardDescription>
              Gambar cover akan otomatis dikonversi menjadi WebP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {article?.coverImage && !coverFile && !removeCoverImage ? (
              <div className="space-y-3">
                <img
                  src={getImageUrl(article.coverImage)}
                  alt="Cover"
                  className="h-56 w-full rounded-md border object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setRemoveCoverImage(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus cover
                </Button>
              </div>
            ) : null}
            {removeCoverImage && !coverFile ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Cover akan dihapus setelah artikel disimpan.
              </div>
            ) : null}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-5 text-sm text-gray-600 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              {coverFile ? coverFile.name : "Upload cover"}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                className="hidden"
                onChange={(e) => handleCoverChange(e.target.files?.[0])}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Konten Artikel *</CardTitle>
                <CardDescription>
                  Upload gambar konten dari tombol ini. Preview gambar akan
                  tampil di bawah editor setelah upload berhasil.
                </CardDescription>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                <ImagePlus className="h-4 w-4" />
                {imageUploadMutation.isPending
                  ? "Upload..."
                  : "Upload gambar konten"}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                  className="hidden"
                  onChange={(e) => handleContentImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={24}
              value={formData.content}
              onChange={(e) =>
                updateFormData((p) => ({ ...p, content: e.target.value }))
              }
              required
              className="min-h-[520px] font-mono text-sm leading-relaxed"
              placeholder="Tulis artikel panjang di sini..."
            />
            {contentImages.length ? (
              <div className="mt-5 rounded-md border border-dashed bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Preview gambar konten
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {contentImages.map((image, index) => (
                    <figure
                      key={`${image.src}-${index}`}
                      className="overflow-hidden rounded-md border bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(image.src)}
                        alt={image.alt}
                        className="h-auto w-full object-contain"
                      />
                      <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-500">
                        <span className="truncate">{image.alt}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 px-2 text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveContentImage(image.src)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Hapus
                        </Button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
            <CardDescription>
              Opsional, untuk title dan description di halaman artikel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input
                value={formData.seoTitle}
                onChange={(e) =>
                  updateFormData((p) => ({ ...p, seoTitle: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Input
                value={formData.seoDescription}
                onChange={(e) =>
                  updateFormData((p) => ({
                    ...p,
                    seoDescription: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-white/95 px-4 py-4 backdrop-blur md:mx-0 md:rounded-t-md md:border">
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            <Link href={basePath}>
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
              >
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full md:w-auto"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Artikel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
