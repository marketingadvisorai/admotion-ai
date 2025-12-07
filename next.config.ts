import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ljicjarnhbybgaxbnuhi.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      // Allow brand kit assets from optimized external sites
      {
        protocol: "https",
        hostname: "optimalescape.com",
      },
      {
        protocol: "https",
        hostname: "www.optimalescape.com",
      },
    ],
  },
};

export default nextConfig;
