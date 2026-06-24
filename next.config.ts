import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Parent folder has pnpm-lock.yaml; pin root to this app so routes resolve correctly.
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/exhibitor/tourist-attractions",
        destination: "/tourist-attractions",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
