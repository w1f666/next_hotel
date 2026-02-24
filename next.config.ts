import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img95.699pic.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
