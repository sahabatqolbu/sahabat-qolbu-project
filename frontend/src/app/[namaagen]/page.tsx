import AgentLandingFrame from "./AgentLandingFrame";

export async function generateStaticParams() {
  return [{ namaagen: "agen-demo" }];
}

export default async function AgentLandingPage({
  params,
}: {
  params: Promise<{ namaagen: string }>;
}) {
  const { namaagen } = await params;
  return <AgentLandingFrame namaagen={namaagen} />;
}
