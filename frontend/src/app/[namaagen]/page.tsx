import { notFound, redirect } from "next/navigation";
import { getPublicAgentLanding } from "@/lib/public-api";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ namaagen: string }>;
}) {
  const { namaagen } = await params;
  const landing = await getPublicAgentLanding(namaagen);

  if (!landing) {
    notFound();
  }

  redirect(`/landing/?agent=${encodeURIComponent(namaagen)}`);
}
