import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
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
