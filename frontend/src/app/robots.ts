import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/register",
          "/api/",
          "/preview/",
          "/*?agent=*",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Applebot-Extended",
          "Bytespider",
          "cohere-ai",
        ],
        allow: [
          "/",
          "/paket",
          "/paket/*",
          "/artikel",
          "/artikel/*",
          "/tentang-kami",
          "/faq",
          "/hotel/*",
          "/maskapai/*",
          "/llms.txt",
        ],
        disallow: [
          "/login",
          "/register",
          "/api/",
          "/preview/",
        ],
      },
    ],
    sitemap: "https://sahabatqolbu.com/sitemap.xml",
    host: "https://sahabatqolbu.com",
  };
}
