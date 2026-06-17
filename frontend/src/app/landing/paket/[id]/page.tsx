import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BookingCard from "@/components/marketing/PackageDetail/BookingCard";
import PackageGallery from "@/components/marketing/PackageDetail/PackageGallery";
import PackageHeader from "@/components/marketing/PackageDetail/PackageHeader";
import PackageTabs from "@/components/marketing/PackageDetail/PackageTabs";
import RelatedPackages from "@/components/marketing/PackageDetail/RelatedPackages";
import { getMarketingPackageById } from "@/lib/public-api";

type Params = Promise<{ id: string }>;

export default async function LandingPackageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pkg = await getMarketingPackageById(id);

  if (!pkg) {
    notFound();
  }

  const gallery =
    pkg.gallery && pkg.gallery.length > 0 ? pkg.gallery : pkg.image ? [pkg.image] : [];

  return (
    <>
      <section className="bg-neutral-50 pb-8 pt-32">
        <div className="container-custom">
          <Link
            href="/landing/paket"
            className="group mb-6 inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Semua Paket</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm text-neutral-600">
            <Link href="/landing" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/landing/paket" className="transition-colors hover:text-primary">
              Paket
            </Link>
            <span>/</span>
            <span className="line-clamp-1 font-semibold text-primary">{pkg.name}</span>
          </nav>
        </div>
      </section>

      <section className="bg-white py-8 md:py-12">
        <div className="container-custom">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <PackageHeader pkg={pkg} />
              <PackageGallery images={gallery} />
              <PackageTabs pkg={pkg} />
            </div>

            <div className="lg:col-span-4">
              <BookingCard pkg={pkg} />
            </div>
          </div>
        </div>
      </section>

      <RelatedPackages
        currentPackageId={pkg.id}
        packageType={pkg.type}
        detailBasePath="/landing/paket"
      />
    </>
  );
}
