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
  Laptop,
  Loader2,
  PackageCheck,
  PackageOpen,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

const assetStatuses: AssetStatus[] = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED", "LOST"];
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

const today = () => new Date().toISOString().slice(0, 10);

const statusClass = (status: AssetStatus) => {
  const classes: Record<AssetStatus, string> = {
    AVAILABLE: "bg-green-100 text-green-800 hover:bg-green-100",
    ASSIGNED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    MAINTENANCE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    RETIRED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    LOST: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  return classes[status];
};

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
      limit: 10,
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

  const invalidateAssets = () => {
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: AssetPayload) => assetService.createAsset(payload),
    onSuccess: () => {
      invalidateAssets();
      setAssetDialogOpen(false);
      toast({ title: "Berhasil", description: "Aset berhasil dibuat" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal disimpan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssetPayload }) =>
      assetService.updateAsset(id, payload),
    onSuccess: () => {
      invalidateAssets();
      setAssetDialogOpen(false);
      toast({ title: "Berhasil", description: "Aset berhasil diperbarui" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal diperbarui",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetService.deleteAsset(id),
    onSuccess: () => {
      invalidateAssets();
      toast({ title: "Berhasil", description: "Aset berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Aset gagal dihapus",
        variant: "destructive",
      });
    },
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
      toast({ title: "Berhasil", description: "Serah terima aset dibuat dan PDF digenerate" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Serah terima gagal",
        variant: "destructive",
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => assetService.returnAsset(selectedAsset!.id, returnForm),
    onSuccess: () => {
      invalidateAssets();
      setReturnDialogOpen(false);
      toast({ title: "Berhasil", description: "Pengembalian aset diproses dan PDF digenerate" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.response?.data?.message || "Pengembalian gagal",
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setSelectedAsset(null);
    setAssetForm(emptyAssetForm);
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
      initialCondition: asset.condition || "",
      purpose: "",
      notes: "",
      expectedReturnAt: "",
    });
    setAssignDialogOpen(true);
  };

  const openReturn = (asset: Asset) => {
    setSelectedAsset(asset);
    setReturnForm({
      returnedAt: today(),
      returnCondition: asset.condition || "",
      returnNotes: "",
      nextStatus: "AVAILABLE",
    });
    setReturnDialogOpen(true);
  };

  const saveAsset = () => {
    if (selectedAsset) {
      updateMutation.mutate({ id: selectedAsset.id, payload: assetForm });
    } else {
      createMutation.mutate(assetForm);
    }
  };

  const assets = assetData?.data || [];
  const documents = assetDetailData?.data.documents || selectedAsset?.documents || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Manajemen Aset</h1>
          <p className="mt-1 text-gray-600">Inventaris device dan akun digital internal</p>
        </div>
        {!readOnly && (
          <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-primary font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Aset
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {assetStatuses.map((status) => {
          const total = assets.filter((asset) => asset.status === status).length;
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{status}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <PackageCheck className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold">{total}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Aset</CardTitle>
          <CardDescription>Cari berdasarkan nama, kode, kategori, identifier, atau username akun</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari aset..."
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {assetTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {assetStatuses.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Aset</CardTitle>
          <CardDescription>Total {assetData?.pagination.total || 0} aset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Aset</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pemegang</TableHead>
                  <TableHead>Lokasi/Identifier</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      Belum ada aset
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.assetCode}</TableCell>
                      <TableCell>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs text-gray-500">{asset.category}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{asset.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(asset.status)}>{asset.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {asset.activeAssignment?.holder ? (
                          <div>
                            <div className="font-medium">{asset.activeAssignment.holder.fullName}</div>
                            <div className="text-xs text-gray-500">{asset.activeAssignment.holder.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{asset.location || asset.identifier || asset.accountUsername || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDocumentDialogOpen(true);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {!readOnly && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEdit(asset)}>
                                Edit
                              </Button>
                              {asset.status === "AVAILABLE" && (
                                <Button variant="outline" size="sm" onClick={() => openAssign(asset)}>
                                  <PackageOpen className="mr-2 h-4 w-4" />
                                  Serah
                                </Button>
                              )}
                              {asset.status === "ASSIGNED" && (
                                <Button variant="outline" size="sm" onClick={() => openReturn(asset)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Kembali
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={asset.status === "ASSIGNED" || deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(asset.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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

          {assetData?.pagination && assetData.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                Halaman {assetData.pagination.page} dari {assetData.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === assetData.pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? "Edit Aset" : "Tambah Aset"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama Aset</Label>
              <Input value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Kode Aset</Label>
              <Input
                value={assetForm.assetCode}
                onChange={(event) => setAssetForm({ ...assetForm, assetCode: event.target.value })}
                placeholder="Auto jika kosong"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={assetForm.type} onValueChange={(value: AssetType) => setAssetForm({ ...assetForm, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input value={assetForm.category} onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={assetForm.status} onValueChange={(value: AssetStatus) => setAssetForm({ ...assetForm, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input value={assetForm.location} onChange={(event) => setAssetForm({ ...assetForm, location: event.target.value })} />
            </div>
            {assetForm.type === "DEVICE" ? (
              <>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={assetForm.brand} onChange={(event) => setAssetForm({ ...assetForm, brand: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={assetForm.model} onChange={(event) => setAssetForm({ ...assetForm, model: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={assetForm.serialNumber} onChange={(event) => setAssetForm({ ...assetForm, serialNumber: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Identifier</Label>
                  <Input value={assetForm.identifier} onChange={(event) => setAssetForm({ ...assetForm, identifier: event.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Input value={assetForm.platform} onChange={(event) => setAssetForm({ ...assetForm, platform: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email/Username</Label>
                  <Input value={assetForm.accountUsername} onChange={(event) => setAssetForm({ ...assetForm, accountUsername: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Recovery/Contact</Label>
                  <Input value={assetForm.recoveryContact} onChange={(event) => setAssetForm({ ...assetForm, recoveryContact: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>PIC/Catatan Akun</Label>
                  <Input value={assetForm.accountPic} onChange={(event) => setAssetForm({ ...assetForm, accountPic: event.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Kondisi</Label>
              <Input value={assetForm.condition} onChange={(event) => setAssetForm({ ...assetForm, condition: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Catatan</Label>
              <Textarea value={assetForm.notes} onChange={(event) => setAssetForm({ ...assetForm, notes: event.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>Batal</Button>
            <Button onClick={saveAsset} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Serah Terima Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <Laptop className="mb-2 h-4 w-4 text-gray-500" />
              <div className="font-medium">{selectedAsset?.name}</div>
              <div className="text-gray-500">{selectedAsset?.assetCode}</div>
            </div>
            <div className="space-y-2">
              <Label>Pemegang</Label>
              <Select value={assignForm.holderUserId} onValueChange={(value) => setAssignForm({ ...assignForm, holderUserId: value })}>
                <SelectTrigger><SelectValue placeholder="Pilih pemegang" /></SelectTrigger>
                <SelectContent>
                  {(holderData?.data || []).map((holder) => (
                    <SelectItem key={holder.id} value={String(holder.id)}>
                      {holder.fullName} - {holder.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal Serah Terima</Label>
                <Input type="date" value={assignForm.assignedAt} onChange={(event) => setAssignForm({ ...assignForm, assignedAt: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estimasi Kembali</Label>
                <Input type="date" value={assignForm.expectedReturnAt} onChange={(event) => setAssignForm({ ...assignForm, expectedReturnAt: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kondisi Awal</Label>
              <Input value={assignForm.initialCondition} onChange={(event) => setAssignForm({ ...assignForm, initialCondition: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tujuan Pemakaian</Label>
              <Textarea value={assignForm.purpose} onChange={(event) => setAssignForm({ ...assignForm, purpose: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={assignForm.notes} onChange={(event) => setAssignForm({ ...assignForm, notes: event.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Batal</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Pengembalian Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">{selectedAsset?.name}</div>
              <div className="text-gray-500">
                Pemegang: {selectedAsset?.activeAssignment?.holder?.fullName || "-"}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal Kembali</Label>
                <Input type="date" value={returnForm.returnedAt} onChange={(event) => setReturnForm({ ...returnForm, returnedAt: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status Setelah Kembali</Label>
                <Select value={returnForm.nextStatus} onValueChange={(value: Exclude<AssetStatus, "ASSIGNED">) => setReturnForm({ ...returnForm, nextStatus: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assetStatuses.filter((status) => status !== "ASSIGNED").map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kondisi Kembali</Label>
              <Input value={returnForm.returnCondition} onChange={(event) => setReturnForm({ ...returnForm, returnCondition: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Catatan Kerusakan/Kekurangan</Label>
              <Textarea value={returnForm.returnNotes} onChange={(event) => setReturnForm({ ...returnForm, returnNotes: event.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Batal</Button>
            <Button onClick={() => returnMutation.mutate()} disabled={returnMutation.isPending}>
              {returnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokumen Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada dokumen untuk aset ini.</p>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{document.documentNumber}</div>
                    <div className="text-xs text-gray-500">{document.type}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => assetService.downloadDocument(document.assetId, document.id, document.fileName)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
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
