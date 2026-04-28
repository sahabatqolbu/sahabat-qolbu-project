import { notFound } from "next/navigation";
import PackageDetailClient from "./PackageDetailClient";
import { getMarketingPackageById } from "@/lib/public-api";

type Params = Promise<{ id: string }>;

export default async function PackageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pkg = await getMarketingPackageById(id);

  if (!pkg) {
    notFound();
  }

  return <PackageDetailClient pkg={pkg} />;
}
