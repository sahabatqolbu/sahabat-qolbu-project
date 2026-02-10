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
    ],
  },
};

module.exports = nextConfig;
