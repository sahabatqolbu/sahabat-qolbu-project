"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assetService,
  type Asset,
  type AssetPayload,
  type AssetStatus,
  type AssetType,
} from "@/services/assetService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

const assetStatuses: AssetStatus[] = [
  "AVAILABLE",
  "ASSIGNED",
  "MAINTENANCE",
  "RETIRED",
  "LOST",
];
const assetTypes: AssetType[] = ["DEVICE", "ACCOUNT"];

const emptyAssetForm: AssetPayload = {
  name: "",
  type: "DEVICE",
  category: "",
  assetCode: "",
  status: "AVAILABLE",
  brand: "",
  model: "",
  serialNumber: "",
  identifier: "",
  location: "",
  condition: "",
  notes: "",
  platform: "",
  accountUsername: "",
  recoveryContact: "",
  accountPic: "",
  accountNotes: "",
};

const statusLabels: Record<AssetStatus, string> = {
  AVAILABLE: "Tersedia",
  ASSIGNED: "Dipinjam",
  MAINTENANCE: "Maintenance",
  RETIRED: "Nonaktif",
  LOST: "Hilang",
};

const typeLabels: Record<AssetType, string> = {
  DEVICE: "Device",
  ACCOUNT: "Akun",
};

const statusClass = (status: AssetStatus) => {
  const classes: Record<AssetStatus, string> = {
    AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
    MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-700",
    RETIRED: "border-slate-200 bg-slate-100 text-slate-600",
    LOST: "border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
};

const today = () => new Date().toISOString().slice(0, 10);
const fieldInputClass = "h-10 border-slate-300 bg-white";

const toAssetForm = (asset: Asset): AssetPayload => ({
  name: asset.name,
  type: asset.type,
  category: asset.category,
  assetCode: asset.assetCode,
  status: asset.status,
  brand: asset.brand || "",
  model: asset.model || "",
  serialNumber: asset.serialNumber || "",
  identifier: asset.identifier || "",
  location: asset.location || "",
  condition: asset.condition || "",
  notes: asset.notes || "",
  platform: asset.platform || "",
  accountUsername: asset.accountUsername || "",
  recoveryContact: asset.recoveryContact || "",
  accountPic: asset.accountPic || "",
  accountNotes: asset.accountNotes || "",
});

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 md:grid-cols-[180px_1fr] md:items-center">
      <div>
        <Label className="text-sm font-semibold text-slate-800">{label}</Label>
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AssetManagementPage() {
  const { user } = useAuthStore();
  const readOnly = user?.role !== "ADMIN";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<AssetPayload>(emptyAssetForm);
  const [assignForm, setAssignForm] = useState({
    holderUserId: "",
    assignedAt: today(),
    initialCondition: "",
    purpose: "",
    notes: "",
    expectedReturnAt: "",
  });
  const [returnForm, setReturnForm] = useState({
    returnedAt: today(),
    returnCondition: "",
    returnNotes: "",
    nextStatus: "AVAILABLE" as Exclude<AssetStatus, "ASSIGNED">,
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit: 50,
      search,
      type: typeFilter === "all" ? undefined : typeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [page, search, typeFilter, statusFilter],
  );

  const { data: assetData, isLoading } = useQuery({
    queryKey: ["assets", queryParams],
    queryFn: () => assetService.getAssets(queryParams),
  });

  const { data: holderData } = useQuery({
    queryKey: ["asset-holders"],
    queryFn: () => assetService.getHolders(),
    enabled: !readOnly,
  });

  const { data: assetDetailData } = useQuery({
    queryKey: ["asset-detail", selectedAsset?.id],
    queryFn: () => assetService.getAsset(selectedAsset!.id),
    enabled: documentDialogOpen && Boolean(selectedAsset?.id),
  });

  const assets = assetData?.data || [];
  const documents =
    assetDetailData?.data.documents || selectedAsset?.documents || [];
  const pageStats = useMemo(
    () =>
      assetStatuses.map((status) => ({
        status,
        total: assets.filter((asset) => asset.status === status).length,
      })),
    [assets],
  );

  const invalidateAssets = () =>
    queryClient.invalidateQueries({ queryKey: ["assets"] });

  const createMutation = useMutation({
    mutationFn: (payload: AssetPayload) => assetService.createAsset(payload),
    onSuccess: () => {
      invalidateAssets();
      setAssetDialogOpen(false);
      toast({ title: "Berhasil", description: "Aset berhasil dibuat" });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal disimpan",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssetPayload }) =>
      assetService.updateAsset(id, payload),
    onSuccess: () => {
      invalidateAssets();
      setAssetDialogOpen(false);
      toast({ title: "Berhasil", description: "Aset berhasil diperbarui" });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal diperbarui",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetService.deleteAsset(id),
    onSuccess: () => {
      invalidateAssets();
      toast({ title: "Berhasil", description: "Aset berhasil dihapus" });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal dihapus",
        variant: "destructive",
      }),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assetService.assignAsset(selectedAsset!.id, {
        holderUserId: Number(assignForm.holderUserId),
        assignedAt: assignForm.assignedAt,
        initialCondition: assignForm.initialCondition,
        purpose: assignForm.purpose,
        notes: assignForm.notes || undefined,
        expectedReturnAt: assignForm.expectedReturnAt || undefined,
      }),
    onSuccess: () => {
      invalidateAssets();
      setAssignDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Serah terima aset dibuat dan PDF digenerate",
      });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Serah terima gagal",
        variant: "destructive",
      }),
  });

  const returnMutation = useMutation({
    mutationFn: () => assetService.returnAsset(selectedAsset!.id, returnForm),
    onSuccess: () => {
      invalidateAssets();
      setReturnDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Pengembalian aset diproses dan PDF digenerate",
      });
    },
    onError: (error: any) =>
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Pengembalian gagal",
        variant: "destructive",
      }),
  });

  const openCreate = () => {
    setSelectedAsset(null);
    setAssetForm({ ...emptyAssetForm });
    setAssetDialogOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetForm(toAssetForm(asset));
    setAssetDialogOpen(true);
  };

  const openAssign = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssignForm({
      holderUserId: "",
      assignedAt: today(),
      initialCondition: asset.condition || "Baik",
      purpose: "Operasional kerja",
      notes: "",
      expectedReturnAt: "",
    });
    setAssignDialogOpen(true);
  };

  const openReturn = (asset: Asset) => {
    setSelectedAsset(asset);
    setReturnForm({
      returnedAt: today(),
      returnCondition: asset.condition || "Baik",
      returnNotes: "",
      nextStatus: "AVAILABLE",
    });
    setReturnDialogOpen(true);
  };

  const saveAsset = () => {
    if (selectedAsset)
      updateMutation.mutate({ id: selectedAsset.id, payload: assetForm });
    else createMutation.mutate(assetForm);
  };

  const isSavingAsset = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-4 bg-slate-50/60 p-0 md:-m-2 md:p-2">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
              Dashboard Manajemen Aset
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pencatatan device, akun digital, pemegang aset, dan dokumen serah
              terima internal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-md border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-700"
            >
              Total: {assetData?.pagination.total || 0}
            </Badge>
            {!readOnly && (
              <Button
                onClick={openCreate}
                className="bg-slate-950 text-white hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Aset
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 px-4 py-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari kode, nama aset, serial, username, kategori..."
                className="h-10 border-slate-300 bg-white pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 border-slate-300 bg-white md:w-40">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tipe</SelectItem>
                {assetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 border-slate-300 bg-white md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {assetStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageStats.map(({ status, total }) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === status ? "all" : status);
                  setPage(1);
                }}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${statusFilter === status ? statusClass(status) : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
              >
                {statusLabels[status]}: {total}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1380px] border-collapse text-sm">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className="border-slate-300 hover:bg-slate-100">
                {[
                  "Kode",
                  "Nama Aset",
                  "Tipe",
                  "Kategori",
                  "Brand/Platform",
                  "Serial/Username",
                  "Lokasi",
                  "Status",
                  "Pemegang",
                  "Estimasi Kembali",
                  "Kondisi",
                  "Catatan",
                ].map((head) => (
                  <TableHead
                    key={head}
                    className="border-r border-slate-200 font-bold text-slate-700"
                  >
                    {head}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 w-[210px] bg-slate-100 text-right font-bold text-slate-700 shadow-[-8px_0_12px_rgba(15,23,42,0.05)]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {" "}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-40 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-3 text-sm text-slate-500">
                      Memuat data aset...
                    </p>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="h-40 text-center text-slate-500"
                  >
                    Belum ada data aset yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="group border-slate-200 odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/50"
                  >
                    <TableCell className="border-r border-slate-100 font-mono text-xs font-semibold text-slate-800">
                      {asset.assetCode}
                    </TableCell>
                    <TableCell className="border-r border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEdit(asset)}
                        className="text-left font-semibold text-slate-950 hover:text-blue-700"
                        disabled={readOnly}
                      >
                        {asset.name}
                      </button>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {asset.model || asset.accountPic || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-slate-100">
                      <Badge
                        variant="outline"
                        className="rounded-md border-slate-300 bg-white text-slate-700"
                      >
                        {typeLabels[asset.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r border-slate-100 text-slate-700">
                      {asset.category}
                    </TableCell>
                    <TableCell className="border-r border-slate-100 text-slate-700">
                      {asset.type === "DEVICE"
                        ? asset.brand || "-"
                        : asset.platform || "-"}
                    </TableCell>
                    <TableCell className="border-r border-slate-100 font-mono text-xs text-slate-700">
                      {asset.serialNumber ||
                        asset.identifier ||
                        asset.accountUsername ||
                        "-"}
                    </TableCell>
                    <TableCell className="border-r border-slate-100 text-slate-700">
                      {asset.location || "-"}
                    </TableCell>
                    <TableCell className="border-r border-slate-100">
                      <Badge
                        variant="outline"
                        className={`rounded-md ${statusClass(asset.status)}`}
                      >
                        {statusLabels[asset.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r border-slate-100">
                      {asset.activeAssignment?.holder ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {asset.activeAssignment.holder.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {asset.activeAssignment.holder.role}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Belum dipegang</span>
                      )}
                    </TableCell>
                    <TableCell className="border-r border-slate-100 text-slate-700">
                      {asset.activeAssignment?.expectedReturnAt || "-"}
                    </TableCell>
                    <TableCell className="border-r border-slate-100 text-slate-700">
                      {asset.condition || "-"}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate border-r border-slate-100 text-slate-600">
                      {asset.notes || asset.accountNotes || "-"}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-inherit text-right shadow-[-8px_0_12px_rgba(15,23,42,0.04)] group-hover:bg-blue-50/50">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-300 px-2"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setDocumentDialogOpen(true);
                          }}
                          title="Dokumen"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-slate-300 px-2"
                              onClick={() => openEdit(asset)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {asset.status === "AVAILABLE" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-slate-300 px-2"
                                onClick={() => openAssign(asset)}
                                title="Serah terima"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {asset.status === "ASSIGNED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-slate-300 px-2"
                                onClick={() => openReturn(asset)}
                                title="Pengembalian"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-2"
                              disabled={
                                asset.status === "ASSIGNED" ||
                                deleteMutation.isPending
                              }
                              onClick={() => deleteMutation.mutate(asset.id)}
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            Menampilkan {assets.length} dari {assetData?.pagination.total || 0}{" "}
            aset. Limit 50 baris per halaman.
          </div>
          {assetData?.pagination && assetData.pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Sebelumnya
              </Button>
              <span className="min-w-24 text-center text-xs font-medium text-slate-600">
                {assetData.pagination.page} / {assetData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === assetData.pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-bold text-slate-950">
              {selectedAsset ? "Edit Aset" : "Tambah Aset"}
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Isi satu field per baris supaya data mudah dicek sebelum disimpan.
            </p>
          </DialogHeader>
          <div className="px-6 py-2">
            <FieldRow
              label="Nama Aset"
              hint="Contoh: Laptop Admin 01, Akun Google Ads."
            >
              <Input
                className={fieldInputClass}
                value={assetForm.name}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, name: event.target.value })
                }
              />
            </FieldRow>
            <FieldRow
              label="Kode Aset"
              hint="Kosongkan jika ingin dibuat otomatis."
            >
              <Input
                className={fieldInputClass}
                value={assetForm.assetCode}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, assetCode: event.target.value })
                }
                placeholder="Auto jika kosong"
              />
            </FieldRow>
            <FieldRow label="Tipe Aset">
              <Select
                value={assetForm.type}
                onValueChange={(value: AssetType) =>
                  setAssetForm({ ...assetForm, type: value })
                }
              >
                <SelectTrigger className={fieldInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow
              label="Kategori"
              hint="Laptop, HP, Email, Social Media, Ads, Domain, dll."
            >
              <Input
                className={fieldInputClass}
                value={assetForm.category}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, category: event.target.value })
                }
              />
            </FieldRow>
            <FieldRow label="Status">
              <Select
                value={assetForm.status}
                onValueChange={(value: AssetStatus) =>
                  setAssetForm({ ...assetForm, status: value })
                }
              >
                <SelectTrigger className={fieldInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Lokasi">
              <Input
                className={fieldInputClass}
                value={assetForm.location}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, location: event.target.value })
                }
                placeholder="Kantor, rumah staff, cloud, dll"
              />
            </FieldRow>{" "}
            {assetForm.type === "DEVICE" ? (
              <>
                <FieldRow label="Brand">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.brand}
                    onChange={(event) =>
                      setAssetForm({ ...assetForm, brand: event.target.value })
                    }
                  />
                </FieldRow>
                <FieldRow label="Model">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.model}
                    onChange={(event) =>
                      setAssetForm({ ...assetForm, model: event.target.value })
                    }
                  />
                </FieldRow>
                <FieldRow label="Serial Number">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.serialNumber}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        serialNumber: event.target.value,
                      })
                    }
                  />
                </FieldRow>
                <FieldRow
                  label="Identifier"
                  hint="IMEI, nomor inventaris lama, atau kode lain."
                >
                  <Input
                    className={fieldInputClass}
                    value={assetForm.identifier}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        identifier: event.target.value,
                      })
                    }
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow label="Platform">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.platform}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        platform: event.target.value,
                      })
                    }
                    placeholder="Google, Meta, TikTok, domain, hosting"
                  />
                </FieldRow>
                <FieldRow
                  label="Email/Username"
                  hint="Jangan isi password/token di sini."
                >
                  <Input
                    className={fieldInputClass}
                    value={assetForm.accountUsername}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        accountUsername: event.target.value,
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label="Recovery Contact">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.recoveryContact}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        recoveryContact: event.target.value,
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label="PIC Akun">
                  <Input
                    className={fieldInputClass}
                    value={assetForm.accountPic}
                    onChange={(event) =>
                      setAssetForm({
                        ...assetForm,
                        accountPic: event.target.value,
                      })
                    }
                  />
                </FieldRow>
              </>
            )}
            <FieldRow label="Kondisi">
              <Input
                className={fieldInputClass}
                value={assetForm.condition}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, condition: event.target.value })
                }
                placeholder="Baik, layar retak, perlu service, dll"
              />
            </FieldRow>
            <FieldRow label="Catatan">
              <Textarea
                className="min-h-24 border-slate-300 bg-white"
                value={assetForm.notes}
                onChange={(event) =>
                  setAssetForm({ ...assetForm, notes: event.target.value })
                }
              />
            </FieldRow>
            {assetForm.type === "ACCOUNT" && (
              <FieldRow
                label="Catatan Akun"
                hint="Catatan operasional tanpa password/token."
              >
                <Textarea
                  className="min-h-24 border-slate-300 bg-white"
                  value={assetForm.accountNotes}
                  onChange={(event) =>
                    setAssetForm({
                      ...assetForm,
                      accountNotes: event.target.value,
                    })
                  }
                />
              </FieldRow>
            )}
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={saveAsset}
              disabled={isSavingAsset}
              className="bg-slate-950 text-white hover:bg-slate-800"
            >
              {isSavingAsset && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Simpan Aset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Form Serah Terima Aset</DialogTitle>
            <p className="text-sm text-slate-500">
              Form ini akan membuat assignment aktif dan dokumen PDF.
            </p>
          </DialogHeader>
          <div className="px-6 py-2">
            <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedAsset?.name}
              </div>
              <div className="mt-1 font-mono text-xs text-slate-500">
                {selectedAsset?.assetCode}
              </div>
            </div>
            <FieldRow label="Pemegang">
              <Select
                value={assignForm.holderUserId}
                onValueChange={(value) =>
                  setAssignForm({ ...assignForm, holderUserId: value })
                }
              >
                <SelectTrigger className={fieldInputClass}>
                  <SelectValue placeholder="Pilih pemegang" />
                </SelectTrigger>
                <SelectContent>
                  {(holderData?.data || []).map((holder) => (
                    <SelectItem key={holder.id} value={String(holder.id)}>
                      {holder.fullName} - {holder.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Tanggal Serah">
              <Input
                className={fieldInputClass}
                type="date"
                value={assignForm.assignedAt}
                onChange={(event) =>
                  setAssignForm({
                    ...assignForm,
                    assignedAt: event.target.value,
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Estimasi Kembali">
              <Input
                className={fieldInputClass}
                type="date"
                value={assignForm.expectedReturnAt}
                onChange={(event) =>
                  setAssignForm({
                    ...assignForm,
                    expectedReturnAt: event.target.value,
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Kondisi Awal">
              <Input
                className={fieldInputClass}
                value={assignForm.initialCondition}
                onChange={(event) =>
                  setAssignForm({
                    ...assignForm,
                    initialCondition: event.target.value,
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Tujuan Pemakaian">
              <Textarea
                className="min-h-24 border-slate-300 bg-white"
                value={assignForm.purpose}
                onChange={(event) =>
                  setAssignForm({ ...assignForm, purpose: event.target.value })
                }
              />
            </FieldRow>
            <FieldRow label="Catatan">
              <Textarea
                className="min-h-24 border-slate-300 bg-white"
                value={assignForm.notes}
                onChange={(event) =>
                  setAssignForm({ ...assignForm, notes: event.target.value })
                }
              />
            </FieldRow>
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Form Pengembalian Aset</DialogTitle>
            <p className="text-sm text-slate-500">
              Catat kondisi akhir aset dan status setelah dikembalikan.
            </p>
          </DialogHeader>
          <div className="px-6 py-2">
            <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedAsset?.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Pemegang:{" "}
                {selectedAsset?.activeAssignment?.holder?.fullName || "-"}
              </div>
            </div>
            <FieldRow label="Tanggal Kembali">
              <Input
                className={fieldInputClass}
                type="date"
                value={returnForm.returnedAt}
                onChange={(event) =>
                  setReturnForm({
                    ...returnForm,
                    returnedAt: event.target.value,
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Status Setelah Kembali">
              <Select
                value={returnForm.nextStatus}
                onValueChange={(value: Exclude<AssetStatus, "ASSIGNED">) =>
                  setReturnForm({ ...returnForm, nextStatus: value })
                }
              >
                <SelectTrigger className={fieldInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses
                    .filter((status) => status !== "ASSIGNED")
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Kondisi Kembali">
              <Input
                className={fieldInputClass}
                value={returnForm.returnCondition}
                onChange={(event) =>
                  setReturnForm({
                    ...returnForm,
                    returnCondition: event.target.value,
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Catatan">
              <Textarea
                className="min-h-24 border-slate-300 bg-white"
                value={returnForm.returnNotes}
                onChange={(event) =>
                  setReturnForm({
                    ...returnForm,
                    returnNotes: event.target.value,
                  })
                }
              />
            </FieldRow>
          </div>
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dokumen Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Belum ada dokumen untuk aset ini.
              </p>
            ) : (
              documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {document.documentNumber}
                    </div>
                    <div className="text-xs text-slate-500">
                      {document.type}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      assetService.downloadDocument(
                        document.assetId,
                        document.id,
                        document.fileName,
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
