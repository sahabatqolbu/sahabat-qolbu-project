// dashboard/src/app/(dashboard)/admin/master/banks/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Landmark, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";

export default function BanksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // ✅ Missing state variables added
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: () => masterService.banks.getAll(),
  });

  // ✅ Delete mutation added
  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterService.banks.delete(id),
    onSuccess: () => {
      toast({ title: "✅ Bank berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal menghapus bank",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleDelete = () => {
    if (selectedBank) {
      deleteMutation.mutate(selectedBank.id);
    }
  };

  const banks = data?.data || [];
  const filteredBanks = banks.filter(
    (bank: any) =>
      bank.bankName?.toLowerCase().includes(search.toLowerCase()) ||
      bank.accountName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="h-8 w-8" />
            Master Bank
          </h1>
          <p className="text-gray-600 mt-1">Kelola rekening bank perusahaan</p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => router.push("/admin/master/banks/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Bank
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama bank atau pemilik rekening..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Rekening Bank</CardTitle>
          <CardDescription>
            Total {filteredBanks.length} rekening
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="text-center py-12">
              <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada rekening bank ditemukan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bank</TableHead>
                  <TableHead>Nomor Rekening</TableHead>
                  <TableHead>Atas Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBanks.map((bank: any) => (
                  <TableRow key={bank.id}>
                    <TableCell className="font-medium">
                      {bank.bankName}
                    </TableCell>
                    <TableCell className="font-mono">
                      {bank.accountNumber}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {bank.accountName}
                    </TableCell>
                    <TableCell>
                      {bank.isActive ? (
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/admin/master/banks/edit/${bank.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBank(bank);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ✅ Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rekening Bank?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus rekening{" "}
              <span className="font-bold text-gray-900">
                {selectedBank?.bankName} - {selectedBank?.accountNumber}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
