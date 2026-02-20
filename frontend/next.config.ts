import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: isProduction ? "export" : undefined,
  images: {
    unoptimized: isProduction,
  },
  trailingSlash: isProduction,
  distDir: isProduction ? "out" : undefined,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/landing", destination: "/landing/index.html" },
        { source: "/landing/", destination: "/landing/index.html" },
        { source: "/landing/paket", destination: "/landing/paket.html" },
        { source: "/landing/paket/", destination: "/landing/paket.html" },
      ],
    };
  },
};

export default nextConfig;
