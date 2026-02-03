// dashboard/src/app/(dashboard)/admin/packages/page.tsx
"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packageService, Package } from "@/services/packageService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl } from "@/lib/utils"; // ✅ HARUS ADA INI
import { PACKAGE_TYPE_LABELS, getTypeBadge } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Plane,
  Building2,
  Calendar,
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch Packages
  const { data, isLoading } = useQuery({
    queryKey: ["packages", { search, type: typeFilter, page }],
    queryFn: () =>
      packageService.getAll({
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const packages = data?.data?.packages || [];
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: packageService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setDeleteId(null);
      toast({ title: "✅ Paket Berhasil Dihapus" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menghapus",
        description: error.response?.data?.message,
      });
    },
  });

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: packageService.importExcel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({
        title: "✅ Import Berhasil",
        description: `${data.data.success} paket berhasil diimport`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Import Gagal",
        description: error.response?.data?.message,
      });
    },
  });

  // Handle Export
  const handleExport = async () => {
    try {
      await packageService.exportExcel();
      toast({ title: "✅ Export Berhasil" });
    } catch (error) {
      toast({ variant: "destructive", title: "❌ Export Gagal" });
    }
  };

  // Handle Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  // Format Currency
  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Type Badge
  const getTypeBadge = (type: string) => {
    const colors = {
      REGULER: "bg-blue-100 text-blue-800",
      VIP: "bg-purple-100 text-purple-800",
      VVIP: "bg-amber-100 text-amber-800 border border-amber-300",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "PLANNING":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Planning
          </Badge>
        );
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "PARTIAL":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "UNPAID":
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Days until departure badge
  const getDaysBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="secondary">Sudah Lewat</Badge>;
    } else if (days <= 14) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          H-{days}
        </Badge>
      );
    } else if (days <= 45) {
      return <Badge className="bg-yellow-100 text-yellow-800">H-{days}</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">H-{days}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Kelola Paket Umrah
          </h1>
          <p className="text-gray-600 mt-1">Manajemen paket perjalanan umrah</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/packages/create">
            <Button className="bg-secondary hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Paket
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Seat</p>
                <p className="text-3xl font-bold text-blue-900">
                  {summary?.totalSeats || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Seat Terisi
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {summary?.bookedSeats || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
            {summary && summary.totalSeats > 0 && (
              <Progress
                value={(summary.bookedSeats / summary.totalSeats) * 100}
                className="mt-3 h-2"
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Sisa Seat</p>
                <p className="text-3xl font-bold text-orange-900">
                  {summary?.remainingSeats || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kode atau nama paket..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="FULL_SERVICE">Full Service</SelectItem>
                <SelectItem value="EXTREME">Extreme</SelectItem>
                <SelectItem value="SEMI_MANDIRI">Semi Mandiri</SelectItem>
                <SelectItem value="FLEKSIBILITAS">Fleksibilitas</SelectItem>
                <SelectItem value="KONSORSIUM">Konsorsium</SelectItem>
                <SelectItem value="LA">Land Arrangement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Paket</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada paket</p>
              <Link href="/admin/packages/create">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Paket Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead>Maskapai</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>H-</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg: Package) => (
                      <TableRow key={pkg.id}>
                        {/* ID & Images */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">
                              #{pkg.id}
                            </span>
                            {pkg.images && pkg.images.length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                      <img
                                        src={getImageUrl(
                                          pkg.images[0].imageUrl
                                        )} // ✅ TAMBAHIN getImageUrl()
                                        alt={pkg.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // ✅ FALLBACK kalo image error
                                          e.currentTarget.src =
                                            "https://via.placeholder.com/40?text=No+Img";
                                        }}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {pkg.images.length} gambar
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Nama Paket */}
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{pkg.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 font-mono">
                                {pkg.code}
                              </span>
                              <Badge className={getTypeBadge(pkg.type)}>
                                {PACKAGE_TYPE_LABELS[pkg.type] || pkg.type}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Jadwal */}
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {format(
                                new Date(pkg.departureDate),
                                "dd MMM yyyy",
                                { locale: localeId }
                              )}
                            </p>
                            <p className="text-gray-500">
                              s/d{" "}
                              {format(new Date(pkg.returnDate), "dd MMM yyyy", {
                                locale: localeId,
                              })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {pkg.duration} Hari
                            </p>
                          </div>
                        </TableCell>

                        {/* Harga */}
                        <TableCell>
                          <div>
                            {pkg.discountPrice && (
                              <p className="text-xs text-gray-400 line-through">
                                {formatCurrency(pkg.price)}
                              </p>
                            )}
                            <p className="font-medium text-green-600">
                              {formatCurrency(pkg.discountPrice || pkg.price)}
                            </p>
                          </div>
                        </TableCell>

                        {/* Seat */}
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {pkg.bookedSeats || 0}/{pkg.totalSeats}
                            </p>
                            <Progress
                              value={
                                ((pkg.bookedSeats || 0) / pkg.totalSeats) * 100
                              }
                              className="w-16 h-1.5 mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Sisa: {pkg.remainingSeats || pkg.totalSeats}
                            </p>
                          </div>
                        </TableCell>

                        {/* Maskapai */}
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Plane className="h-3 w-3 text-gray-400" />
                              <span>{pkg.airline?.name || "-"}</span>
                            </div>
                            {pkg.airline && (
                              <>
                                {getStatusBadge(pkg.airlineStatus || "PLANNING")}
                                <p className="text-xs text-gray-500 mt-1">
                                  {getStatusBadge(
                                    pkg.airlinePaymentStatus || "UNPAID"
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>

                        {/* Hotel */}
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {pkg.hotelMakkah && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[100px]">
                                  {pkg.hotelMakkah.name}
                                </span>
                                {getStatusBadge(
                                  pkg.hotelMakkahStatus || "PLANNING"
                                )}
                              </div>
                            )}
                            {pkg.hotelMadinah && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[100px]">
                                  {pkg.hotelMadinah.name}
                                </span>
                                {getStatusBadge(
                                  pkg.hotelMadinahStatus || "PLANNING"
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* H- */}
                        <TableCell>
                          {getDaysBadge(pkg.daysUntilDeparture || 0)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {pkg.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Nonaktif</Badge>
                          )}
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
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Link href={`/admin/packages/${pkg.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/admin/packages/${pkg.id}/edit`}>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Paket
                                </DropdownMenuItem>
                              </Link>
                              <Link
                                href={`/admin/packages/${pkg.id}/itinerary`}
                              >
                                <DropdownMenuItem>
                                  <CalendarDays className="mr-2 h-4 w-4" />
                                  Lihat Itinerary
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(pkg.id)}
                                className="text-red-600"
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

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Menampilkan {packages.length} dari {pagination.total} paket
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Paket akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
