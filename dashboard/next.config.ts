// dashboard/next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**", // ✅ Allow semua path
      },
      {
        protocol: "https",
        hostname: "api.sahabatqolbu.com",
        pathname: "/**",
      },
      // ✅ TAMBAH: Allow external URLs (untuk data lama di database)
      {
        protocol: "https",
        hostname: "**", // Allow semua domain HTTPS
      },
    ],
  },
};

module.exports = nextConfig;
