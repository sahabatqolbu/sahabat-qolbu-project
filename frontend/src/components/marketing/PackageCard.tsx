// src/components/marketing/PackageCard.tsx
"use client";

import Link from "next/link";
import {
  Calendar,
  Users,
  Plane,
  Hotel,
  Star,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface PackageCardProps {
  id: number;
  code: string;
  name: string;
  type: "UMRAH" | "UMRAH_PLUS" | "UMRAH_RAMADHAN";
  duration: number;
  departureDate: string;
  returnDate: string;
  airline: { name: string; logo?: string };
  hotelMakkah: {
    name: string;
    starRating: number;
    distanceToHaram?: string;
    facilities?: string[];
  };
  hotelMadinah?: {
    name: string;
    starRating: number;
    distanceToMasjid?: string;
    facilities?: string[];
  };
  priceQuad: string;
  priceTriple?: string;
  priceDouble: string;
  totalSeats: number;
  bookedSeats: number;
  image?: string;
  gallery?: string[];
  featured?: boolean;
  description?: string;
}

interface Props {
  pkg: PackageCardProps;
  viewMode?: "grid" | "list";
}

export default function PackageCard({ pkg, viewMode = "grid" }: Props) {
  const availability =
    ((pkg.totalSeats - pkg.bookedSeats) / pkg.totalSeats) * 100;
  const seatsLeft = pkg.totalSeats - pkg.bookedSeats;

  // Type labels
  const typeLabels = {
    UMRAH: "Umroh Reguler",
    UMRAH_RAMADHAN: "Umroh Ramadhan",
    UMRAH_PLUS: "Umroh Plus",
  };

  // Type colors
  const typeColors = {
    UMRAH: "bg-primary text-white",
    UMRAH_RAMADHAN: "bg-purple-600 text-white",
    UMRAH_PLUS: "bg-blue-600 text-white",
  };

  if (viewMode === "list") {
    return <PackageCardList pkg={pkg} />;
  }

  return (
    <article className="group bg-white rounded-3xl overflow-hidden border-4 border-neutral-100 hover:border-secondary shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-primary to-primary-700 flex-shrink-0">
        {pkg.image ? (
          <div
            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${pkg.image})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hotel className="w-20 h-20 text-white/30" />
          </div>
        )}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-start gap-2">
          {pkg.featured && (
            <div className="bg-secondary text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">TERPOPULER</span>
              <span className="sm:hidden">TOP</span>
            </div>
          )}
          <div
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs shadow-lg ml-auto backdrop-blur-sm",
              typeColors[pkg.type]
            )}
          >
            <span className="hidden sm:inline">{typeLabels[pkg.type]}</span>
            <span className="sm:hidden">
              {pkg.type === "UMRAH_PLUS"
                ? "Plus"
                : pkg.type === "UMRAH_RAMADHAN"
                ? "Ramadhan"
                : "Reguler"}
            </span>
          </div>
        </div>

        {/* Seats Left Badge - Bottom Left */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
          <div
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs backdrop-blur-sm shadow-lg inline-flex items-center gap-1.5",
              seatsLeft <= 5
                ? "bg-error text-white"
                : seatsLeft <= 10
                ? "bg-warning text-white"
                : "bg-success text-white"
            )}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">
              {seatsLeft} Seat <span className="hidden xs:inline">Tersisa</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Title - Fixed height with clamp */}
        <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-primary mb-3 sm:mb-4 group-hover:text-secondary transition-colors line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]">
          {pkg.name}
        </h3>

        {/* Info Grid - Compact */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5 flex-1">
          {/* Duration */}
          <div className="flex items-center gap-2 sm:gap-3 text-neutral-700">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <span className="font-semibold text-sm sm:text-base truncate">
              {pkg.duration} Hari
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 sm:gap-3 text-neutral-700">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <span className="font-semibold text-xs sm:text-sm truncate">
              {formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}
            </span>
          </div>

          {/* Airline */}
          <div className="flex items-center gap-2 sm:gap-3 text-neutral-700">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <span className="font-semibold text-sm sm:text-base truncate">
              {pkg.airline.name}
            </span>
          </div>

          {/* Hotels */}
          <div className="flex items-start gap-2 sm:gap-3 text-neutral-700">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {/* Makkah Hotel */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm truncate">
                  {pkg.hotelMakkah.name}
                </span>
                <div className="flex flex-shrink-0">
                  {[...Array(pkg.hotelMakkah.starRating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-secondary text-secondary"
                    />
                  ))}
                </div>
              </div>

              {/* Madinah Hotel */}
              {pkg.hotelMadinah && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm truncate">
                    {pkg.hotelMadinah.name}
                  </span>
                  <div className="flex flex-shrink-0">
                    {[...Array(pkg.hotelMadinah.starRating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-secondary text-secondary"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Availability Bar */}
        <div className="mb-4 sm:mb-5">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-600 mb-2">
            <span>Ketersediaan</span>
            <span className="text-primary">{Math.round(availability)}%</span>
          </div>
          <div className="h-2.5 sm:h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                availability <= 20
                  ? "bg-error"
                  : availability <= 50
                  ? "bg-warning"
                  : "bg-success"
              )}
              style={{ width: `${availability}%` }}
            />
          </div>
        </div>

        {/* Price Section */}
        <div className="pt-4 sm:pt-5 border-t-2 border-neutral-100 mt-auto">
          <div className="mb-4 sm:mb-5">
            <p className="text-xs text-neutral-500 font-semibold mb-1.5 sm:mb-2">
              Mulai dari
            </p>
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="font-display font-black text-2xl sm:text-3xl text-primary">
                {formatCurrency(parseFloat(pkg.priceQuad))}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 line-through font-semibold">
                {formatCurrency(parseFloat(pkg.priceDouble))}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-semibold mt-1">
              per orang (quad)
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href={`/packages/${pkg.id}`}
            className="group/btn w-full bg-secondary hover:bg-secondary-600 text-primary font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border-3 border-secondary-700 text-sm sm:text-base"
          >
            <span>Lihat Detail</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// LIST VIEW COMPONENT
function PackageCardList({ pkg }: { pkg: PackageCardProps }) {
  const availability =
    ((pkg.totalSeats - pkg.bookedSeats) / pkg.totalSeats) * 100;
  const seatsLeft = pkg.totalSeats - pkg.bookedSeats;

  const typeLabels = {
    UMRAH: "Umroh Reguler",
    UMRAH_RAMADHAN: "Umroh Ramadhan",
    UMRAH_PLUS: "Umroh Plus",
  };

  return (
    <article className="group bg-white rounded-3xl overflow-hidden border-4 border-neutral-100 hover:border-secondary shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col sm:flex-row">
      {/* Image - Left Side */}
      <div className="relative sm:w-72 md:w-80 lg:w-96 h-56 sm:h-auto overflow-hidden bg-gradient-to-br from-primary to-primary-700 flex-shrink-0">
        {pkg.image ? (
          <div
            className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${pkg.image})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hotel className="w-20 h-20 text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 space-y-2">
          {pkg.featured && (
            <div className="bg-secondary text-primary px-4 py-2 rounded-xl font-black text-xs shadow-lg inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>TERPOPULER</span>
            </div>
          )}
          <div className="bg-white/95 backdrop-blur-sm text-primary px-4 py-2 rounded-xl font-bold text-xs shadow-lg inline-block">
            {typeLabels[pkg.type]}
          </div>
        </div>

        {/* Seats */}
        <div className="absolute bottom-4 left-4">
          <div
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-sm shadow-lg inline-flex items-center gap-2",
              seatsLeft <= 5
                ? "bg-error text-white"
                : seatsLeft <= 10
                ? "bg-warning text-white"
                : "bg-success text-white"
            )}
          >
            <Users className="w-4 h-4" />
            <span>{seatsLeft} Seat Tersisa</span>
          </div>
        </div>
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 p-6 flex flex-col min-w-0">
        {/* Title */}
        <h3 className="font-display font-bold text-xl md:text-2xl text-primary mb-4 group-hover:text-secondary transition-colors line-clamp-2">
          {pkg.name}
        </h3>

        {/* Info Grid - 2 columns on larger screens */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5 flex-1">
          {/* Duration */}
          <div className="flex items-center gap-3 text-neutral-700">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-semibold">Durasi</p>
              <p className="font-bold text-sm truncate">{pkg.duration} Hari</p>
            </div>
          </div>

          {/* Airline */}
          <div className="flex items-center gap-3 text-neutral-700">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-semibold">Maskapai</p>
              <p className="font-bold text-sm truncate">{pkg.airline.name}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 text-neutral-700 sm:col-span-2">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 font-semibold">
                Keberangkatan
              </p>
              <p className="font-bold text-sm truncate">
                {formatDate(pkg.departureDate)} - {formatDate(pkg.returnDate)}
              </p>
            </div>
          </div>

          {/* Hotel */}
          <div className="flex items-start gap-3 text-neutral-700 sm:col-span-2">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Hotel className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500 font-semibold mb-1">
                Hotel
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">
                    {pkg.hotelMakkah.name}
                  </span>
                  <div className="flex flex-shrink-0">
                    {[...Array(pkg.hotelMakkah.starRating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-secondary text-secondary"
                      />
                    ))}
                  </div>
                </div>
                {pkg.hotelMadinah && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">
                      {pkg.hotelMadinah.name}
                    </span>
                    <div className="flex flex-shrink-0">
                      {[...Array(pkg.hotelMadinah.starRating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-secondary text-secondary"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-600 mb-2">
            <span>Ketersediaan</span>
            <span className="text-primary">{Math.round(availability)}%</span>
          </div>
          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                availability <= 20
                  ? "bg-error"
                  : availability <= 50
                  ? "bg-warning"
                  : "bg-success"
              )}
              style={{ width: `${availability}%` }}
            />
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-5 border-t-2 border-neutral-100 mt-auto">
          <div>
            <p className="text-xs text-neutral-500 font-semibold mb-1">
              Mulai dari
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-primary">
                {formatCurrency(parseFloat(pkg.priceQuad))}
              </span>
              <span className="text-sm text-neutral-500 line-through font-semibold">
                {formatCurrency(parseFloat(pkg.priceDouble))}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-semibold mt-0.5">
              per orang (quad)
            </p>
          </div>

          <Link
            href={`/packages/${pkg.id}`}
            className="group/btn bg-secondary hover:bg-secondary-600 text-primary font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border-3 border-secondary-700 whitespace-nowrap"
          >
            <span>Lihat Detail</span>
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
