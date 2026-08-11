import type { MetadataRoute } from "next";
import {
  getMarketingPackages,
  getPublicArticles,
} from "@/lib/public-api";

const BASE_URL = "https://sahabatqolbu.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, articles] = await Promise.all([
    getMarketingPackages(),
    getPublicArticles("limit=500"),
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

  return [...staticPages, ...packagePages, ...articlePages];
}
