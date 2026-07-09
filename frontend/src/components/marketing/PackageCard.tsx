// src/components/marketing/PackageCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import { getCalonJamaahPackageRegisterUrl } from "@/lib/dashboard-url";

const fallbackImg =
  "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&q=80";

interface PackageCardProps {
  id: number;
  slug: string;
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
  remainingSeats?: number;
  bookingStatus?: "OPEN" | "CLOSED" | "SOLD_OUT" | string;
  bookingStatusLabel?: string;
  isBookable?: boolean;
  daysUntilDeparture?: number;
  image?: string;
  gallery?: string[];
  featured?: boolean;
  description?: string;
  backendType?: string;
}

interface Props {
  pkg: PackageCardProps;
  viewMode?: "grid" | "list";
  detailBasePath?: string;
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return "Jadwal menyusul";

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(start);
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("id-ID", {
      month: "short",
      year: "numeric",
    }).format(start);
    return `${String(start.getDate()).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")} ${monthYear}`;
  }

  const fmt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  });
  const endFmt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${fmt.format(start)} - ${endFmt.format(end)}`;
}

function formatPrice(price?: string) {
  const amount = Number(price);
  if (!price || Number.isNaN(amount) || amount <= 0) return "Harga menyusul";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "");
}

function getDaysUntilDeparture(departureDate?: string) {
  if (!departureDate) return 9999;
  const departure = new Date(departureDate);
  if (Number.isNaN(departure.getTime())) return 9999;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDeparture = new Date(
    departure.getFullYear(),
    departure.getMonth(),
    departure.getDate(),
  );

  return Math.ceil(
    (startOfDeparture.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getPackageAvailability(pkg: PackageCardProps) {
  const remainingSeats =
    pkg.remainingSeats ?? Math.max(pkg.totalSeats - pkg.bookedSeats, 0);
  const daysUntilDeparture =
    pkg.daysUntilDeparture ?? getDaysUntilDeparture(pkg.departureDate);
  const status = String(pkg.bookingStatus || "").toUpperCase();

  if (status === "SOLD_OUT" || remainingSeats <= 0) {
    return {
      isBookable: false,
      label: "Sold Out",
      badgeClass: "bg-red-600 text-white",
      buttonLabel: "Sold Out",
    };
  }

  if (status === "CLOSED" || daysUntilDeparture <= 7) {
    return {
      isBookable: false,
      label:
        pkg.bookingStatusLabel ||
        (daysUntilDeparture < 0 ? "Sudah Berangkat" : "Paket Tutup"),
      badgeClass: "bg-slate-900 text-white",
      buttonLabel: "Paket Tutup",
    };
  }

  return {
    isBookable: pkg.isBookable !== false,
    label: "",
    badgeClass: "",
    buttonLabel: "Daftar Paket",
  };
}

export default function PackageCard({ pkg, detailBasePath = "/paket" }: Props) {
  const branding = useBranding();
  const [currentSlide, setCurrentSlide] = useState(0);

  const images =
    pkg.gallery && pkg.gallery.length > 0
      ? pkg.gallery
      : [pkg.image || fallbackImg];
  const hasMultiple = images.length > 1;

  // Map package raw type to tipeList IDs
  const rawType = pkg.backendType || "";
  let label = "REGULER";
  let labelColor = "bg-primary text-white";

  if (rawType === "FULL_SERVICE") {
    label = "REGULER";
    labelColor = "bg-primary text-white";
  } else if (rawType === "EXTREME") {
    label = "EXTREME";
    labelColor = "bg-gold text-primary";
  } else if (rawType === "SEMI_MANDIRI") {
    label = "SEMI MANDIRI";
    labelColor = "bg-orange-500 text-white";
  } else if (rawType === "FLEKSIBILITAS") {
    label = "FLEKSIBEL";
    labelColor = "bg-purple-600 text-white";
  } else if (rawType === "KONSORSIUM") {
    label = "KONSORSIUM";
    labelColor = "bg-blue-500 text-white";
  } else if (rawType === "LA") {
    label = "LAND ARRANGEMENT";
    labelColor = "bg-emerald-600 text-white";
  } else {
    // fallback mapping using pkg.type
    if (pkg.type === "UMRAH_PLUS") {
      label = "UMRAH PLUS";
      labelColor = "bg-blue-600 text-white";
    } else if (pkg.type === "UMRAH_RAMADHAN") {
      label = "FLEKSIBEL";
      labelColor = "bg-purple-600 text-white";
    }
  }

  const detailLink = `${detailBasePath}/${pkg.slug}`;
  const registerLink = getCalonJamaahPackageRegisterUrl(pkg.slug);
  const availability = getPackageAvailability(pkg);
  const displayPrice = formatPrice(
    pkg.priceQuad || pkg.priceTriple || pkg.priceDouble,
  );
  const waMessage = `Halo, saya lihat di website sahabatqolbu.com dan tertarik paket *${pkg.name}*`;
  const waLink = `https://wa.me/${branding.whatsappNumber || "6281255871984"}?text=${encodeURIComponent(waMessage)}`;

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const setSlide = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(index);
  };

  return (
    <div
      className={cn(
        "paket-card group flex h-full flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300",
        pkg.featured && "ring-2 ring-gold",
      )}
      data-tipe={rawType.toLowerCase()}
    >
      <div
        className={cn("relative overflow-hidden", hasMultiple ? "mb-3" : "")}
      >
        {/* Slider */}
        <div className="swiper aspect-square border-b border-gray-100">
          <div
            className="track flex transition-transform duration-300 ease-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {images.map((img, i) => (
              <div className="slide flex-shrink-0 w-full h-full" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-full object-contain"
                  draggable="false"
                />
              </div>
            ))}
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="arrow arrow-prev absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 z-10 opacity-0 group-hover:opacity-100 shadow-md transition-all cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="arrow arrow-next absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 z-10 opacity-0 group-hover:opacity-100 shadow-md transition-all cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div className="dots absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={setSlide(i)}
                    className={cn(
                      "dot w-2 h-2 rounded-full transition-all cursor-pointer",
                      i === currentSlide ? "bg-primary w-5" : "bg-gray-300",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span
            className={cn(
              labelColor,
              "text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg",
            )}
          >
            {label}
          </span>
        </div>

        {hasMultiple && (
          <div className="absolute top-3 right-3 z-20 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {images.length}
          </div>
        )}

        {!availability.isBookable && (
          <div
            className={cn(
              "absolute right-3 top-3 z-30 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-lg",
              availability.badgeClass,
              hasMultiple && "top-10",
            )}
          >
            {availability.label}
          </div>
        )}
      </div>

      <div className="p-4 pt-3 flex flex-col flex-1">
        <h3 className="font-bold text-primary text-lg leading-tight mb-2 min-h-[3rem] line-clamp-2">
          {pkg.name}
        </h3>

        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Harga Mulai
          </p>
          <p className="text-xl font-extrabold leading-tight text-primary">
            {displayPrice}
          </p>
          {displayPrice !== "Harga menyusul" ? (
            <p className="text-xs text-gray-500">per jamaah</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <svg
            className="w-4 h-4 text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDateRange(pkg.departureDate, pkg.returnDate)}</span>
          <span className="text-gray-300">•</span>
          <span>{pkg.duration ? `${pkg.duration} Hari` : "-"}</span>
        </div>

        <div className="mb-4 space-y-2 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
          <div className="grid grid-cols-[92px_1fr] gap-2">
            <span className="text-gray-500">Hotel Makkah</span>
            <span className="font-semibold text-primary line-clamp-1">
              {pkg.hotelMakkah?.name || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[92px_1fr] gap-2">
            <span className="text-gray-500">Hotel Madinah</span>
            <span className="font-semibold text-primary line-clamp-1">
              {pkg.hotelMadinah?.name || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[92px_1fr] gap-2">
            <span className="text-gray-500">Maskapai</span>
            <span className="font-semibold text-primary line-clamp-1">
              {pkg.airline?.name || "-"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link
            href={detailLink}
            className="js-package-detail-link flex items-center justify-center w-full border border-primary bg-white text-primary hover:bg-primary hover:text-white font-semibold py-3 rounded-md transition-colors text-center text-sm"
          >
            Detail
          </Link>
          {availability.isBookable ? (
            <a
              href={registerLink}
              className="js-package-register-link flex items-center justify-center w-full bg-primary hover:bg-secondary text-white hover:text-primary font-semibold py-3 rounded-md transition-colors text-center text-sm"
            >
              Daftar Paket
            </a>
          ) : (
            <span className="flex items-center justify-center w-full bg-gray-200 text-gray-500 font-semibold py-3 rounded-md text-center text-sm cursor-not-allowed">
              {availability.buttonLabel}
            </span>
          )}
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="js-package-wa-link mt-2 flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md transition-colors text-center text-sm"
        >
          Tanya via WhatsApp
        </a>
      </div>
    </div>
  );
}
