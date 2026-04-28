"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
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
  HelpCircle,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

type FAQCategory = "UMRAH" | "HAJI" | "PAYMENT" | "GENERAL";

interface FAQItem {
  id: number;
  category: FAQCategory;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
}

interface FAQFormData {
  category: FAQCategory;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
}

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

const FAQ_CATEGORIES = [
  { value: "UMRAH", label: "Umrah" },
  { value: "HAJI", label: "Haji" },
  { value: "PAYMENT", label: "Pembayaran" },
  { value: "GENERAL", label: "Umum" },
];

export default function FAQsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [formData, setFormData] = useState<FAQFormData>({
    category: "GENERAL",
    question: "",
    answer: "",
    isActive: true,
    sortOrder: 0,
  });

  // ===== FETCH FAQs =====
  const { data, isLoading } = useQuery({
    queryKey: ["faqs", categoryFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (categoryFilter !== "all") params.category = categoryFilter;
      const res = await api.get("/faqs", { params });
      return res.data;
    },
  });

  const faqs: FAQItem[] = Array.isArray(data?.data) ? data.data : [];

  // ===== CREATE MUTATION =====
  const createMutation = useMutation({
    mutationFn: (payload: FAQFormData) => api.post("/faqs", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "✅ FAQ berhasil ditambahkan" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal menambah FAQ",
        description: getErrorMessage(error),
      });
    },
  });

  // ===== UPDATE MUTATION =====
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FAQFormData }) =>
      api.put(`/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "✅ FAQ berhasil diupdate" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal update FAQ",
        description: getErrorMessage(error),
      });
    },
  });

  // ===== DELETE MUTATION =====
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/faqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setDeleteDialogOpen(false);
      toast({ title: "✅ FAQ berhasil dihapus" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal menghapus FAQ",
        description: getErrorMessage(error),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: FAQItem) => {
    setSelectedItem(item);
    setFormData({
      category: item.category,
      question: item.question,
      answer: item.answer,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "GENERAL",
      question: "",
      answer: "",
      isActive: true,
      sortOrder: 0,
    });
    setEditMode(false);
    setSelectedItem(null);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      UMRAH: "bg-green-100 text-green-800",
      HAJI: "bg-purple-100 text-purple-800",
      PAYMENT: "bg-blue-100 text-blue-800",
      GENERAL: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.GENERAL;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            FAQ (Pertanyaan Umum)
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola pertanyaan yang sering ditanyakan
          </p>
        </div>
        <Button
          className="bg-secondary"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah FAQ
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {FAQ_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar FAQ</CardTitle>
          <CardDescription>Total {faqs.length} pertanyaan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada FAQ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Pertanyaan</TableHead>
                  <TableHead>Jawaban</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getCategoryBadge(item.category)}
                      >
                        {
                          FAQ_CATEGORIES.find((c) => c.value === item.category)
                            ?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-md">
                      {item.question}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                        {item.answer}
                      </p>
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-800"
                        >
                          Nonaktif
                        </Badge>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData({ ...formData, category: val as FAQCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
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
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pertanyaan *</Label>
              <Textarea
                rows={2}
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jawaban *</Label>
              <Textarea
                rows={5}
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Status Aktif</Label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-secondary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedItem) deleteMutation.mutate(selectedItem.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
