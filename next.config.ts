import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
