import { Sparkles } from "lucide-react";
import PackageCard from "../PackageCard";
import { getMarketingPackages } from "@/lib/public-api";

interface Props {
  currentPackageId: number;
  packageType: string;
  detailBasePath?: string;
}

export default async function RelatedPackages({
  currentPackageId,
  packageType,
  detailBasePath = "/landing/paket",
}: Props) {
  const data = await getMarketingPackages();
  const relatedPackages = data
    .filter((pkg) => pkg.id !== currentPackageId)
    .filter((pkg) => pkg.type === packageType)
    .slice(0, 3);

  if (relatedPackages.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-14">
      <div className="container-custom">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2">
              <Sparkles className="h-4 w-4 text-secondary-700" />
              <span className="text-sm font-black text-primary">Paket Lainnya</span>
            </div>
            <h2 className="font-display text-3xl font-black text-primary">
              Paket Umroh Serupa
            </h2>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {relatedPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} detailBasePath={detailBasePath} />
          ))}
        </div>
      </div>
    </section>
  );
}
