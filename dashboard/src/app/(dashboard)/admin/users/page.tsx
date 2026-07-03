// dashboard/src/app/(dashboard)/admin/users/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ TAMBAHKAN INI
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Loader2,
  Eye,
  FileDown,
  FileUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import * as XLSX from "xlsx"; // ✅ TAMBAH INI

// Role Badge Color
const getRoleBadge = (role: string) => {
  const variants: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    FINANCE: "bg-green-100 text-green-800 border-green-200",
    STAFF: "bg-orange-100 text-orange-800 border-orange-200",
    AGEN: "bg-blue-100 text-blue-800 border-blue-200",
    JAMAAH: "bg-gray-100 text-gray-800 border-gray-200",
    CALON_JAMAAH: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return variants[role] || variants.JAMAAH;
};

export default function UsersPage() {
  const router = useRouter(); // ✅ TAMBAHKAN INI
  const { user: authUser } = useAuthStore();
  const isStaff = authUser?.role === "STAFF";
  const isFinance = authUser?.role === "FINANCE";
  const isReadOnlyRole = isFinance;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // ===== DOWNLOAD TEMPLATE =====
  const downloadTemplate = () => {
    const templateData = [
      {
        fullName: "Fulan bin Fulan",
        email: "fulan@example.com",
        phone: "08123456789",
        role: "JAMAAH",
        packageId: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Auto-width for columns
    const wscols = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, "Template_Import_User.xlsx");
  };

  // ===== HANDLE IMPORT EXCEL =====
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast({ variant: "destructive", title: "File Kosong", description: "Tidak ada data di dalam file." });
          return;
        }

        const response = await adminService.users.importUsers(data);

        if (response.success) {
          toast({
            title: "✅ Import Berhasil",
            description: `Berhasil: ${response.data.success}, Gagal: ${response.data.failed}`,
          });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          setImportDialogOpen(false);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "❌ Gagal Import",
          description: error.response?.data?.message || "Format file tidak didukung",
        });
      } finally {
        setIsImporting(false);
        e.target.value = ""; // reset input
      }
    };

    reader.readAsBinaryString(file);
  };

  // ===== FETCH USERS =====
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", search, roleFilter, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const response = await adminService.users.getAll(params);
      return response;
    },
  });

  const users = data?.data || [];
  const displayedUsers = (isStaff || isFinance)
    ? users.filter((u: any) => u.role === "AGEN" || u.role === "JAMAAH")
    : users;

  // ===== TOGGLE USER STATUS =====
  const toggleStatusMutation = useMutation({
    mutationFn: (userId: number) => adminService.users.toggleStatus(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const user = users.find((u: any) => u.id === userId);
      toast({
        title: "✅ Status Diupdate",
        description: `User ${user?.fullName} ${user?.isActive ? "dinonaktifkan" : "diaktifkan"
          }`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Update Status",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // ===== DELETE USER =====
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => adminService.users.deleteUser(userId), // ✅ UBAH INI
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteDialogOpen(false);
      toast({
        title: "✅ User Dihapus",
        description: "User berhasil dihapus dari sistem",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Hapus User",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  // ===== BULK ACTIONS =====
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => adminService.users.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedIds([]);
      toast({ title: "✅ Berhasil", description: "User terpilih berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Gagal", description: error.response?.data?.message || "Terjadi kesalahan" });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, isActive }: { ids: number[]; isActive: boolean }) =>
      adminService.users.bulkUpdateStatus(ids, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedIds([]);
      toast({ title: "✅ Berhasil", description: "Status user terpilih berhasil diperbarui" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Gagal", description: error.response?.data?.message || "Terjadi kesalahan" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedUsers.map((u: any) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, userId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Kelola User
          </h1>
          <p className="text-gray-600 mt-1">
            {(isStaff || isFinance)
              ? "Manajemen user sistem (Agen, Jamaah)"
              : "Manajemen user sistem (Admin, Finance, Agen, Jamaah)"}
          </p>
        </div>
        {!isReadOnlyRole && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="border-primary text-primary hover:bg-primary/5"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Link href="/admin/users/create">
            <Button className="bg-secondary hover:bg-secondary/90 text-primary font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </Link>
        </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
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

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
              <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {!isStaff && !isFinance && <SelectItem value="ADMIN">Admin</SelectItem>}
                {!isStaff && !isFinance && <SelectItem value="FINANCE">Finance</SelectItem>}
                {!isStaff && !isFinance && <SelectItem value="STAFF">Staff</SelectItem>}
                <SelectItem value="AGEN">Agen</SelectItem>
                <SelectItem value="JAMAAH">Jamaah</SelectItem>
                {!isStaff && !isFinance && <SelectItem value="CALON_JAMAAH">Calon Jamaah</SelectItem>}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {!isReadOnlyRole && selectedIds.length > 0 && (
        <Card className="bg-primary/5 border-primary/20 sticky top-20 z-10 shadow-lg animate-in slide-in-from-top-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary text-white">
                  {selectedIds.length} Terpilih
              </Badge>
              <p className="text-sm font-medium text-gray-700 hidden md:block">
                Pilih aksi untuk user-user ini
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, isActive: true })}
                disabled={bulkStatusMutation.isPending}
              >
                <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                Aktifkan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, isActive: false })}
                disabled={bulkStatusMutation.isPending}
              >
                <UserX className="h-4 w-4 mr-1 text-red-600" />
                Nonaktifkan
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Hapus semua user terpilih?")) {
                    bulkDeleteMutation.mutate(selectedIds);
                  }
                }}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Hapus
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>Total {displayedUsers.length} user terdaftar</CardDescription>
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
          ) : displayedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isReadOnlyRole && (
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.length === displayedUsers.length && displayedUsers.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </TableHead>
                    )}
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Didaftarkan Oleh</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers.map((user: any) => (
                    <TableRow
                      key={user.id}
                      className={`${selectedIds.includes(user.id) ? "bg-primary/5" : ""} hover:bg-gray-50/50 cursor-pointer group`}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      {!isReadOnlyRole && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {user.fullName?.charAt(0) || "U"}
                            </span>
                          </div>
                          {user.fullName}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleBadge(user.role)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.registeredBy ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{user.registeredBy.fullName}</span>
                            <span className="text-xs text-gray-500">
                              {user.registeredBy.role === "UNKNOWN"
                                ? "Role tidak diketahui"
                                : user.registeredBy.role}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 border-red-200"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "dd MMM yyyy", {
                            locale: localeId,
                          })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* ✅ LIHAT DETAIL */}
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/users/${user.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>

                            {!isReadOnlyRole && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/admin/users/${user.id}/edit`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleStatusMutation.mutate(user.id)
                                  }
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Nonaktifkan
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Aktifkan
                                    </>
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Delete Confirmation Dialog */}
      {!isReadOnlyRole && <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user{" "}
              <strong>{selectedUser?.fullName}</strong>? Tindakan ini tidak
              dapat dibatalkan.
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
      </Dialog>}
      {/* Import Users Dialog */}
      {!isReadOnlyRole && <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import User via Excel</DialogTitle>
            <DialogDescription>
              Gunakan fitur ini untuk menambah jamaah atau staff dalam jumlah banyak sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Info Format:</strong> Kolom wajib adalah `fullName`, `email`, dan `role`
                {isStaff ? " (AGEN, JAMAAH)." : " (ADMIN, FINANCE, STAFF, AGEN, JAMAAH, CALON_JAMAAH)."}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={downloadTemplate}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Unduh Template Excel (.xlsx)
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih File Excel</label>
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                disabled={isImporting}
              />
              {isImporting && (
                <div className="flex items-center gap-2 text-primary text-sm mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses data...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
