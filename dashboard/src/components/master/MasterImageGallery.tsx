"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import { masterService } from "@/services/masterService";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MasterImage = {
  id: number;
  imageUrl: string;
  caption?: string | null;
};

type Props = {
  kind: "hotel" | "airline";
  masterId: number;
  images?: MasterImage[];
};

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || !error) return "Terjadi kesalahan server";
  const responseError = error as { response?: { data?: { message?: string } } };
  return responseError.response?.data?.message || "Terjadi kesalahan server";
};

export default function MasterImageGallery({ kind, masterId, images = [] }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const label = kind === "hotel" ? "hotel" : "maskapai";
  const queryKey = [kind, String(masterId)];
  const service = kind === "hotel" ? masterService.hotels : masterService.airlines;

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => service.uploadImages(masterId, files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Galeri berhasil disimpan",
        description: "Semua gambar sudah dikonversi otomatis ke format WebP.",
      });
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal mengunggah galeri",
        description: getErrorMessage(error),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => service.deleteImage(imageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast({ title: "Gambar berhasil dihapus" });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Gagal menghapus gambar",
        description: getErrorMessage(error),
      }),
  });

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      toast({ variant: "destructive", title: "Semua file harus berupa gambar" });
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      toast({ variant: "destructive", title: "Ukuran maksimal setiap gambar 5 MB" });
      return;
    }
    if (images.length + files.length > 20) {
      toast({ variant: "destructive", title: "Maksimal 20 gambar dalam satu galeri" });
      return;
    }
    uploadMutation.mutate(files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" /> Galeri {kind === "hotel" ? "Hotel" : "Maskapai"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tambahkan foto {kind === "hotel" ? "gedung, kamar, restoran, dan fasilitas" : "pesawat, kabin, kursi, dan layanan"}. Maksimal 20 foto.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {images.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-md border bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(image.imageUrl)} alt={`Galeri ${label}`} className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="Hapus gambar"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(image.id)}
                  className="absolute right-2 top-2 h-8 w-8 opacity-100 shadow-md md:opacity-0 md:group-hover:opacity-100"
                >
                  {deleteMutation.isPending && deleteMutation.variables === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
            Belum ada foto galeri untuk {label} ini.
          </div>
        )}

        <input ref={inputRef} id={`${kind}-gallery`} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
        <Button
          type="button"
          variant="outline"
          disabled={uploadMutation.isPending || images.length >= 20}
          onClick={() => inputRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {uploadMutation.isPending ? "Mengunggah dan mengonversi..." : "Tambah Foto Galeri"}
        </Button>
        <p className="text-xs text-muted-foreground">Bisa pilih sampai 10 gambar sekaligus. JPG, PNG, atau WebP; hasil disimpan sebagai WebP.</p>
      </CardContent>
    </Card>
  );
}
