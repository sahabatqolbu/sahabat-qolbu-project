// dashboard/src/app/(dashboard)/admin/master/hotels/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Search,
  Star,
  MapPin,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

export default function HotelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);

  // ===== FETCH HOTELS =====
  const { data, isLoading } = useQuery({
    queryKey: ["hotels", search, cityFilter],
    queryFn: async () => {
      const params: any = {};
      if (cityFilter !== "all") params.city = cityFilter;
      const response = await masterService.hotels.getAll(params);
      return response;
    },
  });

  const hotels = data?.data || [];
  const filteredHotels = hotels.filter((hotel: any) =>
    hotel.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ✅ DELETE MUTATION
  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterService.hotels.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      setDeleteDialogOpen(false);
      setSelectedHotel(null);
      toast({
        title: "✅ Hotel Dihapus",
        description: "Hotel berhasil dihapus dari sistem",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Hapus Hotel",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleDelete = () => {
    if (selectedHotel) {
      deleteMutation.mutate(selectedHotel.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Master Hotel
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola data hotel Makkah & Madinah
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => router.push("/admin/master/hotels/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Hotel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama hotel..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kota</SelectItem>
                <SelectItem value="MAKKAH">Makkah</SelectItem>
                <SelectItem value="MADINAH">Madinah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hotel</CardTitle>
          <CardDescription>Total {filteredHotels.length} hotel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada hotel ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gambar Hotel</TableHead>
                    <TableHead>Nama Hotel</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Jarak ke Haram</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHotels.map((hotel: any) => (
                    <TableRow key={hotel.id}>
                      <TableCell>
                        {hotel.imageUrl ? (
                          <div className="w-16 h-16 rounded overflow-hidden border bg-white">
                            <img
                              src={getImageUrl(hotel.imageUrl)}
                              alt={hotel.name}
                              onError={(e) => {
                                console.error(
                                  "❌ Image load error:",
                                  hotel.imageUrl,
                                );
                                e.currentTarget.src =
                                  "https://via.placeholder.com/150?text=No+Image";
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {hotel.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            hotel.city === "MAKKAH"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {hotel.city}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: hotel.starRating || 0 }).map(
                            (_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {hotel.distanceToHaram
                          ? `${hotel.distanceToHaram}m`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {hotel.isActive ? (
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
                              router.push(
                                `/admin/master/hotels/edit/${hotel.id}`,
                              )
                            }
                            title="Edit Hotel"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedHotel(hotel);
                              setDeleteDialogOpen(true);
                            }}
                            title="Hapus Hotel"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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

      {/* ✅ DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Hotel</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus hotel{" "}
              <strong>{selectedHotel?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
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
                  Menyimpan...
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
