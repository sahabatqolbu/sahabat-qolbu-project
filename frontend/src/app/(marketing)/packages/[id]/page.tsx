import { redirect } from "next/navigation";
import { getMarketingPackageById } from "@/lib/public-api";

type Params = Promise<{ id: string }>;

export default async function PackageDetailRedirectPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const pkg = await getMarketingPackageById(id);
  redirect(pkg ? `/landing/paket/${pkg.slug}` : "/landing/paket");
}
