// dashboard/src/app/(dashboard)/admin/packages/[id]/page.tsx
"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { packageService } from "@/services/packageService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { getImageUrl, PACKAGE_TYPE_LABELS, getTypeBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Edit,
  Plane,
  Building2,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  CreditCard,
  Image as ImageIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PageProps) {
  const { id: packageId } = use(params);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isFinanceReadOnly = user?.role === "FINANCE";

  const { data, isLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => packageService.getById(parseInt(packageId)),
  });

  const pkg = data?.data;

  // Format Currency
  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "PLANNING":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Planning
          </Badge>
        );
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "UNPAID":
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Days Badge
  const getDaysBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="secondary">Sudah Lewat</Badge>;
    } else if (days <= 14) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          H-{days}
        </Badge>
      );
    } else if (days <= 45) {
      return <Badge className="bg-yellow-100 text-yellow-800">H-{days}</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">H-{days}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paket tidak ditemukan</p>
        <Link href="/admin/packages">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  const bookedSeats = pkg.bookedSeats || 0;
  const remainingSeats = pkg.remainingSeats || pkg.totalSeats;
  const seatPercentage = (bookedSeats / pkg.totalSeats) * 100;

  // Calculate rooms total
  const hotelMakkahRooms =
    (pkg.hotelMakkahDouble || 0) +
    (pkg.hotelMakkahTriple || 0) +
    (pkg.hotelMakkahQuad || 0) +
    (pkg.hotelMakkahQuint || 0);

  const hotelMadinahRooms =
    (pkg.hotelMadinahDouble || 0) +
    (pkg.hotelMadinahTriple || 0) +
    (pkg.hotelMadinahQuad || 0) +
    (pkg.hotelMadinahQuint || 0);

  // Calculate airline payment
  const termin1 = parseFloat(pkg.airlineTermin1Amount) || 0;
  const termin2 = parseFloat(pkg.airlineTermin2Amount) || 0;
  const totalAirlinePayment = termin1 + termin2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/packages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500 font-mono">
                {pkg.code}
              </span>
              <Badge className={getTypeBadge(pkg.type)}>
                {PACKAGE_TYPE_LABELS[pkg.type] || pkg.type}
              </Badge>
              {pkg.isActive ? (
                <Badge className="bg-green-100 text-green-800">Aktif</Badge>
              ) : (
                <Badge variant="secondary">Nonaktif</Badge>
              )}
              {pkg.isPublished && (
                <Badge className="bg-blue-100 text-blue-800">Published</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              {pkg.name}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/packages/${packageId}/itinerary`}>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" />
              Itinerary
            </Button>
          </Link>
          {!isFinanceReadOnly && (
            <Link href={`/admin/packages/${packageId}/edit`}>
              <Button className="bg-secondary hover:bg-secondary/90">
                <Edit className="h-4 w-4 mr-2" />
                Edit Paket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Seat */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Seat</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">
              {bookedSeats}/{pkg.totalSeats}
            </p>
            <Progress value={seatPercentage} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              Sisa: {remainingSeats} seat
            </p>
          </CardContent>
        </Card>

        {/* H-Day */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Countdown</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {pkg.daysUntilDeparture || 0}
              </p>
              <span className="text-gray-500">Hari</span>
            </div>
            {getDaysBadge(pkg.daysUntilDeparture || 0)}
          </CardContent>
        </Card>

        {/* Harga */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Harga</span>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            {pkg.discountPrice && (
              <p className="text-sm text-gray-400 line-through">
                {formatCurrency(pkg.price)}
              </p>
            )}
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(pkg.discountPrice || pkg.price)}
            </p>
          </CardContent>
        </Card>

        {/* Durasi */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Durasi</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{pkg.duration} Hari</p>
            <p className="text-xs text-gray-500 mt-1">
              {pkg.departureDate &&
                format(new Date(pkg.departureDate), "dd MMM", {
                  locale: localeId,
                })}
              {" - "}
              {pkg.returnDate &&
                format(new Date(pkg.returnDate), "dd MMM yyyy", {
                  locale: localeId,
                })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Maskapai */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Maskapai
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.airline ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Plane className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{pkg.airline.name}</p>
                        <p className="text-sm text-gray-500">
                          {pkg.airline.code}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(pkg.airlineStatus)}
                  </div>

                  {pkg.airlineIssuedDate && (
                    <div className="text-sm">
                      <span className="text-gray-500">Issued Date:</span>{" "}
                      <span className="font-medium">
                        {format(
                          new Date(pkg.airlineIssuedDate),
                          "dd MMM yyyy",
                          { locale: localeId }
                        )}
                      </span>
                    </div>
                  )}

                  {/* Payment Info */}
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pembayaran Maskapai
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Termin 1</p>
                        <p className="font-semibold">
                          {formatCurrency(termin1)}
                        </p>
                        {pkg.airlineTermin1Date && (
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(pkg.airlineTermin1Date),
                              "dd MMM yyyy"
                            )}
                          </p>
                        )}
                        <div className="mt-1">
                          {getStatusBadge(pkg.airlineTermin1Status)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Termin 2</p>
                        <p className="font-semibold">
                          {formatCurrency(termin2)}
                        </p>
                        {pkg.airlineTermin2Date && (
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(pkg.airlineTermin2Date),
                              "dd MMM yyyy"
                            )}
                          </p>
                        )}
                        <div className="mt-1">
                          {getStatusBadge(pkg.airlineTermin2Status)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(totalAirlinePayment)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Belum ada maskapai
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hotels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel Makkah */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Hotel Makkah
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pkg.hotelMakkah ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{pkg.hotelMakkah.name}</p>
                      {getStatusBadge(pkg.hotelMakkahStatus)}
                    </div>
                    <p className="text-sm text-yellow-500">
                      {"⭐".repeat(pkg.hotelMakkah.starRating || 0)}
                    </p>
                    <Separator />
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        Jumlah Kamar: {hotelMakkahRooms}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <span>Double: {pkg.hotelMakkahDouble || 0}</span>
                        <span>Triple: {pkg.hotelMakkahTriple || 0}</span>
                        <span>Quad: {pkg.hotelMakkahQuad || 0}</span>
                        <span>Quint: {pkg.hotelMakkahQuint || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada</p>
                )}
              </CardContent>
            </Card>

            {/* Hotel Madinah */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Hotel Madinah
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pkg.hotelMadinah ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{pkg.hotelMadinah.name}</p>
                      {getStatusBadge(pkg.hotelMadinahStatus)}
                    </div>
                    <p className="text-sm text-yellow-500">
                      {"⭐".repeat(pkg.hotelMadinah.starRating || 0)}
                    </p>
                    <Separator />
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        Jumlah Kamar: {hotelMadinahRooms}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <span>Double: {pkg.hotelMadinahDouble || 0}</span>
                        <span>Triple: {pkg.hotelMadinahTriple || 0}</span>
                        <span>Quad: {pkg.hotelMadinahQuad || 0}</span>
                        <span>Quint: {pkg.hotelMadinahQuint || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {pkg.description && (
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{pkg.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Fasilitas */}
          {pkg.facilities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fasilitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700">
                  {pkg.facilities}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keterangan */}
          {pkg.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Keterangan Tambahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700">
                  {pkg.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Images & Info */}
        <div className="space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Gambar Brosur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.images && pkg.images.length > 0 ? (
                <div className="space-y-3">
                  {pkg.images.map((image: any, index: number) => (
                    <div key={image.id} className="relative">
                      <img
                        src={getImageUrl(image.imageUrl)} // ✅ TAMBAHIN getImageUrl()
                        alt={`Brosur ${index + 1}`}
                        className="w-full object-cover rounded-lg"
                        onError={(e) => {
                          // ✅ FALLBACK kalo error
                          console.error("❌ Image load error:", image.imageUrl);
                          e.currentTarget.src =
                            "https://via.placeholder.com/400x200?text=Image+Not+Found";
                        }}
                      />
                      {image.isPrimary && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          Utama
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada gambar</p>
                  <Link href={`/admin/packages/${packageId}/edit?tab=images`}>
                    <Button variant="link" size="sm" className="mt-2">
                      Upload Gambar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bandara */}
          {pkg.departureAirport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Bandara Keberangkatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{pkg.departureAirport.name}</p>
                <p className="text-sm text-gray-500">
                  {pkg.departureAirport.code} - {pkg.departureAirport.city}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/admin/packages/${packageId}/itinerary`}
                className="block"
              >
                <Button variant="outline" className="w-full justify-start">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Lihat Itinerary
                </Button>
              </Link>
              {!isFinanceReadOnly && (
                <Link
                  href={`/admin/packages/${packageId}/edit`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Paket
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Users className="h-4 w-4 mr-2" />
                Lihat Jamaah ({bookedSeats})
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
