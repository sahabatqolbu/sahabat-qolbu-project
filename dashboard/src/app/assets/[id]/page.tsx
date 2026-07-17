import AssetDetailPage from "@/components/assets/AssetDetailPage";

export default async function AssetDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailPage assetId={Number(id)} />;
}
