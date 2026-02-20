// dashboard/src/app/(dashboard)/admin/jamaah/page.tsx
"use client";

import { ComponentType, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jamaahService, JamaahListItem } from "@/services/jamaahService";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Loader2,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Filter,
  X,
  CalendarIcon,
  SlidersHorizontal,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  FileUp,
  FileDown,
} from "lucide-react";
import * as XLSX from "xlsx";

interface JamaahProfileFields extends JamaahListItem {
  birthDate?: string | null;
  birthPlace?: string | null;
  maritalStatus?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssuePlace?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  roomTypeMakkah?: string | null;
  roomTypeMadinah?: string | null;
  agenId?: number | null;
  agenName?: string | null;
}

interface PackageFilterOption {
  id: number;
  name: string;
}

interface AgentFilterOption {
  id: number;
  fullName: string;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan";
  }

  const payload = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || payload.message || "Terjadi kesalahan";
};

export default function JamaahPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isReadOnlyRole = user?.role !== "ADMIN";
  const roleBasePath =
    user?.role === "FINANCE" ? "/finance" : user?.role === "STAFF" ? "/staff" : "/admin";
  const jamaahBasePath = `${roleBasePath}/jamaah`;

  // ===== FILTER STATES =====
  const [search, setSearch] = useState("");
  const [statusPaymentFilter, setStatusPaymentFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [agenFilter, setAgenFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ✅ DELETE STATE
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    jamaah: JamaahListItem | null;
  }>({ open: false, jamaah: null });

  // ✅ IMPORT STATE
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ===== HELPER: Check Profile Complete (SAMAKAN dengan Agen) =====
  const checkProfileComplete = (j: JamaahListItem) => {
    const data = j as JamaahProfileFields;

    const requiredFields = [
      data.namaPaspor,
      data.nik,
      data.birthDate,
      data.birthPlace,
      data.gender,
      data.maritalStatus,
      data.address,
      data.province,
      data.city,
      data.passportNumber,
      data.passportExpiry,
      data.passportIssuePlace,
      data.emergencyName,
      data.emergencyPhone,
      data.packageId,
      data.roomTypeMakkah,
      data.roomTypeMadinah,
    ];

    const requiredDocs = [
      j.hasDocuments?.foto,
      j.hasDocuments?.ktp,
      j.hasDocuments?.kk,
      j.hasDocuments?.paspor,
    ];

    const allFields = [...requiredFields, ...requiredDocs];
    const filled = allFields.filter(
      (val) => val && val !== "" && val !== null,
    ).length;
    const total = allFields.length;
    const percentage = Math.round((filled / total) * 100);

    return percentage >= 80; // Threshold 80% sama dengan Agen
  };

  // ===== FETCH JAMAAH =====
  const {
    data: jamaahResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["jamaah-list"],
    queryFn: () => jamaahService.getAll({}),
    staleTime: 30000,
  });

  // ===== FETCH PACKAGES =====
  const { data: packagesResponse } = useQuery({
    queryKey: ["packages-filter"],
    queryFn: async () => {
      const response = await api.get("/packages");
      return response.data;
    },
  });

  const packages: PackageFilterOption[] = Array.isArray(packagesResponse?.data?.packages)
    ? (packagesResponse.data.packages as PackageFilterOption[])
    : [];

  // ===== FETCH AGENTS =====
  const { data: agentsResponse } = useQuery({
    queryKey: ["agents-filter"],
    queryFn: async () => {
      const response = await api.get("/admin/users?role=AGEN");
      return response.data;
    },
  });

  const agents: AgentFilterOption[] = Array.isArray(agentsResponse?.data)
    ? (agentsResponse.data as AgentFilterOption[])
    : [];

  // ✅ DELETE MUTATION
  const deleteMutation = useMutation({
    mutationFn: (bookingNumber: string) => jamaahService.delete(bookingNumber),
    onSuccess: () => {
      toast({
        title: "✅ Berhasil Dihapus",
        description: "Data jamaah berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setDeleteDialog({ open: false, jamaah: null });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menghapus",
        description: getErrorMessage(error),
      });
    },
  });

  // ===== BULK IMPORT LOGIC =====
  const downloadTemplate = () => {
    const templateData = [
      {
        fullName: "Nama Lengkap Jamaah",
        email: "jamaah@example.com",
        phone: "08123456789",
        role: "JAMAAH",
        packageId: "ID_PAKET",
        nik: "1234567890123456",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Jamaah");
    XLSX.writeFile(workbook, "Template_Import_Jamaah.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast({ variant: "destructive", title: "File Kosong", description: "Tidak ada data ditemukan" });
          return;
        }

        const response = await adminService.users.importUsers(data);

        if (response.success) {
          toast({
            title: "✅ Import Selesai",
            description: `Berhasil: ${response.data.success}, Gagal: ${response.data.failed}`,
          });
          queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
          setImportDialogOpen(false);
        }
      } catch (error: unknown) {
        toast({
          variant: "destructive",
          title: "❌ Gagal Import",
          description: getErrorMessage(error),
        });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // ===== CLIENT-SIDE FILTERING =====
  const jamaahList: JamaahListItem[] = useMemo(() => {
    let list = jamaahResponse?.data || [];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      list = list.filter((j: JamaahListItem) => {
        const nama = (j.namaPaspor || j.fullName || "").toLowerCase();
        const booking = (j.bookingNumber || "").toLowerCase();
        const email = (j.email || "").toLowerCase();
        const phone = (j.phone || "").toLowerCase();
        const nik = (j.nik || "").toLowerCase();
        const mitra = (j.namaMitra || "").toLowerCase();
        return (
          nama.includes(searchLower) ||
          booking.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          nik.includes(searchLower) ||
          mitra.includes(searchLower)
        );
      });
    }

    // Status Payment filter
    if (statusPaymentFilter !== "all") {
      list = list.filter(
        (j: JamaahListItem) => j.statusPayment === statusPaymentFilter,
      );
    }

    // Registration Status filter
    if (registrationFilter !== "all") {
      list = list.filter(
        (j: JamaahListItem) => j.registrationStatus === registrationFilter,
      );
    }

    // Profile Completeness filter
    if (profileFilter !== "all") {
      list = list.filter((j: JamaahListItem) => {
        const isComplete = checkProfileComplete(j);
        return profileFilter === "lengkap" ? isComplete : !isComplete;
      });
    }

    // Package filter
    if (packageFilter !== "all") {
      list = list.filter(
        (j: JamaahListItem) =>
          (j as JamaahProfileFields).packageId?.toString() === packageFilter,
      );
    }

    // Agen filter
    if (agenFilter !== "all") {
      list = list.filter(
        (j: JamaahListItem) =>
          (j as JamaahProfileFields).agenId?.toString() === agenFilter,
      );
    }

    // Date range filter
    if (dateFrom) {
      list = list.filter((j: JamaahListItem) => {
        const bookingDate = new Date(j.dateOfBooking);
        return bookingDate >= dateFrom;
      });
    }
    if (dateTo) {
      list = list.filter((j: JamaahListItem) => {
        const bookingDate = new Date(j.dateOfBooking);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        return bookingDate <= endDate;
      });
    }

    return list;
  }, [
    jamaahResponse?.data,
    search,
    statusPaymentFilter,
    registrationFilter,
    profileFilter,
    packageFilter,
    agenFilter,
    dateFrom,
    dateTo,
  ]);

  // ===== COMPUTED STATS =====
  const stats = useMemo(() => {
    const total = jamaahList.length;
    const lunas = jamaahList.filter((j) => j.statusPayment === "LUNAS").length;
    const cicilan = jamaahList.filter(
      (j) => j.statusPayment === "CICILAN",
    ).length;
    const belumBayar = jamaahList.filter(
      (j) => j.statusPayment === "BELUM_BAYAR",
    ).length;
    const totalOutstanding = jamaahList.reduce(
      (sum, j) => sum + (parseFloat(j.outstanding) || 0),
      0,
    );
    const profileComplete = jamaahList.filter((j) =>
      checkProfileComplete(j),
    ).length;

    return {
      total,
      lunas,
      cicilan,
      belumBayar,
      totalOutstanding,
      profileComplete,
    };
  }, [jamaahList]);

  // ===== COUNT ACTIVE FILTERS =====
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusPaymentFilter !== "all") count++;
    if (registrationFilter !== "all") count++;
    if (profileFilter !== "all") count++;
    if (packageFilter !== "all") count++;
    if (agenFilter !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [
    statusPaymentFilter,
    registrationFilter,
    profileFilter,
    packageFilter,
    agenFilter,
    dateFrom,
    dateTo,
  ]);

  // ===== CLEAR ALL FILTERS =====
  const clearAllFilters = () => {
    setSearch("");
    setStatusPaymentFilter("all");
    setRegistrationFilter("all");
    setProfileFilter("all");
    setPackageFilter("all");
    setAgenFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // ===== FORMAT HELPERS =====
  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===== BADGE HELPERS =====
  const getPaymentBadge = (status: string) => {
    const config: Record<
      string,
      { class: string; label: string; icon: ComponentType<{ className?: string }> }
    > = {
      LUNAS: {
        class: "bg-green-100 text-green-800 border-green-200",
        label: "Lunas",
        icon: CheckCircle,
      },
      CICILAN: {
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Cicilan",
        icon: Clock,
      },
      BELUM_BAYAR: {
        class: "bg-red-100 text-red-800 border-red-200",
        label: "Belum Bayar",
        icon: XCircle,
      },
    };
    const cfg = config[status] || config.BELUM_BAYAR;
    const Icon = cfg.icon;
    return (
      <Badge
        variant="outline"
        className={`${cfg.class} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  const getProfileStatus = (jamaah: JamaahListItem) => {
    const isComplete = checkProfileComplete(jamaah);
    const docs = jamaah.hasDocuments || {};
    const docCount = Object.values(docs).filter(Boolean).length;
    const totalDocs = Object.keys(docs).length;

    if (isComplete) {
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Lengkap</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Belum Lengkap</span>
        </div>
        <span className="text-[10px] text-gray-400">
          Dok: {docCount}/{totalDocs}
        </span>
      </div>
    );
  };

  // ✅ TAMBAHKAN INI
  const getRegistrationBadge = (jamaah: JamaahListItem) => {
    const status = jamaah.registrationStatus;

    // Cek jika profil belum diisi (DRAFT tanpa data penting)
    if (status === "DRAFT" && !jamaah.namaPaspor && !jamaah.nik) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-600 border-gray-300"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Profil Belum Diisi
        </Badge>
      );
    }

    const config: Record<
      string,
      { class: string; label: string; icon: ComponentType<{ className?: string }> }
    > = {
      DRAFT: {
        class: "bg-gray-100 text-gray-600 border-gray-300",
        label: "Draft",
        icon: FileText,
      },
      PENDING_DOCUMENT: {
        class: "bg-blue-100 text-blue-700 border-blue-300",
        label: "Pending Dokumen",
        icon: FileText,
      },
      PENDING_PAYMENT: {
        class: "bg-orange-100 text-orange-700 border-orange-300",
        label: "Pending Bayar",
        icon: Clock,
      },
      VERIFIED: {
        class: "bg-cyan-100 text-cyan-700 border-cyan-300",
        label: "Verified",
        icon: CheckCircle,
      },
      APPROVED: {
        class: "bg-green-100 text-green-700 border-green-300",
        label: "Approved",
        icon: CheckCircle,
      },
      REJECTED: {
        class: "bg-red-100 text-red-700 border-red-300",
        label: "Rejected",
        icon: XCircle,
      },
    };

    const cfg = config[status] || config.DRAFT;
    const Icon = cfg.icon;

    return (
      <Badge
        variant="outline"
        className={`${cfg.class} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  // ✅ HANDLE DELETE
  const handleDelete = (jamaah: JamaahListItem) => {
    setDeleteDialog({ open: true, jamaah });
  };

  const confirmDelete = () => {
    if (deleteDialog.jamaah) {
      deleteMutation.mutate(deleteDialog.jamaah.bookingNumber);
    }
  };

  return (
    <div className="space-y-6">
      {/* ✅ DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, jamaah: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Hapus Data Jamaah?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Anda akan menghapus data jamaah berikut:</p>
              {deleteDialog.jamaah && (
                <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking:</span>
                    <span className="font-mono font-bold text-primary">
                      {deleteDialog.jamaah.bookingNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nama:</span>
                    <span className="font-medium">
                      {deleteDialog.jamaah.namaPaspor ||
                        deleteDialog.jamaah.fullName ||
                        "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{deleteDialog.jamaah.email}</span>
                  </div>
                  {deleteDialog.jamaah.packageName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paket:</span>
                      <span>{deleteDialog.jamaah.packageName}</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-red-600 font-medium text-sm">
                ⚠️ Tindakan ini tidak dapat dibatalkan! Data pembayaran terkait
                juga akan dihapus.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Data Jamaah
          </h1>
          <p className="text-gray-600 mt-1">Kelola data jamaah & pembayaran</p>
        </div>
        {!isReadOnlyRole && <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button
            className="bg-secondary hover:bg-secondary/90 text-primary font-medium"
            size="sm"
            onClick={() => router.push(`${roleBasePath}/users/create`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jamaah
          </Button>
        </div>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => clearAllFilters()}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            clearAllFilters();
            setStatusPaymentFilter("LUNAS");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lunas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{stats.lunas}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            clearAllFilters();
            setStatusPaymentFilter("CICILAN");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cicilan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{stats.cicilan}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            clearAllFilters();
            setStatusPaymentFilter("BELUM_BAYAR");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Belum Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{stats.belumBayar}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="col-span-2 md:col-span-1 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            clearAllFilters();
            setProfileFilter("lengkap");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profil Lengkap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-cyan-600" />
              <p className="text-2xl font-bold text-cyan-600">{stats.profileComplete}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Alert */}
      {stats.totalOutstanding > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  Total Outstanding
                </p>
                <p className="text-xl font-bold text-red-600">
                  {formatRupiah(stats.totalOutstanding)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => {
                clearAllFilters();
                setStatusPaymentFilter("BELUM_BAYAR");
              }}
            >
              Lihat Detail
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ===== FILTERS SECTION ===== */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Primary Filters Row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, email, HP, booking, NIK, mitra..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Bayar */}
            <Select
              value={statusPaymentFilter}
              onValueChange={setStatusPaymentFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status Bayar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status Bayar</SelectItem>
                <SelectItem value="LUNAS">✅ Lunas</SelectItem>
                <SelectItem value="CICILAN">⏳ Cicilan</SelectItem>
                <SelectItem value="BELUM_BAYAR">❌ Belum Bayar</SelectItem>
              </SelectContent>
            </Select>

            {/* Profile Status */}
            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status Profil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Profil</SelectItem>
                <SelectItem value="lengkap">✅ Lengkap</SelectItem>
                <SelectItem value="belum">⚠️ Belum Lengkap</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle Advanced Filters */}
            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Filter Lanjutan
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reset Filter
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Paket Filter */}
                <Select value={packageFilter} onValueChange={setPackageFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Paket</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id.toString()}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Agen Filter */}
                <Select value={agenFilter} onValueChange={setAgenFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Agen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Agen</SelectItem>
                    {agents.map((agen) => (
                      <SelectItem key={agen.id} value={agen.id.toString()}>
                        {agen.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-start text-left font-normal ${!dateFrom && "text-muted-foreground"
                        }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom
                        ? format(dateFrom, "dd MMM yyyy", { locale: id })
                        : "Dari Tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                    {dateFrom && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setDateFrom(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-start text-left font-normal ${!dateTo && "text-muted-foreground"
                        }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo
                        ? format(dateTo, "dd MMM yyyy", { locale: id })
                        : "Sampai Tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                    {dateTo && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setDateTo(undefined)}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Registration Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={registrationFilter}
                  onValueChange={setRegistrationFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status Registrasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Registrasi</SelectItem>
                    <SelectItem value="DRAFT">📝 Draft</SelectItem>
                    <SelectItem value="PENDING_DOCUMENT">
                      📄 Pending Dokumen
                    </SelectItem>
                    <SelectItem value="PENDING_PAYMENT">
                      💳 Pending Bayar
                    </SelectItem>
                    <SelectItem value="VERIFIED">✅ Verified</SelectItem>
                    <SelectItem value="APPROVED">🎉 Approved</SelectItem>
                    <SelectItem value="REJECTED">❌ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {statusPaymentFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setStatusPaymentFilter("all")}
                >
                  Status: {statusPaymentFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {profileFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setProfileFilter("all")}
                >
                  Profil: {profileFilter === "lengkap" ? "Lengkap" : "Belum"}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {packageFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setPackageFilter("all")}
                >
                  Paket:{" "}
                  {packages.find((p) => p.id.toString() === packageFilter)
                    ?.name || packageFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {agenFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setAgenFilter("all")}
                >
                  Agen:{" "}
                  {agents.find((a) => a.id.toString() === agenFilter)
                    ?.fullName || agenFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {registrationFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setRegistrationFilter("all")}
                >
                  Registrasi: {registrationFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {dateFrom && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setDateFrom(undefined)}
                >
                  Dari: {format(dateFrom, "dd/MM/yy")}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {dateTo && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setDateTo(undefined)}
                >
                  Sampai: {format(dateTo, "dd/MM/yy")}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Jamaah</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Memuat data..."
                  : `Menampilkan ${jamaahList.length} jamaah${activeFilterCount > 0
                    ? ` (difilter dari ${jamaahResponse?.data?.length || 0
                    })`
                    : ""
                  }`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-28 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Gagal memuat data</p>
              <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                {getErrorMessage(error) || "Terjadi kesalahan saat mengambil data"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          ) : jamaahList.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">
                {activeFilterCount > 0
                  ? "Tidak ada data yang cocok dengan filter"
                  : "Tidak ada data jamaah"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {activeFilterCount > 0
                  ? "Coba ubah atau reset filter"
                  : "Tambahkan jamaah baru untuk memulai"}
              </p>
              {activeFilterCount > 0 ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
              ) : isReadOnlyRole ? null : (
                <Button
                  className="mt-6 bg-secondary text-primary hover:bg-secondary/90"
                  onClick={() => router.push(`${roleBasePath}/users/create`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Jamaah Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Booking</TableHead>
                    <TableHead className="font-semibold">Jamaah</TableHead>
                    <TableHead className="font-semibold">Paket</TableHead>
                    <TableHead className="font-semibold">Mitra/Agen</TableHead>
                    <TableHead className="font-semibold">
                      Status Bayar
                    </TableHead>
                    {/* ✅ TAMBAHKAN KOLOM INI */}
                    <TableHead className="font-semibold">
                      Status Registrasi
                    </TableHead>{" "}
                    <TableHead className="font-semibold text-right">
                      Outstanding
                    </TableHead>
                    <TableHead className="font-semibold">Profil</TableHead>
                    <TableHead className="font-semibold text-center">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jamaahList.map((jamaah) => (
                    <TableRow
                      key={jamaah.id}
                      className="hover:bg-gray-50/50 cursor-pointer group"
                      onClick={() =>
                        router.push(`${jamaahBasePath}/${jamaah.bookingNumber}`)
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="font-mono font-bold text-primary text-sm group-hover:underline">
                            {jamaah.bookingNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(jamaah.dateOfBooking)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {jamaah.namaPaspor || jamaah.fullName || "-"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">
                                {jamaah.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1.5">
                          <p
                            className="font-medium text-sm text-gray-900 max-w-[160px] truncate"
                            title={jamaah.packageName}
                          >
                            {jamaah.packageName || "-"}
                          </p>
                          {jamaah.packageType && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium ${jamaah.packageType === "FULL_SERVICE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : jamaah.packageType === "EXTREME"
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : jamaah.packageType === "SEMI_MANDIRI"
                                    ? "bg-blue-50 text-blue-700 border-blue-300"
                                    : jamaah.packageType === "FLEKSIBILITAS"
                                      ? "bg-purple-50 text-purple-700 border-purple-300"
                                      : jamaah.packageType === "KONSORSIUM"
                                        ? "bg-orange-50 text-orange-700 border-orange-300"
                                        : jamaah.packageType === "LA"
                                          ? "bg-cyan-50 text-cyan-700 border-cyan-300"
                                          : "bg-gray-50 text-gray-700 border-gray-300"
                                }`}
                            >
                              {jamaah.packageType === "FULL_SERVICE"
                                ? "Full Service"
                                : jamaah.packageType === "SEMI_MANDIRI"
                                  ? "Semi Mandiri"
                                  : jamaah.packageType === "LA"
                                    ? "Land Arr."
                                    : jamaah.packageType.charAt(0) +
                                    jamaah.packageType.slice(1).toLowerCase()}
                            </Badge>
                          )}
                          {jamaah.departureDate && (
                            <p className="text-xs text-gray-400">
                              {formatDate(jamaah.departureDate)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-700">
                            {jamaah.namaMitra || "-"}
                          </p>
                          {(jamaah as JamaahProfileFields).agenName && (
                            <p className="text-xs text-gray-400">
                              Agen: {(jamaah as JamaahProfileFields).agenName}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getPaymentBadge(jamaah.statusPayment)}
                      </TableCell>

                      {/* ✅ TAMBAHKAN CELL INI */}
                      <TableCell>{getRegistrationBadge(jamaah)}</TableCell>

                      <TableCell className="text-right">
                        <span
                          className={`font-bold ${parseFloat(jamaah.outstanding) > 0
                            ? "text-red-600"
                            : "text-green-600"
                            }`}
                        >
                          {formatRupiah(jamaah.outstanding)}
                        </span>
                      </TableCell>

                      <TableCell>{getProfileStatus(jamaah)}</TableCell>

                      {/* ✅ UPDATED ACTION COLUMN WITH DROPDOWN */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `${jamaahBasePath}/${jamaah.bookingNumber}`,
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              {!isReadOnlyRole && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `${jamaahBasePath}/${jamaah.bookingNumber}/edit`,
                                      )
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Data
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(jamaah)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Jamaah Dialog */}
      {!isReadOnlyRole && (
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Jamaah via Excel</DialogTitle>
              <DialogDescription>
                Tambah banyak jamaah sekaligus. Jamaah akan otomatis dibuatkan akun dan mendapatkan email kredensial.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Info Format:</strong> Pastikan kolom `fullName`, `email`, dan `role` (JAMAAH) terisi. Kolom `packageId` opsional tapi disarankan.
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
        </Dialog>
      )}
    </div>
  );
}
