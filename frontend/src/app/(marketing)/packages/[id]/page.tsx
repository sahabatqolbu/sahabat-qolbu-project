import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function PackageDetailRedirectPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  redirect(`/landing/paket/${encodeURIComponent(id)}`);
}
