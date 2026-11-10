import type { MetadataRoute } from "next";
import {
  entitySlug,
  getAllPublicArticles,
  getMarketingPackages,
} from "@/lib/public-api";

const BASE_URL = "https://sahabatqolbu.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, articles] = await Promise.all([
    getMarketingPackages(),
    getAllPublicArticles(),
  ]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/paket`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tentang-kami`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/artikel`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/kebijakan-privasi`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const packagePages: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: `${BASE_URL}/paket/${encodeURIComponent(pkg.slug)}`,
    lastModified: pkg.updatedAt || pkg.createdAt || now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/artikel/${encodeURIComponent(article.slug)}`,
    lastModified: article.publishedAt || article.createdAt || now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const hotelMap = new Map<string, MetadataRoute.Sitemap[number]>();
  const airlineMap = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const pkg of packages) {
    if (pkg.airline?.id && pkg.airline?.name) {
      const slug = entitySlug(pkg.airline.name, pkg.airline.id);
      airlineMap.set(slug, {
        url: `${BASE_URL}/maskapai/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    if (pkg.hotelMakkah?.id && pkg.hotelMakkah?.name) {
      const slug = entitySlug(pkg.hotelMakkah.name, pkg.hotelMakkah.id);
      hotelMap.set(slug, {
        url: `${BASE_URL}/hotel/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    if (pkg.hotelMadinah?.id && pkg.hotelMadinah?.name) {
      const slug = entitySlug(pkg.hotelMadinah.name, pkg.hotelMadinah.id);
      hotelMap.set(slug, {
        url: `${BASE_URL}/hotel/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return [
    ...staticPages,
    ...packagePages,
    ...articlePages,
    ...Array.from(hotelMap.values()),
    ...Array.from(airlineMap.values()),
  ];
}
