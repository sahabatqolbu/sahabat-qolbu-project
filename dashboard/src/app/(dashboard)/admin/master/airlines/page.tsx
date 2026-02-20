// dashboard/src/app/(dashboard)/admin/master/airlines/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterService } from "@/services/masterService";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils"; // ✅ TAMBAH IMPORT
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plane, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";

interface AirlineItem {
  id: number;
  code: string;
  name: string;
  logo?: string | null;
  country?: string | null;
  isActive: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Maskapai masih digunakan di paket";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Maskapai masih digunakan di paket";
};

export default function AirlinesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<AirlineItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["airlines"],
    queryFn: () => masterService.airlines.getAll(),
  });

 
const deleteMutation = useMutation({
  mutationFn: (id: number) => masterService.airlines.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["airlines"] });

    // ✅ TOAST SUCCESS
    toast({
      title: "✅ Berhasil",
      description: "Maskapai berhasil dihapus",
      variant: "default",
    });

    setDeleteDialogOpen(false);
  },
  onError: (error: unknown) => {
    // ✅ TOAST ERROR
    toast({
      title: "❌ Gagal Menghapus",
      description:
        getErrorMessage(error),
      variant: "destructive",
    });
  },
});

  const airlines: AirlineItem[] = Array.isArray(data?.data)
    ? (data.data as AirlineItem[])
    : [];
  const filteredAirlines = airlines.filter(
    (airline) =>
      airline.name.toLowerCase().includes(search.toLowerCase()) ||
      airline.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Plane className="h-8 w-8" />
            Master Maskapai
          </h1>
          <p className="text-gray-600 mt-1">Kelola data maskapai penerbangan</p>
        </div>
        {/* ✅ FIX: Tambah onClick */}
        <Button
          className="bg-secondary hover:bg-secondary/90"
          onClick={() => router.push("/admin/master/airlines/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Maskapai
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau kode maskapai..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Maskapai</CardTitle>
          <CardDescription>
            Total {filteredAirlines.length} maskapai
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAirlines.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada maskapai ditemukan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Maskapai</TableHead>
                  <TableHead>Negara</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAirlines.map((airline) => (
                  <TableRow key={airline.id}>
                    <TableCell>
                      {airline.logo ? (
                        <div className="w-12 h-12 relative rounded-md overflow-hidden border bg-white">
                          <img
                            src={getImageUrl(airline.logo)} // ✅ PAKAI getImageUrl()
                            alt={airline.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              console.error(
                                "❌ Logo load error:",
                                airline.logo
                              );
                              e.currentTarget.src =
                                "https://via.placeholder.com/150?text=No+Logo";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <Plane className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {airline.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {airline.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {airline.country || "-"}
                    </TableCell>
                    <TableCell>
                      {airline.isActive ? (
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
                              `/admin/master/airlines/edit/${airline.id}`
                            )
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAirline(airline);
                            setDeleteDialogOpen(true);
                          }}
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Maskapai</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus maskapai{" "}
              <strong>{selectedAirline?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedAirline?.id)}
              className="bg-red-500 hover:bg-red-600"
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
