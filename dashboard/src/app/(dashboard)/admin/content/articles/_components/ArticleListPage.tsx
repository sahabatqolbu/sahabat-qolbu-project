"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

type ArticleStatus = "DRAFT" | "PUBLISHED";
type ArticleCategory =
  | "UMRAH"
  | "HOTEL"
  | "MASKAPAI"
  | "PANDUAN"
  | "LAYANAN"
  | "LAINNYA";
type RelatedType = "NONE" | "HOTEL" | "AIRLINE" | "PACKAGE" | "SERVICE";

interface ArticleItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: ArticleCategory;
  status: ArticleStatus;
  relatedType: RelatedType;
  relatedId?: number | null;
}

interface ArticleListPageProps {
  basePath: string;
}

const ARTICLE_ENDPOINT = "/master/articles";

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error === null) return "Terjadi kesalahan";
  const payload = error as { response?: { data?: { message?: string } } };
  return payload.response?.data?.message || "Terjadi kesalahan";
};

export default function ArticleListPage({ basePath }: ArticleListPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArticleItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["articles", statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get(ARTICLE_ENDPOINT, { params });
      return res.data;
    },
  });

  const articles: ArticleItem[] = Array.isArray(data?.data) ? data.data : [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${ARTICLE_ENDPOINT}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      toast({ title: "Artikel berhasil dihapus" });
    },
    onError: (error: unknown) =>
      toast({
        variant: "destructive",
        title: "Gagal hapus artikel",
        description: getErrorMessage(error),
      }),
  });

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
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => router.push(`${basePath}/create`)}
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
            <div className="overflow-x-auto">
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
                            className="h-14 w-20 rounded border object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded border bg-gray-50">
                            <ImagePlus className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-primary">
                          {item.title}
                        </p>
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
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`${basePath}/edit/${item.id}`)
                              }
                            >
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
            </div>
          )}
        </CardContent>
      </Card>

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
