"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Upload } from "lucide-react";

export interface PackageOptionDraft {
  id?: number;
  name: string;
  hotelMakkahId?: number | null;
  hotelMadinahId?: number | null;
  priceDouble?: number | string;
  priceTriple?: number | string;
  priceQuad?: number | string;
  priceQuint?: number | string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  images?: { id: number; imageUrl: string; caption?: string | null }[];
}

interface Props {
  options: PackageOptionDraft[];
  hotelsMakkah: any[];
  hotelsMadinah: any[];
  onChange: (options: PackageOptionDraft[]) => void;
  onUploadImage?: (option: PackageOptionDraft, file: File) => void;
  onDeleteImage?: (imageId: number) => void;
  uploadingOptionId?: number | null;
}

const toNumber = (value: string) => {
  const parsed = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizePackageOptionsForSubmit(
  options: PackageOptionDraft[],
) {
  return options.map((option, index) => ({
    id: option.id,
    name: option.name || `Pilihan ${index + 1}`,
    hotelMakkahId: option.hotelMakkahId || null,
    hotelMadinahId: option.hotelMadinahId || null,
    priceDouble: Number(option.priceDouble || 0),
    priceTriple: Number(option.priceTriple || 0),
    priceQuad: Number(option.priceQuad || 0),
    priceQuint: Number(option.priceQuint || 0),
    isDefault: index === options.findIndex((item) => item.isDefault !== false),
    isActive: option.isActive !== false,
    sortOrder: index,
  }));
}

export function buildDefaultPackageOptions(pkg?: any): PackageOptionDraft[] {
  const existing = Array.isArray(pkg?.options) ? pkg.options : [];
  if (existing.length > 0) {
    return existing.map((option: any, index: number) => ({
      id: option.id,
      name: option.name || `Pilihan ${index + 1}`,
      hotelMakkahId: option.hotelMakkahId || null,
      hotelMadinahId: option.hotelMadinahId || null,
      priceDouble: Number(option.priceDouble || 0),
      priceTriple: Number(option.priceTriple || 0),
      priceQuad: Number(option.priceQuad || 0),
      priceQuint: Number(option.priceQuint || 0),
      isDefault: option.isDefault ?? index === 0,
      isActive: option.isActive !== false,
      sortOrder: option.sortOrder ?? index,
      images: option.images || [],
    }));
  }

  return [
    {
      name: "Pilihan Utama",
      hotelMakkahId: pkg?.hotelMakkahId || null,
      hotelMadinahId: pkg?.hotelMadinahId || null,
      priceDouble: Number(pkg?.priceDouble || 0),
      priceTriple: Number(pkg?.priceTriple || 0),
      priceQuad: Number(pkg?.priceQuad || pkg?.price || 0),
      priceQuint: Number(pkg?.priceQuint || 0),
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      images: [],
    },
  ];
}

export default function PackageOptionsEditor({
  options,
  hotelsMakkah,
  hotelsMadinah,
  onChange,
  onUploadImage,
  onDeleteImage,
  uploadingOptionId,
}: Props) {
  const updateOption = (index: number, patch: Partial<PackageOptionDraft>) => {
    onChange(
      options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, ...patch } : option,
      ),
    );
  };

  const setDefault = (index: number) => {
    onChange(
      options.map((option, itemIndex) => ({
        ...option,
        isDefault: itemIndex === index,
      })),
    );
  };

  const addOption = () => {
    onChange([
      ...options,
      {
        name: `Pilihan ${options.length + 1}`,
        hotelMakkahId: null,
        hotelMadinahId: null,
        priceDouble: 0,
        priceTriple: 0,
        priceQuad: 0,
        priceQuint: 0,
        isDefault: options.length === 0,
        isActive: true,
        sortOrder: options.length,
        images: [],
      },
    ]);
  };

  const removeOption = (index: number) => {
    const next = options.filter((_, itemIndex) => itemIndex !== index);
    if (next.length > 0 && !next.some((option) => option.isDefault))
      next[0].isDefault = true;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">
            Pilihan Paket
          </h3>
          <p className="text-sm text-gray-500">
            Isi hotel dan harga, simpan paket, lalu upload flyer khusus pada
            setiap opsi. Gambar paket umum bukan pengganti flyer opsi.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Opsi
        </Button>
      </div>

      {options.map((option, index) => (
        <Card key={option.id || index} className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Opsi {index + 1}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={option.isDefault ? "default" : "outline"}
                size="sm"
                onClick={() => setDefault(index)}
              >
                Default
              </Button>
              {options.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Opsi</Label>
                <Input
                  value={option.name}
                  onChange={(event) =>
                    updateOption(index, { name: event.target.value })
                  }
                  placeholder="Safwa Tower 3"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label>Aktif</Label>
                  <p className="text-xs text-gray-500">
                    Nonaktifkan kalau opsi belum dijual.
                  </p>
                </div>
                <Switch
                  checked={option.isActive !== false}
                  onCheckedChange={(checked) =>
                    updateOption(index, { isActive: checked })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hotel Makkah</Label>
                <Select
                  value={option.hotelMakkahId?.toString() || ""}
                  onValueChange={(value) =>
                    updateOption(index, {
                      hotelMakkahId: value ? Number(value) : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hotel Makkah" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelsMakkah.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hotel Madinah</Label>
                <Select
                  value={option.hotelMadinahId?.toString() || ""}
                  onValueChange={(value) =>
                    updateOption(index, {
                      hotelMadinahId: value ? Number(value) : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hotel Madinah" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelsMadinah.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Double", "priceDouble"],
                ["Triple", "priceTriple"],
                ["Quad", "priceQuad"],
                ["Quint", "priceQuint"],
              ].map(([label, key]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    inputMode="numeric"
                    value={(option as any)[key] || ""}
                    onChange={(event) =>
                      updateOption(index, {
                        [key]: toNumber(event.target.value),
                      } as any)
                    }
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            {option.id && (
              <div className="space-y-3 rounded-md bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Flyer Opsi</Label>
                    <p className="text-xs text-gray-500">
                      Gambar akan dikonversi otomatis ke WebP.
                    </p>
                  </div>
                  <label
                    className={cn(
                      "inline-flex cursor-pointer items-center rounded-md border bg-white px-3 py-2 text-sm font-medium",
                      uploadingOptionId === option.id &&
                        "pointer-events-none opacity-60",
                    )}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file && onUploadImage) onUploadImage(option, file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                {(option.images || []).length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {(option.images || []).map((image) => (
                      <div
                        key={image.id}
                        className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border bg-white"
                      >
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={option.name}
                          className="h-full w-full object-cover"
                        />
                        {onDeleteImage && (
                          <button
                            type="button"
                            onClick={() => onDeleteImage(image.id)}
                            className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 shadow"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Belum ada flyer khusus untuk {option.name}. Upload flyer
                    agar gambar publik pasti sesuai dengan opsi ini.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
