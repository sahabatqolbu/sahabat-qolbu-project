import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // ✅ Static Export untuk Shared Hosting
  images: {
    unoptimized: true, // Required untuk static export
  },
  trailingSlash: true, // Optional: untuk SEO
  // Disable server-side features (karena static)
  distDir: "out",
};

export default nextConfig;
