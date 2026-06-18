import LandingPackageDetailPage, {
  generateMetadata,
  generateStaticParams,
  viewport,
} from "@/app/landing/paket/[slug]/page";

export const dynamicParams = true;
export const revalidate = 600;

export { generateMetadata, generateStaticParams, viewport };

export default LandingPackageDetailPage;
