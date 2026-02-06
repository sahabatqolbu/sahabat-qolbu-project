// dashboard/src/app/(dashboard)/admin/staff/[id]/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "@/services/staffService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Mail,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const staffId = parseInt(params.id as string);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffService.getStaffById(staffId),
    enabled: !isNaN(staffId),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => staffService.toggleStaffStatus(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Berhasil",
        description: "Status staff berhasil diubah",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => staffService.deleteStaff(staffId),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Staff berhasil dihapus",
      });
      router.push("/admin/staff");
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => staffService.resetStaffPassword(staffId),
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Password berhasil direset dan dikirim ke email staff",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!staffData?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Staff tidak ditemukan</p>
        <Link href="/admin/staff">
          <Button variant="link">Kembali ke Daftar Staff</Button>
        </Link>
      </div>
    );
  }

  const staff = staffData.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/staff">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">{staff.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={staff.isActive ? "default" : "secondary"}
                className={
                  staff.isActive
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {staff.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
              <Badge variant="outline">{staff.role}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/staff/${staff.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setResetPasswordDialogOpen(true)}
          >
            <Key className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Informasi Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{staff.email}</p>
              {!staff.isEmailVerified && (
                <Badge variant="secondary" className="mt-1">
                  Belum Terverifikasi
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Telepon</p>
              <p className="font-medium">{staff.phone || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Status Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {staff.isActive ? (
                  <>
                    <UserCheck className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-700">Aktif</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Nonaktif</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Login Terakhir</p>
              <p className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {staff.lastLogin
                  ? format(new Date(staff.lastLogin), "dd MMMM yyyy HH:mm", {
                      locale: localeId,
                    })
                  : "Belum pernah login"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Waktu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Dibuat Pada</p>
              <p className="font-medium">
                {format(new Date(staff.createdAt), "dd MMMM yyyy HH:mm", {
                  locale: localeId,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
              <p className="font-medium">
                {format(new Date(staff.updatedAt), "dd MMMM yyyy HH:mm", {
                  locale: localeId,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : staff.isActive ? (
                <UserX className="w-4 h-4 mr-2" />
              ) : (
                <UserCheck className="w-4 h-4 mr-2" />
              )}
              {staff.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setResetPasswordDialogOpen(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Staff</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus staff <strong>{staff.fullName}</strong>?
              Tindakan ini tidak dapat dibatalkan.
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
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset password <strong>{staff.fullName}</strong>?
              Password baru akan dikirim ke email {staff.email}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
