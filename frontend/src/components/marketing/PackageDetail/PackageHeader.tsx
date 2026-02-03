// src/components/marketing/PackageDetail/PackageHeader.tsx
"use client";

import { Package } from "@/lib/mock-data";
import { Clock, Calendar, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  pkg: Package;
}

export default function PackageHeader({ pkg }: Props) {
  const seatsLeft = pkg.totalSeats - pkg.bookedSeats;

  return (
    <div className="mb-8">
      {/* Title */}
      <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-primary mb-4">
        {pkg.name}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-neutral-700 mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" />
          <span className="font-semibold">{pkg.duration} Hari</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          <span className="font-semibold text-sm">
            {formatDate(pkg.departureDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          <span
            className={cn(
              "font-bold",
              seatsLeft <= 5 ? "text-error" : "text-success"
            )}
          >
            {seatsLeft} Seat Tersisa
          </span>
        </div>
      </div>
    </div>
  );
}
