// src/app/(marketing)/packages/[id]/PackageDetailClient.tsx
"use client";

import { Package } from "@/lib/mock-data";
import PackageGallery from "@/components/marketing/PackageDetail/PackageGallery";
import BookingCard from "@/components/marketing/PackageDetail/BookingCard";
import PackageTabs from "@/components/marketing/PackageDetail/PackageTabs";
import PackageHeader from "@/components/marketing/PackageDetail/PackageHeader";
import RelatedPackages from "@/components/marketing/PackageDetail/RelatedPackages";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  pkg: Package;
}

export default function PackageDetailClient({ pkg }: Props) {
  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-neutral-50 pt-32 pb-8">
        <div className="container-custom">
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 text-primary hover:text-secondary font-semibold transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Semua Paket</span>
          </Link>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-neutral-600">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link
              href="/packages"
              className="hover:text-primary transition-colors"
            >
              Paket
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold line-clamp-1">
              {pkg.name}
            </span>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-8">
              {/* Header Info */}
              <PackageHeader pkg={pkg} />

              {/* Gallery */}
              <PackageGallery images={pkg.gallery || [pkg.image]} />

              {/* Tabs Content */}
              <PackageTabs pkg={pkg} />
            </div>

            {/* Right Sidebar - Booking Card */}
            <div className="lg:col-span-4">
              <BookingCard pkg={pkg} />
            </div>
          </div>
        </div>
      </section>

      {/* Related Packages */}
      <RelatedPackages currentPackageId={pkg.id} packageType={pkg.type} />
    </>
  );
}
