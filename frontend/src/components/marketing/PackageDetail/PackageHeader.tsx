// src/components/marketing/PackageDetail/PackageHeader.tsx
"use client";

import { Calendar, Clock, Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { MarketingPackage } from "@/lib/public-api";

interface Props {
  pkg: MarketingPackage;
}

export default function PackageHeader({ pkg }: Props) {
  const seatsLeft = Math.max(pkg.totalSeats - pkg.bookedSeats, 0);

  return (
    <div className="mb-8">
      <h1 className="mb-4 font-display text-3xl font-black text-primary sm:text-4xl md:text-5xl">
        {pkg.name}
      </h1>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-neutral-700">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          <span className="font-semibold">{pkg.duration} Hari</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-secondary" />
          <span className="text-sm font-semibold">
            {formatDate(pkg.departureDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-secondary" />
          <span
            className={cn(
              "font-bold",
              seatsLeft <= 5 ? "text-error" : "text-success",
            )}
          >
            {seatsLeft} Seat Tersisa
          </span>
        </div>
      </div>
    </div>
  );
}
