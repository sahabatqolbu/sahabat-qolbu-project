// dashboard/src/app/(dashboard)/admin/master/airports/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";

interface AirportItem {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  isActive: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Terjadi kesalahan";
};

export default function AirportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  // ✅ TAMBAH STATE INI
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<AirportItem | null>(null);

  // ===== FETCH AIRPORTS =====
  const { data, isLoading } = useQuery({
    queryKey: ["airports"],
    queryFn: () => masterService.airports.getAll(),
  });

  const airports: AirportItem[] = Array.isArray(data?.data)
    ? (data.data as AirportItem[])
    : [];
  const filteredAirports = airports.filter(
    (airport) =>
      airport.name.toLowerCase().includes(search.toLowerCase()) ||
      airport.code.toLowerCase().includes(search.toLowerCase()) ||
      airport.city.toLowerCase().includes(search.toLowerCase()),
  );

  // ✅ DELETE MUTATION
  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterService.airports.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airports"] });
      setDeleteDialogOpen(false);
      setSelectedAirport(null);
      toast({
        title: "✅ Bandara Dihapus",
        description: "Bandara berhasil dihapus dari sistem",
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Hapus Bandara",
        description: getErrorMessage(error),
      });
    },
  });

  const handleDelete = () => {
    if (selectedAirport) {
      deleteMutation.mutate(selectedAirport.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Master Bandara
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola data bandara keberangkatan
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => router.push("/admin/master/airports/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Bandara
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama, kode, atau kota..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bandara</CardTitle>
          <CardDescription>
            Total {filteredAirports.length} bandara
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAirports.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada bandara ditemukan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Bandara</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Negara</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAirports.map((airport) => (
                  <TableRow key={airport.id}>
                    <TableCell className="font-mono font-semibold">
                      {airport.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {airport.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {airport.city}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {airport.country}
                    </TableCell>
                    <TableCell>
                      {airport.isActive ? (
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
                              `/admin/master/airports/edit/${airport.id}`
                            )
                          }
                          title="Edit Bandara"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAirport(airport);
                            setDeleteDialogOpen(true);
                          }}
                          title="Hapus Bandara"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ✅ DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Bandara</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus bandara{" "}
              <strong>{selectedAirport?.name}</strong> ({selectedAirport?.code}
              )? Tindakan ini tidak dapat dibatalkan.
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
                  Menghapus...
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
