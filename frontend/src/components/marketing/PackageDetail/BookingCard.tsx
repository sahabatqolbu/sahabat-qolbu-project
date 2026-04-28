// src/components/marketing/PackageDetail/BookingCard.tsx
"use client";

import { MessageCircle, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MarketingPackage } from "@/lib/public-api";

interface Props {
  pkg: MarketingPackage;
}

export default function BookingCard({ pkg }: Props) {
  const whatsappLink = `https://wa.me/6282121453311?text=${encodeURIComponent(`Saya tertarik dengan ${pkg.name}`)}`;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="rounded-3xl border-4 border-neutral-100 bg-white p-6 shadow-xl">
        <div className="mb-6">
          <p className="mb-2 text-sm text-neutral-500">Harga per orang</p>
          <p className="font-display text-4xl font-black text-primary">
            {formatCurrency(parseInt(pkg.priceQuad, 10))}
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-4 font-bold text-white hover:bg-green-600"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Pesan via WhatsApp</span>
          </a>

          <a
            href="tel:+622122866671"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white hover:bg-primary-600"
          >
            <Phone className="h-5 w-5" />
            <span>Hubungi Telepon</span>
          </a>
        </div>
      </div>
    </div>
  );
}
