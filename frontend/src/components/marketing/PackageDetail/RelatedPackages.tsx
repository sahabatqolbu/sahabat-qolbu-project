// src/components/marketing/PackageDetail/RelatedPackages.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import PackageCard from "../PackageCard";
import { getMarketingPackages } from "@/lib/public-api";

interface Props {
  currentPackageId: number;
  packageType: string;
}

export default function RelatedPackages({
  currentPackageId,
  packageType,
}: Props) {
  const { data } = useQuery({
    queryKey: ["public-packages", "related", currentPackageId, packageType],
    queryFn: () => getMarketingPackages(),
    staleTime: 5 * 60 * 1000,
  });

  const relatedPackages = (data || [])
    .filter((pkg) => pkg.id !== currentPackageId)
    .filter((pkg) => pkg.type === packageType)
    .slice(0, 3);

  if (relatedPackages.length === 0) {
    return null;
  }

  return (
    <section className="bg-neutral-50 py-16">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <span className="font-bold text-primary">Paket Lainnya</span>
          </div>
          <h2 className="font-display text-3xl font-black text-primary">
            Paket Umroh Serupa
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {relatedPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}
