"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packageService, Package } from "@/services/packageService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pin,
  PinOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  Plus,
  Calendar,
  Building2,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface PinnedPackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PinnedPackagesDialog({
  open,
  onOpenChange,
}: PinnedPackagesDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all packages to list and reorder pinned items
  const { data: allPackagesData, isLoading } = useQuery({
    queryKey: ["packages-for-pinned-dialog"],
    queryFn: () => packageService.getAll({ limit: 100 }),
    enabled: open,
  });

  const allPackages: Package[] = allPackagesData?.data?.packages || [];
  const [pinnedList, setPinnedList] = useState<Package[]>([]);
  const [selectedToPinId, setSelectedToPinId] = useState<string>("");

  // Sync pinnedList when data arrives
  useEffect(() => {
    if (allPackages.length > 0) {
      const pinned = allPackages
        .filter((p) => p.isPinned)
        .sort((a, b) => {
          const rankA = a.pinnedOrder && a.pinnedOrder > 0 ? a.pinnedOrder : 999;
          const rankB = b.pinnedOrder && b.pinnedOrder > 0 ? b.pinnedOrder : 999;
          return rankA - rankB;
        });
      setPinnedList(pinned);
    }
  }, [allPackagesData]);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (order: { id: number; pinnedOrder: number }[]) =>
      packageService.reorderPinned(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages-for-pinned-dialog"] });
      toast({
        title: "✅ Urutan Paket Pinned Disimpan",
        description: "Paket-paket ini akan muncul di urutan teratas sesuai prioritas.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menyimpan Urutan",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned, pinnedOrder }: { id: number; isPinned: boolean; pinnedOrder?: number }) =>
      packageService.togglePin(id, isPinned, pinnedOrder),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages-for-pinned-dialog"] });
      toast({
        title: variables.isPinned ? "✅ Paket Disematkan" : "✅ Sematan Dilepas",
        description: variables.isPinned
          ? "Paket berhasil ditambahkan ke daftar pinned."
          : "Paket berhasil dikeluarkan dari daftar pinned.",
      });
      setSelectedToPinId("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Mengubah Status Sematan",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pinnedList.length) return;

    const newList = [...pinnedList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setPinnedList(newList);
  };

  const handleOrderNumberChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    const newList = [...pinnedList];
    newList[index] = {
      ...newList[index],
      pinnedOrder: isNaN(num) ? 0 : num,
    };
    setPinnedList(newList);
  };

  const handleSaveOrder = () => {
    const payload = pinnedList.map((pkg, idx) => ({
      id: pkg.id,
      pinnedOrder: pkg.pinnedOrder && pkg.pinnedOrder > 0 ? pkg.pinnedOrder : idx + 1,
    }));
    reorderMutation.mutate(payload);
  };

  const unpinnedOptions = allPackages.filter(
    (p) => !pinnedList.some((pinned) => pinned.id === p.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Pin className="h-5 w-5 fill-amber-600" />
            </span>
            Kelola Paket Pinned / Spesial
          </DialogTitle>
          <DialogDescription>
            Paket yang disematkan (pinned) akan otomatis selalu tampil di urutan paling atas daftar paket dan landing page. Anda dapat mengatur urutan prioritasnya di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Section: Add new package to pinned */}
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg space-y-2">
            <label className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Sematkan Paket Lain ke Posisi Atas
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedToPinId}
                onValueChange={setSelectedToPinId}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 flex-1">
                  <SelectValue placeholder="Pilih paket yang ingin disematkan..." />
                </SelectTrigger>
                <SelectContent>
                  {unpinnedOptions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Semua paket aktif sudah disematkan
                    </SelectItem>
                  ) : (
                    unpinnedOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.code} — {p.name} (Rp {Number(p.price || 0).toLocaleString("id-ID")})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={!selectedToPinId || selectedToPinId === "none" || togglePinMutation.isPending}
                onClick={() => {
                  togglePinMutation.mutate({
                    id: parseInt(selectedToPinId, 10),
                    isPinned: true,
                    pinnedOrder: pinnedList.length + 1,
                  });
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                {togglePinMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pin className="h-4 w-4 fill-white" />
                )}
                Sematkan
              </Button>
            </div>
          </div>

          {/* Section: List of Pinned Packages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
              <span>DAFTAR PAKET PINNED ({pinnedList.length})</span>
              <span>URUTAN TAMPIL</span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-600" />
                Memuat data paket...
              </div>
            ) : pinnedList.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-800">
                <Sparkles className="h-8 w-8 text-amber-400 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Belum ada paket yang disematkan
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Gunakan pilihan di atas atau klik ikon Pin pada tabel paket untuk menyematkan paket unggulan ke posisi paling atas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pinnedList.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-amber-200/80 dark:border-amber-900/40 rounded-lg shadow-sm hover:border-amber-400 transition-colors"
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-amber-600 disabled:opacity-20"
                        disabled={index === 0}
                        onClick={() => moveItem(index, "up")}
                        title="Naikkan prioritas"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-amber-600 disabled:opacity-20"
                        disabled={index === pinnedList.length - 1}
                        onClick={() => moveItem(index, "down")}
                        title="Turunkan prioritas"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Rank Badge */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-xs shrink-0 border border-amber-300">
                      #{index + 1}
                    </div>

                    {/* Package Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
                          {pkg.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50"
                        >
                          {pkg.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {pkg.departureDate
                            ? format(new Date(pkg.departureDate), "dd MMM yyyy", { locale: localeId })
                            : "-"}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Rp {Number(pkg.price || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Direct order input and unpin button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">No:</span>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={pkg.pinnedOrder || index + 1}
                          onChange={(e) => handleOrderNumberChange(index, e.target.value)}
                          className="w-14 h-8 text-center text-xs font-semibold"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Lepas Sematan (Unpin)"
                        disabled={togglePinMutation.isPending}
                        onClick={() => {
                          togglePinMutation.mutate({ id: pkg.id, isPinned: false });
                        }}
                      >
                        <PinOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t mt-2 flex justify-between sm:justify-between items-center">
          <p className="text-xs text-gray-500 hidden sm:block">
            Tips: Gunakan tombol panah atau isi nomor urut untuk menentukan paket mana yang tampil teratas.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleSaveOrder}
              disabled={pinnedList.length === 0 || reorderMutation.isPending}
              className="bg-primary hover:bg-primary/90 gap-1.5"
            >
              {reorderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Urutan Pinned
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
