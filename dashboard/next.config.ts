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
  async redirects() {
    return [
      {
        source: "/staff/reports",
        destination: "/staff",
        permanent: false,
      },
      {
        source: "/staff/reports/:path*",
        destination: "/staff",
        permanent: false,
      },
      {
        source: "/staff/transactions",
        destination: "/staff",
        permanent: false,
      },
      {
        source: "/staff/transactions/:path*",
        destination: "/staff",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      // STAFF alias -> read/write pages that are staff-allowed
      { source: "/staff/users/:path*", destination: "/admin/users/:path*" },
      { source: "/staff/packages/:path*", destination: "/admin/packages/:path*" },
      { source: "/staff/jamaah/:path*", destination: "/admin/jamaah/:path*" },
      { source: "/staff/agen/:path*", destination: "/admin/agen/:path*" },
      { source: "/staff/master/:path*", destination: "/admin/master/:path*" },
      { source: "/staff/content/:path*", destination: "/admin/content/:path*" },

      // FINANCE alias -> finance-visible admin pages
      { source: "/finance/users/:path*", destination: "/admin/users/:path*" },
      { source: "/finance/packages/:path*", destination: "/admin/packages/:path*" },
      { source: "/finance/jamaah/:path*", destination: "/admin/jamaah/:path*" },
      { source: "/finance/agen/:path*", destination: "/admin/agen/:path*" },
      { source: "/finance/transactions/:path*", destination: "/admin/transactions/:path*" },
      { source: "/finance/reports/:path*", destination: "/admin/reports/:path*" },
    ];
  },
};

module.exports = nextConfig;
