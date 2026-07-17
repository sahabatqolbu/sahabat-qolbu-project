import AssetFormPage from "@/components/assets/AssetFormPage";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetFormPage assetId={Number(id)} />;
}
