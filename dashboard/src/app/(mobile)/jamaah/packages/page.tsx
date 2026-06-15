// dashboard/src/app/(mobile)/jamaah/packages/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getImageUrl } from "@/lib/utils";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  ArrowLeft,
  Package,
  Calendar,
  Plane,
  Building,
  MapPin,
  Star,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function JamaahPackagePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-package"],
    queryFn: () => jamaahSelfService.getPackage(),
  });

  const { data: availablePackagesData, isLoading: isAvailableLoading } =
    useQuery({
      queryKey: ["jamaah-available-packages"],
      queryFn: () => jamaahSelfService.getAvailablePackages(),
      staleTime: 60_000,
    });

  const packageData = data?.data?.package;
  const bookingInfo = data?.data?.booking;
  const pricing = data?.data?.pricing;
  const availablePackages = availablePackagesData?.data?.packages || [];

  const getAssetUrl = (path: string | null | undefined) => {
    return path ? getImageUrl(path) : "";
  };

  const getTextLines = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value !== "string") {
      return [String(value)];
    }

    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback plain text
    }

    return trimmed
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/jamaah">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Paket Umrah</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-[var(--color-primary)] mt-0.5" />
                <div>
                  <h2 className="font-semibold text-gray-800">Belum Ada Paket Terpilih</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Anda belum terdaftar di paket manapun. Berikut daftar paket yang tersedia untuk dipilih.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAvailableLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : availablePackages.length === 0 ? (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700">Belum ada paket tersedia</p>
                <p className="text-sm text-gray-500 mt-1">Silakan hubungi admin/agen untuk informasi paket terbaru.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {availablePackages.map((pkg: any) => {
                const finalPrice = parseFloat(pkg.discountPrice || pkg.price || "0");
                const seats = Number(pkg.remainingSeats ?? pkg.totalSeats ?? 0);

                return (
                  <Link key={pkg.id} href={`/jamaah/packages/${pkg.id}`}>
                    <Card className="border-0 shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">{pkg.type || "UMROH"}</Badge>
                              <span className="text-xs text-gray-500">Kode: {pkg.code || "-"}</span>
                            </div>
                            <p className="font-semibold text-gray-900 line-clamp-1">{pkg.name}</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {pkg.departureDate
                                  ? format(new Date(pkg.departureDate), "dd MMM yyyy", { locale: id })
                                  : "Tanggal belum ditentukan"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {pkg.duration || "-"} hari
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {seats} kursi
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Mulai dari</p>
                            <p className="font-bold text-[var(--color-primary)] text-sm">
                              Rp {finalPrice.toLocaleString("id-ID")}
                            </p>
                            <p className="text-[11px] text-[var(--color-primary)] mt-2">
                              Lihat detail
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav role="JAMAAH" />
      </div>
    );
  }

  const packageImages = Array.isArray(packageData.images) ? packageData.images : [];
  const primaryImage =
    packageImages.find((img: any) => img?.isPrimary)?.imageUrl ||
    packageImages[0]?.imageUrl ||
    "";
  const itineraryUrl = getAssetUrl(packageData.itineraryPdf);
  const facilityLines = getTextLines(packageData.facilities);
  const descriptionLines = getTextLines(packageData.description);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/jamaah">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Detail Paket</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Package Header */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          {primaryImage ? (
            <div className="h-52 w-full bg-gray-100">
              <img
                src={getAssetUrl(primaryImage)}
                alt={packageData.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-600)] p-5 text-white">
            <Badge className="bg-white/20 text-white border-0 mb-2">
              {bookingInfo?.notePaket || "FULLSERVICE"}
            </Badge>
            <h2 className="text-xl font-bold mb-2">{packageData.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(packageData.departureDate), "dd MMM yyyy", {
                  locale: id,
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {packageData.duration || "-"} Hari
              </span>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">No. Booking</p>
                <p className="font-bold">{bookingInfo?.bookingNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Tanggal Booking</p>
                <p className="font-medium text-sm">
                  {format(new Date(bookingInfo?.dateOfBooking), "dd MMM yyyy", {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {packageImages.length > 1 && (
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Galeri Paket</h3>
              <div className="grid grid-cols-3 gap-2">
                {packageImages.slice(0, 6).map((img: any) => (
                  <a
                    key={img.id}
                    href={getAssetUrl(img.imageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={getAssetUrl(img.imageUrl)}
                      alt={img.caption || packageData.name}
                      className="h-20 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flight */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Penerbangan</h3>
            </div>
            <div className="flex items-center gap-3">
              {packageData.airline?.logo ? (
                <img
                  src={getAssetUrl(packageData.airline.logo)}
                  alt={packageData.airline.name || "Maskapai"}
                  className="h-10 w-10 object-contain"
                />
              ) : null}
              <div>
                <p className="font-medium">{packageData.airline?.name || "-"}</p>
                <p className="text-xs text-gray-500">Maskapai</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t text-sm text-gray-700 space-y-1">
              <p>
                <span className="text-gray-500">Bandara Keberangkatan:</span>{" "}
                {packageData.departureAirport
                  ? `${packageData.departureAirport.code} - ${packageData.departureAirport.name}`
                  : "-"}
              </p>
              {packageData.departureAirport?.city ? (
                <p>
                  <span className="text-gray-500">Kota:</span>{" "}
                  {packageData.departureAirport.city}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Itinerary</h3>
            {itineraryUrl ? (
              <a
                href={itineraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
              >
                Lihat / Download Itinerary
              </a>
            ) : (
              <p className="text-sm text-gray-500">Itinerary belum tersedia.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Deskripsi Paket</h3>
            {descriptionLines.length > 0 ? (
              <div className="space-y-1 text-sm text-gray-700">
                {descriptionLines.map((line, idx) => (
                  <p key={`desc-${idx}`}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada deskripsi.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Fasilitas</h3>
            {facilityLines.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700">
                {facilityLines.map((line, idx) => (
                  <li key={`facility-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Belum ada fasilitas.</p>
            )}
          </CardContent>
        </Card>

        {/* Hotels */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">Akomodasi</h3>
            </div>

            {/* Hotel Makkah */}
            {packageData.hotelMakkah && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Makkah
                    </p>
                    <p className="font-medium">
                      {packageData.hotelMakkah.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({
                        length: packageData.hotelMakkah.rating || 0,
                      }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  {bookingInfo?.roomTypeMakkah && (
                    <Badge variant="outline" className="text-xs">
                      {bookingInfo.roomTypeMakkah}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Hotel Madinah */}
            {packageData.hotelMadinah && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Madinah
                    </p>
                    <p className="font-medium">
                      {packageData.hotelMadinah.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({
                        length: packageData.hotelMadinah.rating || 0,
                      }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  {bookingInfo?.roomTypeMadinah && (
                    <Badge variant="outline" className="text-xs">
                      {bookingInfo.roomTypeMadinah}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Rincian Biaya</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Harga Paket</span>
                <span>
                  Rp{" "}
                  {parseFloat(pricing?.hargaPaket || "0").toLocaleString(
                    "id-ID",
                  )}
                </span>
              </div>

              {parseFloat(pricing?.potonganFeeAgen || "0") > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Potongan Agen</span>
                  <span>
                    - Rp{" "}
                    {parseFloat(pricing.potonganFeeAgen).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              )}

              {parseFloat(pricing?.potonganPoinAgen || "0") > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Potongan Poin</span>
                  <span>
                    - Rp{" "}
                    {parseFloat(pricing.potonganPoinAgen).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              )}

              {parseFloat(pricing?.potonganCashbackKK || "0") > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cashback</span>
                  <span>
                    - Rp{" "}
                    {parseFloat(pricing.potonganCashbackKK).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[var(--color-primary)]">
                    Rp{" "}
                    {parseFloat(pricing?.hargaFinal || "0").toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <BottomNav role="JAMAAH" />
    </div>
  );
}
