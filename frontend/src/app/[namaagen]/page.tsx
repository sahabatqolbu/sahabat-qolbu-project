import { notFound } from "next/navigation";
import AgentLandingPage from "./AgentLandingPage";
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

  return <AgentLandingPage landing={landing} />;
}
