// dashboard/src/app/(mobile)/agen/packages/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Loader2, Calendar, Users, Clock } from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Image from "next/image";
import { ProfileGuard } from "@/components/agen/ProfileGuard";
import { getImageUrl } from "@/lib/utils";

interface PackageImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  caption?: string | null;
  sortOrder?: number;
}

interface PackageData {
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
  images?: PackageImage[];
}

const getTypeBadgeStyle = (type: string) => {
  switch (type?.toUpperCase()) {
    case "EXTREME":
      return "bg-gradient-to-r from-red-500 to-orange-500 text-white";
    case "PREMIUM":
      return "bg-gradient-to-r from-amber-500 to-yellow-500 text-white";
    case "VIP":
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    case "REGULAR":
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    default:
      return "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]";
  }
};

export default function PackagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: () => agenService.getPackages(),
  });

  const packages: PackageData[] = data?.data?.packages || [];

  const filteredPackages = packages.filter(
    (pkg: PackageData) =>
      pkg && pkg.name && pkg.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProfileGuard requireComplete={true}>
      {/* ✅ FIX: Tambah overflow-x-hidden di root container */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-24 md:max-w-7xl md:px-6 mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] text-white p-6 pb-10 rounded-b-[2.5rem] shadow-xl sticky top-0 z-10 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Paket Tersedia</h1>
                  <p className="text-sm text-white/70">
                    {filteredPackages.length} paket umroh & haji
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                placeholder="Cari paket..."
                className="pl-12 h-12 bg-white/15 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-2xl focus:bg-white/20 focus:border-white/40 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ✅ FIX: Content wrapper dengan overflow hidden */}
        <div className="px-3 -mt-5 relative z-10 overflow-hidden">
          {/* Loading */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-secondary)]/20 rounded-full animate-ping" />
                <div className="relative bg-white p-4 rounded-full shadow-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                </div>
              </div>
              <p className="mt-4 text-[var(--color-primary-400)] font-medium">
                Memuat paket...
              </p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-[var(--color-primary-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-[var(--color-primary-300)]" />
                </div>
                <p className="text-[var(--color-primary)] font-semibold text-lg mb-1">
                  {search ? "Paket tidak ditemukan" : "Belum ada paket"}
                </p>
                <p className="text-[var(--color-primary-400)] text-sm">
                  {search
                    ? "Coba kata kunci lain"
                    : "Paket akan segera tersedia"}
                </p>
              </CardContent>
            </Card>
          ) : (
            /* ✅ FIX: Grid dengan width constraint */
            <div className="grid grid-cols-2 gap-2 w-full">
              {filteredPackages.map((pkg: PackageData, index: number) => {
                if (!pkg || !pkg.name) return null;

                const totalSeats = pkg.totalSeats || 0;
                const remainingSeats = pkg.remainingSeats || 0;
                const bookedSeats = totalSeats - remainingSeats;
                const seatsPercentage =
                  totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

                const primaryImage = pkg.images?.find((img) => img.isPrimary);
                const displayImage = primaryImage || pkg.images?.[0];

                const originalPrice =
                  typeof pkg.price === "string"
                    ? parseFloat(pkg.price)
                    : pkg.price || 0;
                const discountPrice =
                  typeof pkg.discountPrice === "string"
                    ? parseFloat(pkg.discountPrice)
                    : pkg.discountPrice;
                const finalPrice = discountPrice || originalPrice;
                const hasDiscount =
                  discountPrice && discountPrice < originalPrice;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((originalPrice - discountPrice) / originalPrice) * 100
                    )
                  : 0;

                let duration = pkg.duration;
                if (!duration && pkg.departureDate && pkg.returnDate) {
                  const departure = new Date(pkg.departureDate);
                  const returnD = new Date(pkg.returnDate);
                  duration = Math.ceil(
                    (returnD.getTime() - departure.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                }

                const isAlmostFull = seatsPercentage > 80;
                const isSoldOut = remainingSeats === 0;

                return (
                  /* ✅ FIX: Card dengan min-w-0 untuk prevent overflow */
                  <Card
                    key={pkg.id}
                    className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group min-w-0 ${
                      isSoldOut ? "opacity-75" : ""
                    }`}
                    onClick={() => router.push(`/agen/packages/${pkg.id}`)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {displayImage ? (
                        <Image
                          src={getImageUrl(displayImage.imageUrl)}
                          alt={pkg.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary-200)] via-[var(--color-primary-100)] to-[var(--color-secondary-100)] flex items-center justify-center">
                          <Package className="h-8 w-8 text-[var(--color-primary-300)]" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Type Badge */}
                      <div className="absolute top-1.5 left-1.5">
                        <Badge
                          className={`${getTypeBadgeStyle(
                            pkg.type
                          )} font-semibold text-[9px] px-1.5 py-0.5 shadow-sm`}
                        >
                          {pkg.type}
                        </Badge>
                      </div>

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-1.5 right-1.5">
                          <Badge className="bg-red-500 text-white font-bold text-[9px] px-1 py-0.5 shadow-sm">
                            -{discountPercent}%
                          </Badge>
                        </div>
                      )}

                      {/* Bottom Info */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 flex-wrap">
                        {pkg.departureDate && (
                          <span className="inline-flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5 text-white text-[8px]">
                            <Calendar className="h-2 w-2" />
                            {format(new Date(pkg.departureDate), "dd MMM", {
                              locale: localeId,
                            })}
                          </span>
                        )}
                        {duration && (
                          <span className="inline-flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5 text-white text-[8px]">
                            <Clock className="h-2 w-2" />
                            {duration}H
                          </span>
                        )}
                      </div>

                      {/* Sold Out */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                            SOLD OUT
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-2">
                      {/* Title */}
                      <h3 className="font-semibold text-[11px] text-[var(--color-primary)] leading-tight line-clamp-2 mb-1.5 min-h-[28px]">
                        {pkg.name}
                      </h3>

                      {/* Price */}
                      <div className="mb-1.5">
                        {hasDiscount && (
                          <p className="text-[9px] text-gray-400 line-through leading-none">
                            {(originalPrice / 1000000).toFixed(1)}jt
                          </p>
                        )}
                        <p className="text-sm font-bold text-[var(--color-primary)] leading-none">
                          <span className="text-[10px] font-normal">Rp</span>{" "}
                          {(finalPrice / 1000000).toFixed(1)}
                          <span className="text-[10px] font-medium">jt</span>
                        </p>
                      </div>

                      {/* Seats */}
                      {totalSeats > 0 && !isSoldOut && (
                        <div>
                          <div
                            className={`flex items-center gap-0.5 text-[9px] mb-0.5 ${
                              isAlmostFull ? "text-red-600" : "text-gray-500"
                            }`}
                          >
                            <Users className="h-2.5 w-2.5" />
                            <span>{remainingSeats} sisa</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isAlmostFull
                                  ? "bg-red-500"
                                  : seatsPercentage > 50
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${seatsPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}
