"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Star,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function AgentLevelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<any>(null);

  // ===== FETCH LEVELS =====
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-levels"],
    queryFn: async () => {
      const response = await adminService.agentLevels.getAll();
      return response;
    },
  });

  const levels = data?.data || [];

  // ===== DELETE MUTATION =====
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.agentLevels.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-levels"] });
      setDeleteDialogOpen(false);
      toast({
        title: "✅ Level Dihapus",
        description: "Level agen berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Hapus Level",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleDelete = () => {
    if (selectedLevel) {
      deleteMutation.mutate(selectedLevel.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Level Agen
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola level agen dan benefit per level
          </p>
        </div>
        <Link href="/admin/master/agent-levels/create">
          <Button className="bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Level
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Level Agen</CardTitle>
          <CardDescription>Total {levels.length} level</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error: {(error as any).message}</p>
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada level agen</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Bintang</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Syarat Naik</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((level: any) => (
                    <TableRow key={level.id}>
                      <TableCell className="font-medium">
                        {level.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: level.star }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                          {level.star === 0 && (
                            <span className="text-gray-400 text-sm">
                              Pra-Agent
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          {/* <DollarSign className="h-4 w-4" /> */} Rp. {" "}
                          {parseFloat(level.price).toLocaleString("id-ID")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {level.minClosing ? (
                          <div className="text-sm text-gray-600">
                            {level.minClosing} closing dalam {level.maxPeriod}{" "}
                            periode
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {level.benefits?.length || 0} benefit
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {level.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Nonaktif</Badge>
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
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/master/agent-levels/${level.id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedLevel(level);
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Level</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus level{" "}
              <strong>{selectedLevel?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
