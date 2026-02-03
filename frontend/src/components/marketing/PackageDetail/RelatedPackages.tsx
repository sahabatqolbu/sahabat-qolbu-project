// src/components/marketing/PackageDetail/RelatedPackages.tsx
"use client";

import { mockPackages } from "@/lib/mock-data";
import PackageCard from "../PackageCard";
import { Sparkles } from "lucide-react";

interface Props {
  currentPackageId: number;
  packageType: string;
}

export default function RelatedPackages({ currentPackageId }: Props) {
  const relatedPackages = mockPackages
    .filter((pkg) => pkg.id !== currentPackageId)
    .slice(0, 3);

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 px-6 py-3 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-secondary" />
            <span className="text-primary font-bold">Paket Lainnya</span>
          </div>
          <h2 className="font-display font-black text-3xl text-primary">
            Paket Umroh Serupa
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}
