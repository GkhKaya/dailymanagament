import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent browser devtools from downloading or reconstructing TypeScript source code in production
  productionBrowserSourceMaps: false,

  // Hide server framework signature
  poweredByHeader: false,

  // Remove console statements in production to avoid leaking internal data or variables
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
  },

  // Comprehensive HTTP Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Clickjacking protection
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // MIME sniffing protection
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // HSTS
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none';", // Anti-framing CSP
          },
        ],
      },
    ];
  },
};

export default nextConfig;

