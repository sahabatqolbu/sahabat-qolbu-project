// src/components/marketing/PackageDetail/BookingCard.tsx
"use client";

import { Package } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";

interface Props {
  pkg: Package;
}

export default function BookingCard({ pkg }: Props) {
  const whatsappLink = `https://wa.me/6282121453311?text=Saya tertarik dengan ${pkg.name}`;

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-white border-4 border-neutral-100 rounded-3xl p-6 shadow-xl">
        {/* Price */}
        <div className="mb-6">
          <p className="text-sm text-neutral-500 mb-2">Harga per orang</p>
          <p className="font-display font-black text-4xl text-primary">
            {formatCurrency(parseInt(pkg.priceQuad))}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-success hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Pesan via WhatsApp</span>
          </a>

          <a
            href="tel:+622122866671"
            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            <span>Hubungi Telepon</span>
          </a>
        </div>
      </div>
    </div>
  );
}
