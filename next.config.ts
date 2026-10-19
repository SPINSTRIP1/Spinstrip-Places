import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  // Only the merchant dashboard may embed these pages (its preview modal). Blocks clickjacking
  // of the checkouts on any other site. Extra origins: NEXT_PUBLIC_DASHBOARD_ORIGINS (comma-separated).
  async headers() {
    const origins = [
      "https://merchant.spinstrip.com",
      "http://localhost:3000",
      "http://localhost:3001",
      ...(process.env.NEXT_PUBLIC_DASHBOARD_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
    ];
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: `frame-ancestors 'self' ${origins.join(" ")}` }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "spin-strip.sfo3.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
