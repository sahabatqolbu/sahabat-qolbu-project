import type { NextRequest } from "next/server";
import {
  getMarketingPackageBySlug,
  getMarketingPackageItinerarySourceBySlug,
} from "@/lib/public-api";

type Params = Promise<{ slug: string }>;

const SAFE_ITINERARY_ORIGIN = "https://api.sahabatqolbu.com";
const SAFE_ITINERARY_PREFIX = "/uploads/itinerary/";

const getSafeFilename = (slug: string) =>
  `${slug || "itinerary"}-sahabat-qolbu.pdf`.replace(/[^a-z0-9.-]+/gi, "-");

export async function GET(
  _request: NextRequest,
  { params }: { params: Params },
) {
  const { slug } = await params;
  const pkg = await getMarketingPackageBySlug(slug);

  if (!pkg?.itineraryPdf) {
    return new Response("Itinerary tidak ditemukan.", { status: 404 });
  }

  const itinerarySource = await getMarketingPackageItinerarySourceBySlug(slug);
  if (!itinerarySource) {
    return new Response("Itinerary tidak ditemukan.", { status: 404 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(itinerarySource);
  } catch {
    return new Response("URL itinerary tidak valid.", { status: 400 });
  }

  if (
    sourceUrl.origin !== SAFE_ITINERARY_ORIGIN ||
    !sourceUrl.pathname.startsWith(SAFE_ITINERARY_PREFIX)
  ) {
    return new Response("Sumber itinerary tidak diizinkan.", { status: 403 });
  }

  const upstream = await fetch(sourceUrl.toString(), {
    cache: "no-store",
    headers: { Accept: "application/pdf" },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Itinerary tidak dapat dibuka.", { status: 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="${getSafeFilename(pkg.slug || slug)}"`,
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
