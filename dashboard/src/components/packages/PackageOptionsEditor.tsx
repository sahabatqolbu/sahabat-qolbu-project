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
import { BadgeCheck, Loader2, Plus, Trash2, Upload } from "lucide-react";

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

export interface PackageOptionBaseValues {
  hotelMakkahId?: number | null;
  hotelMadinahId?: number | null;
  priceDouble?: number | string;
  priceTriple?: number | string;
  priceQuad?: number | string;
  priceQuint?: number | string;
}

interface Props {
  options: PackageOptionDraft[];
  baseValues: PackageOptionBaseValues;
  hotelsMakkah: any[];
  hotelsMadinah: any[];
  onChange: (options: PackageOptionDraft[]) => void;
  onUploadImage?: (option: PackageOptionDraft, file: File) => void;
  onDeleteImage?: (imageId: number) => void;
  uploadingOptionId?: number | null;
  deletingImageId?: number | null;
}

const toNumber = (value: string) => {
  const parsed = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizePackageOptionsForSubmit(
  options: PackageOptionDraft[],
  baseValues: PackageOptionBaseValues,
) {
  return options.map((option, index) => ({
    id: option.id,
    name: option.name || `Pilihan ${index + 1}`,
    hotelMakkahId:
      index === 0
        ? baseValues.hotelMakkahId || null
        : option.hotelMakkahId || null,
    hotelMadinahId:
      index === 0
        ? baseValues.hotelMadinahId || null
        : option.hotelMadinahId || null,
    priceDouble: Number(
      index === 0 ? baseValues.priceDouble || 0 : option.priceDouble || 0,
    ),
    priceTriple: Number(
      index === 0 ? baseValues.priceTriple || 0 : option.priceTriple || 0,
    ),
    priceQuad: Number(
      index === 0 ? baseValues.priceQuad || 0 : option.priceQuad || 0,
    ),
    priceQuint: Number(
      index === 0 ? baseValues.priceQuint || 0 : option.priceQuint || 0,
    ),
    isDefault: index === 0,
    isActive: index === 0 ? true : option.isActive !== false,
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
  baseValues,
  hotelsMakkah,
  hotelsMadinah,
  onChange,
  onUploadImage,
  onDeleteImage,
  uploadingOptionId,
  deletingImageId,
}: Props) {
  const updateOption = (index: number, patch: Partial<PackageOptionDraft>) => {
    onChange(
      options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, ...patch } : option,
      ),
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
        isDefault: false,
        isActive: true,
        sortOrder: options.length,
        images: [],
      },
    ]);
  };

  const removeOption = (index: number) => {
    if (index === 0) return;
    const next = options.filter((_, itemIndex) => itemIndex !== index);
    if (next.length > 0) next[0].isDefault = true;
    onChange(next);
  };

  const getHotelName = (
    hotelId: number | string | null | undefined,
    hotels: any[],
  ) =>
    hotels.find((hotel) => Number(hotel.id) === Number(hotelId))?.name ||
    "Belum dipilih";

  const formatPrice = (value: number | string | null | undefined) =>
    Number(value || 0).toLocaleString("id-ID");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">
            Pilihan Paket
          </h3>
          <p className="text-sm text-gray-500">
            Opsi utama otomatis mengikuti hotel, harga, dan gambar paket.
            Tambahkan opsi lain hanya jika ada pilihan hotel, harga, atau flyer
            yang berbeda.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Opsi
        </Button>
      </div>

      {options.map((option, index) => (
        <Card key={option.id || index} className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              {index === 0 ? "Opsi Utama" : `Opsi ${index + 1}`}
              {index === 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Otomatis
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {index > 0 && (
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
                    {index === 0
                      ? "Mengikuti status paket utama."
                      : "Nonaktifkan kalau opsi belum dijual."}
                  </p>
                </div>
                <Switch
                  checked={index === 0 ? true : option.isActive !== false}
                  disabled={index === 0}
                  onCheckedChange={(checked) =>
                    updateOption(index, { isActive: checked })
                  }
                />
              </div>
            </div>

            {index === 0 ? (
              <div className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
                <div>
                  <p className="font-semibold text-emerald-900">
                    Tidak perlu mengisi ulang data opsi utama
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Nilai berikut otomatis mengikuti tab Hotel dan Info Dasar.
                  </p>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-md bg-white p-3">
                    <p className="text-gray-500">Hotel Makkah</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {getHotelName(baseValues.hotelMakkahId, hotelsMakkah)}
                    </p>
                  </div>
                  <div className="rounded-md bg-white p-3">
                    <p className="text-gray-500">Hotel Madinah</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {getHotelName(baseValues.hotelMadinahId, hotelsMadinah)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
                  {[
                    ["Double", baseValues.priceDouble],
                    ["Triple", baseValues.priceTriple],
                    ["Quad", baseValues.priceQuad],
                    ["Quint", baseValues.priceQuint],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-md bg-white p-3"
                    >
                      <p className="text-gray-500">{label}</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        Rp{formatPrice(value)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="rounded-md bg-white px-3 py-2 text-xs font-medium text-emerald-800">
                  Flyer opsi utama menggunakan Gambar / Brosur Paket pada tab
                  Media.
                </p>
              </div>
            ) : (
              <>
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
                          <SelectItem
                            key={hotel.id}
                            value={hotel.id.toString()}
                          >
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
                          <SelectItem
                            key={hotel.id}
                            value={hotel.id.toString()}
                          >
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
              </>
            )}

            {index > 0 && (
              <div className="space-y-3 rounded-md bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Flyer Opsi</Label>
                    <p className="text-xs text-gray-500">
                      {option.id
                        ? "Upload langsung tersimpan otomatis dan dikonversi ke WebP."
                        : "Simpan paket terlebih dahulu untuk mengaktifkan upload."}
                    </p>
                  </div>
                  {option.id ? (
                    <label
                      className={cn(
                        "inline-flex cursor-pointer items-center rounded-md border bg-white px-3 py-2 text-sm font-medium",
                        uploadingOptionId === option.id &&
                          "pointer-events-none opacity-60",
                      )}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload Flyer
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingOptionId !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file && onUploadImage)
                            onUploadImage(option, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <Button type="button" variant="outline" disabled>
                      <Upload className="mr-2 h-4 w-4" /> Upload Flyer
                    </Button>
                  )}
                </div>
                {!option.id ? (
                  <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                    Klik Simpan Perubahan di bawah. Setelah opsi tersimpan, buka
                    kembali edit paket untuk mengunggah flyer khusus opsi ini.
                  </p>
                ) : (option.images || []).length > 0 ? (
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
                            disabled={deletingImageId !== null}
                            aria-label={`Hapus flyer ${option.name}`}
                            title="Hapus flyer"
                            className="absolute right-1 top-1 z-10 rounded bg-white/95 p-1.5 text-red-600 shadow disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingImageId === image.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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
