// dashboard/src/app/%28dashboard%29/admin/agen/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserCog,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function AdminAgenPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  // ===== FETCH AGENTS =====
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents", search, starFilter, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (starFilter !== "all") params.star = parseInt(starFilter);
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminService.agen.getAll(params);
      return response;
    },
  });

  const agents = data?.data || [];

  // ===== STATS =====
  const stats = {
    total: agents.length,
    pending: agents.filter((a: any) => a.agentData?.status === "PENDING")
      .length,
    approved: agents.filter((a: any) => a.agentData?.status === "APPROVED")
      .length,
    totalJamaah: agents.reduce(
      (sum: number, a: any) => sum + (a.totalJamaah || 0),
      0
    ),
  };

  // ===== DELETE MUTATION =====
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.agen.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setDeleteDialogOpen(false);
      toast({
        title: "✅ Agen Dihapus",
        description: "Agen berhasil dihapus dari sistem",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Hapus Agen",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleDelete = () => {
    if (selectedAgent) {
      deleteMutation.mutate(selectedAgent.id);
    }
  };

  // Helper: Get Star Badge
  const getStarBadge = (star: number) => {
    const config = [
      { bg: "bg-gray-100", text: "text-gray-800", label: "Pra-Agent" },
      { bg: "bg-yellow-100", text: "text-yellow-800", label: "Bintang 1" },
      { bg: "bg-purple-100", text: "text-purple-800", label: "Bintang 2" },
    ];
    return config[star] || config[0];
  };

  // Helper: Get Status Badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: any }> = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800", icon: Clock },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    };
    return variants[status] || variants.DRAFT;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Kelola Agen
          </h1>
          <p className="text-gray-600 mt-1">
            Manajemen agen dan approval pendaftaran
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Agen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menunggu Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agen Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Jamaah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalJamaah}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama atau email..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Star Filter */}
            <Select value={starFilter} onValueChange={setStarFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Bintang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bintang</SelectItem>
                <SelectItem value="0">Pra-Agent</SelectItem>
                <SelectItem value="1">Bintang 1 ⭐</SelectItem>
                <SelectItem value="2">Bintang 2 ⭐⭐</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Agen</CardTitle>
          <CardDescription>
            Total {agents.length} agen terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">Error: {(error as any).message}</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada agen ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="text-center">Level</TableHead>
                    <TableHead className="text-center">Status Data</TableHead>
                    <TableHead className="text-center">
                      Status Approval
                    </TableHead>
                    <TableHead className="text-center">Jamaah</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent: any) => {
                    const starConfig = getStarBadge(
                      agent.agentData?.currentStar || 0
                    );
                    const statusConfig = getStatusBadge(
                      agent.agentData?.status || "DRAFT"
                    );
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={agent.id}>
                        {/* Nama */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {agent.fullName?.charAt(0) || "A"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {agent.fullName}
                              </p>
                              {agent.agentData?.nickname && (
                                <p className="text-xs text-gray-500 truncate">
                                  {agent.agentData.nickname}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Kontak */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm truncate">{agent.email}</p>
                            <p className="text-xs text-gray-500">
                              {agent.phone || "-"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Level Bintang */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`${starConfig.bg} ${starConfig.text}`}
                          >
                            <div className="flex items-center gap-1">
                              {Array.from({
                                length: agent.agentData?.currentStar || 0,
                              }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-current"
                                />
                              ))}
                              <span className="ml-1 whitespace-nowrap">
                                {starConfig.label}
                              </span>
                            </div>
                          </Badge>
                        </TableCell>

                        {/* Status Data */}
                        <TableCell className="text-center">
                          {agent.agentData?.isComplete ? (
                            <Badge className="bg-green-100 text-green-800 whitespace-nowrap">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Lengkap
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Belum Lengkap
                            </Badge>
                          )}
                        </TableCell>

                        {/* Status Approval */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`${statusConfig.bg} ${statusConfig.text} whitespace-nowrap`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {agent.agentData?.status || "Draft"}
                          </Badge>
                        </TableCell>

                        {/* Total Jamaah */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">
                              {agent.totalJamaah || 0}
                            </span>
                          </div>
                        </TableCell>

                        {/* Terdaftar */}
                        <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                          {agent.createdAt
                            ? format(new Date(agent.createdAt), "dd MMM yyyy", {
                                locale: localeId,
                              })
                            : "-"}
                        </TableCell>

                        {/* Aksi */}
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
                                  router.push(`/admin/agen/${agent.id}`)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/admin/agen/${agent.id}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setSelectedAgent(agent);
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
                    );
                  })}
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
            <DialogTitle>Konfirmasi Hapus Agen</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus agen{" "}
              <strong>{selectedAgent?.fullName}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                Tindakan ini tidak dapat dibatalkan!
              </span>
            </DialogDescription>
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
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ya, Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
