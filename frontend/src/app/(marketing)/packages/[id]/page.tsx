// src/app/(marketing)/packages/[id]/page.tsx
import { notFound } from "next/navigation";
import { getPackageById, mockPackages } from "@/lib/mock-data";
import PackageDetailClient from "./PackageDetailClient";
import type { Metadata } from "next";

export function generateStaticParams() {
  return mockPackages.map((pkg) => ({
    id: pkg.id.toString(),
  }));
}

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const pkg = getPackageById(parseInt(params.id));

  if (!pkg) {
    return {
      title: "Paket Tidak Ditemukan",
    };
  }

  return {
    title: `${pkg.name} - Sahabat Qolbu`,
    description: pkg.description || pkg.name,
  };
}

export default function PackageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const pkg = getPackageById(parseInt(params.id));

  if (!pkg) {
    notFound();
  }

  return <PackageDetailClient pkg={pkg} />;
}
