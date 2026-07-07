"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Image as ImageIcon,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react";

type GalleryCategory = "KEBERANGKATAN" | "HOTEL" | "MASJID" | "KEGIATAN" | "LAINNYA";

interface GalleryItem {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  category: GalleryCategory;
  isActive: boolean;
  sortOrder: number;
}

interface GalleryFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: GalleryCategory;
  isActive: boolean;
  sortOrder: number;
}

const GALLERY_CATEGORIES: Array<{ value: GalleryCategory; label: string }> = [
  { value: "KEBERANGKATAN", label: "Keberangkatan" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MASJID", label: "Masjid" },
  { value: "KEGIATAN", label: "Kegiatan" },
  { value: "LAINNYA", label: "Lainnya" },
];

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Terjadi kesalahan";
};

export default function AdminGalleryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<GalleryFormData>({
    title: "",
    description: "",
    imageUrl: "",
    category: "LAINNYA",
    isActive: true,
    sortOrder: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const res = await api.get("/gallery");
      return res.data;
    },
  });

  const galleryItems: GalleryItem[] = Array.isArray(data?.data) ? data.data : [];

  const buildPayload = (payload: GalleryFormData) => {
    const body = new FormData();
    body.append("title", payload.title);
    body.append("description", payload.description);
    body.append("category", payload.category);
    body.append("isActive", String(payload.isActive));
    body.append("sortOrder", String(payload.sortOrder));

    if (selectedFile) {
      body.append("image", selectedFile);
    } else if (payload.imageUrl) {
      body.append("imageUrl", payload.imageUrl);
    }

    return body;
  };

  const createMutation = useMutation({
    mutationFn: (payload: GalleryFormData) =>
      api.post("/gallery", buildPayload(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Item gallery berhasil ditambahkan" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Gagal menambah gallery",
        description: getErrorMessage(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GalleryFormData }) =>
      api.put(`/gallery/${id}`, buildPayload(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Item gallery berhasil diupdate" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Gagal update gallery",
        description: getErrorMessage(error),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/gallery/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setDeleteDialogOpen(false);
      toast({ title: "Item gallery berhasil dihapus" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Gagal hapus gallery",
        description: getErrorMessage(error),
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      category: "LAINNYA",
      isActive: true,
      sortOrder: 0,
    });
    setSelectedFile(null);
    setEditMode(false);
    setSelectedItem(null);
  };

  const handleEdit = (item: GalleryItem) => {
    setSelectedItem(item);
    setSelectedFile(null);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      imageUrl: item.imageUrl,
      category: item.category,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak valid",
        description: "Silakan pilih file gambar.",
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editMode && !selectedFile && !formData.imageUrl) {
      toast({ variant: "destructive", title: "Gambar wajib diupload" });
      return;
    }

    if (editMode && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, payload: formData });
      return;
    }
    createMutation.mutate(formData);
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            Gallery
          </h1>
          <p className="text-gray-600 mt-1">Kelola aset image gallery publik</p>
        </div>
        <Button
          className="bg-secondary"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Gallery
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Gallery</CardTitle>
          <CardDescription>Total {galleryItems.length} image</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada item gallery</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {galleryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.title || "gallery image"}
                        className="w-16 h-16 rounded object-cover border"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.title || "Tanpa Judul"}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 max-w-sm">{item.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {GALLERY_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">Nonaktif</Badge>
                      )}
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
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedItem(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Gallery" : "Tambah Gallery"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Keberangkatan kloter Januari"
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Opsional"
              />
            </div>

            <div className="space-y-2">
              <Label>Gambar</Label>
              {formData.imageUrl && !selectedFile && (
                <img
                  src={getImageUrl(formData.imageUrl)}
                  alt="Preview gallery"
                  className="h-32 w-full rounded-md border object-cover"
                />
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                {selectedFile ? selectedFile.name : editMode ? "Upload gambar baru" : "Upload gambar"}
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value as GalleryCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GALLERY_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value || "0", 10),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, isActive: value === "active" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editMode ? "Update" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Item Gallery?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Item <strong>{selectedItem?.title || "tanpa judul"}</strong> akan dihapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}