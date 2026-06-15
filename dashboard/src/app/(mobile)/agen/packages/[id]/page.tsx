// dashboard/src/app/%28mobile%29/agen/packages/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Users,
  Plane,
  Hotel,
  MapPin,
  Star,
  Clock,
  FileText,
  Share2,
  Heart,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Phone,
  Copy,
  ExternalLink,
} from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Image from "next/image";
import { ProfileGuard } from "@/components/agen/ProfileGuard";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

interface PackageImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  caption?: string | null;
  sortOrder?: number;
}

interface PackageDetail {
  id: number;
  code?: string;
  name: string;
  description?: string;
  type: string;
  departureDate?: string;
  returnDate?: string;
  duration?: number;
  totalSeats?: number;
  remainingSeats?: number;
  price?: string | number;
  discountPrice?: string | number;
  discountPercentage?: number;
  isActive?: boolean;
  isPublished?: boolean;
  itineraryPdf?: string;
  notes?: string;
  airline?: {
    id: number;
    name: string;
    code?: string;
    logo?: string;
  };
  hotelMakkah?: {
    id: number;
    name: string;
    starRating: number;
    address?: string;
    distanceToHaram?: string;
  };
  hotelMadinah?: {
    id: number;
    name: string;
    starRating: number;
    address?: string;
    distanceToNabawi?: string;
  };
  departureAirport?: {
    id: number;
    code: string;
    name: string;
    city?: string;
  };
  arrivalAirport?: {
    id: number;
    code: string;
    name: string;
    city?: string;
  };
  images?: PackageImage[];
  facilities?: string[];
  inclusions?: string[];
  exclusions?: string[];
  terms?: string[];
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Fetch package detail
  const { data, isLoading, error } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => agenService.getPackageDetail(packageId),
    enabled: !!packageId,
  });

  const pkg: PackageDetail | null = data?.data?.package || data?.data || null;

  // Image navigation
  const images = pkg?.images || [];
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  const nextImage = () => {
    if (sortedImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
    }
  };

  const prevImage = () => {
    if (sortedImages.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + sortedImages.length) % sortedImages.length
      );
    }
  };

  // Price calculation
  const originalPrice =
    typeof pkg?.price === "string" ? parseFloat(pkg.price) : pkg?.price || 0;
  const discountPrice =
    typeof pkg?.discountPrice === "string"
      ? parseFloat(pkg.discountPrice)
      : pkg?.discountPrice;
  const finalPrice = discountPrice || originalPrice;
  const hasDiscount = discountPrice && discountPrice < originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
    : 0;

  // Duration calculation
  let duration = pkg?.duration;
  if (!duration && pkg?.departureDate && pkg?.returnDate) {
    const departure = new Date(pkg.departureDate);
    const returnD = new Date(pkg.returnDate);
    duration = Math.ceil(
      (returnD.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Seats calculation
  const totalSeats = pkg?.totalSeats || 0;
  const remainingSeats = pkg?.remainingSeats || 0;
  const bookedSeats = totalSeats - remainingSeats;
  const seatsPercentage = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

  // Share function
  const handleShare = async () => {
    const shareText = `${pkg?.name}\n\nHarga: Rp ${finalPrice.toLocaleString(
      "id-ID"
    )}\nKeberangkatan: ${
      pkg?.departureDate
        ? format(new Date(pkg.departureDate), "dd MMMM yyyy", {
            locale: localeId,
          })
        : "-"
    }\n\nHubungi saya untuk info lebih lanjut!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: pkg?.name,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Link berhasil disalin!");
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link berhasil disalin!");
  };

  // Helper function to ensure array
  const ensureArray = (data: unknown): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If it's a comma-separated string
        return data
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  if (isLoading) {
    return (
      <ProfileGuard requireComplete={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      </ProfileGuard>
    );
  }

  if (error || !pkg) {
    return (
      <ProfileGuard requireComplete={true}>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Paket tidak ditemukan
          </h2>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </ProfileGuard>
    );
  }

  return (
    <ProfileGuard requireComplete={true}>
      <div className="min-h-screen bg-gray-50 pb-32 md:max-w-7xl md:px-6 mx-auto">
        {/* Image Gallery */}
        <div className="relative h-64 w-full bg-[var(--color-primary-100)]">
          {sortedImages.length > 0 ? (
            <>
              <Image
                src={getImageUrl(sortedImages[currentImageIndex]?.imageUrl)}
                alt={pkg.name}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Image navigation */}
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {sortedImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)]">
              <FileText className="h-16 w-16 text-[var(--color-primary-300)]" />
            </div>
          )}

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleShare}
              className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full backdrop-blur-sm ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-black/30 hover:bg-black/50 text-white"
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Type Badge */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] font-semibold px-3 py-1">
              {pkg.type}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 -mt-4 relative z-10 space-y-4">
          {/* Main Info Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              {/* Code */}
              {pkg.code && (
                <Badge
                  variant="outline"
                  className="mb-2 bg-[var(--color-primary-50)] text-[var(--color-primary)] border-[var(--color-primary-200)]"
                >
                  {pkg.code}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-xl font-bold text-[var(--color-primary)] leading-tight mb-3">
                {pkg.name}
              </h1>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-3 mb-4">
                {pkg.departureDate && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--color-primary-400)]">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(pkg.departureDate), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </span>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--color-primary-400)]">
                    <Clock className="h-4 w-4" />
                    <span>{duration} Hari</span>
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-gradient-to-r from-[var(--color-primary-50)] to-[var(--color-secondary-50)] rounded-xl p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-primary-400)] mb-1">
                      Harga per orang
                    </p>
                    {hasDiscount && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-400 line-through">
                          Rp {originalPrice.toLocaleString("id-ID")}
                        </span>
                        <Badge className="bg-red-500 text-white text-xs">
                          -{discountPercentage}%
                        </Badge>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-[var(--color-primary)]">
                      Rp {finalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seats Progress */}
              {totalSeats > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--color-primary-400)]" />
                      <span className="text-sm text-[var(--color-primary-400)]">
                        Kursi Tersedia
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        remainingSeats <= 5
                          ? "text-red-500"
                          : "text-[var(--color-primary)]"
                      }`}
                    >
                      {remainingSeats} dari {totalSeats}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[var(--color-primary-100)] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        seatsPercentage > 80
                          ? "bg-red-500"
                          : seatsPercentage > 50
                          ? "bg-[var(--color-secondary)]"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${seatsPercentage}%` }}
                    />
                  </div>
                  {remainingSeats <= 5 && remainingSeats > 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      ⚠️ Hampir habis! Segera booking sekarang
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-[var(--color-primary)]">
                <Calendar className="h-5 w-5 text-[var(--color-secondary)]" />
                Jadwal Perjalanan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 mb-1">Keberangkatan</p>
                  <p className="font-semibold text-green-700">
                    {pkg.departureDate
                      ? format(new Date(pkg.departureDate), "dd MMM yyyy", {
                          locale: localeId,
                        })
                      : "-"}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Kepulangan</p>
                  <p className="font-semibold text-blue-700">
                    {pkg.returnDate
                      ? format(new Date(pkg.returnDate), "dd MMM yyyy", {
                          locale: localeId,
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Airline Card */}
          {pkg.airline && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-[var(--color-primary)]">
                  <Plane className="h-5 w-5 text-[var(--color-secondary)]" />
                  Maskapai Penerbangan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 p-3 bg-[var(--color-primary-50)] rounded-lg">
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Plane className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-primary)]">
                      {pkg.airline.name}
                    </p>
                    {pkg.airline.code && (
                      <p className="text-xs text-[var(--color-primary-400)]">
                        Kode: {pkg.airline.code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Airport Info */}
                {pkg.departureAirport && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-[var(--color-primary-400)]" />
                    <span className="text-[var(--color-primary-400)]">
                      Berangkat dari{" "}
                      <span className="font-semibold text-[var(--color-primary)]">
                        {pkg.departureAirport.name} ({pkg.departureAirport.code}
                        )
                      </span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hotels Card */}
          {(pkg.hotelMakkah || pkg.hotelMadinah) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-[var(--color-primary)]">
                  <Hotel className="h-5 w-5 text-[var(--color-secondary)]" />
                  Akomodasi Hotel
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Hotel Makkah */}
                {pkg.hotelMakkah && (
                  <div className="p-3 bg-[var(--color-primary-50)] rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-primary-400)] mb-1">
                          🕋 Hotel Makkah
                        </p>
                        <p className="font-semibold text-[var(--color-primary)]">
                          {pkg.hotelMakkah.name}
                        </p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({
                            length: pkg.hotelMakkah.starRating,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-[var(--color-secondary)] text-[var(--color-secondary)]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {pkg.hotelMakkah.distanceToHaram && (
                      <p className="text-xs text-[var(--color-primary-400)] mt-2">
                        📍 {pkg.hotelMakkah.distanceToHaram} dari Masjidil Haram
                      </p>
                    )}
                  </div>
                )}

                {/* Hotel Madinah */}
                {pkg.hotelMadinah && (
                  <div className="p-3 bg-[var(--color-primary-50)] rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-primary-400)] mb-1">
                          🕌 Hotel Madinah
                        </p>
                        <p className="font-semibold text-[var(--color-primary)]">
                          {pkg.hotelMadinah.name}
                        </p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({
                            length: pkg.hotelMadinah.starRating,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-[var(--color-secondary)] text-[var(--color-secondary)]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {pkg.hotelMadinah.distanceToNabawi && (
                      <p className="text-xs text-[var(--color-primary-400)] mt-2">
                        📍 {pkg.hotelMadinah.distanceToNabawi} dari Masjid
                        Nabawi
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {pkg.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-[var(--color-primary)]">
                  <FileText className="h-5 w-5 text-[var(--color-secondary)]" />
                  Deskripsi Paket
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-[var(--color-primary-400)] whitespace-pre-line leading-relaxed">
                  {pkg.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Facilities */}
          {(() => {
            const facilitiesArray = ensureArray(pkg.facilities);
            return facilitiesArray.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-[var(--color-primary)]">
                    <Check className="h-5 w-5 text-[var(--color-secondary)]" />
                    Fasilitas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {facilitiesArray.map((facility, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-[var(--color-primary-400)]"
                      >
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}

          {/* Itinerary PDF Download */}
          {pkg.itineraryPdf && (
            <Card>
              <CardContent className="p-4">
                <a
                  href={getImageUrl(pkg.itineraryPdf)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-[var(--color-secondary-50)] rounded-lg hover:bg-[var(--color-secondary-100)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[var(--color-secondary)] rounded-lg flex items-center justify-center">
                      <Download className="h-5 w-5 text-[var(--color-secondary-foreground)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-primary)]">
                        Download Itinerary
                      </p>
                      <p className="text-xs text-[var(--color-primary-400)]">
                        Jadwal perjalanan lengkap (PDF)
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-[var(--color-primary-400)]" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {pkg.notes && (
            <Card className="border-[var(--color-secondary-200)] bg-[var(--color-secondary-50)]">
              <CardContent className="p-4">
                <p className="text-sm text-[var(--color-primary-600)] font-medium mb-1">
                  📝 Catatan:
                </p>
                <p className="text-sm text-[var(--color-primary-400)]">
                  {pkg.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-8 shadow-lg z-20">
          <div className="flex items-center gap-3">
            {/* Copy Link */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="border-[var(--color-primary-200)]"
            >
              <Copy className="h-5 w-5 text-[var(--color-primary)]" />
            </Button>

            {/* Share Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="border-[var(--color-primary-200)]"
            >
              <Share2 className="h-5 w-5 text-[var(--color-primary)]" />
            </Button>

            {/* Main CTA */}
            <Button
              className="flex-1 bg-gradient-to-r from-[var(--color-secondary-600)] to-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:from-[var(--color-secondary-700)] hover:to-[var(--color-secondary-600)] font-semibold h-12"
              onClick={() =>
                router.push(`/agen/jamaah/create?packageId=${pkg.id}`)
              }
              disabled={remainingSeats === 0}
            >
              {remainingSeats === 0 ? (
                "Sold Out"
              ) : (
                <>
                  Daftarkan Jamaah
                  <Users className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}
