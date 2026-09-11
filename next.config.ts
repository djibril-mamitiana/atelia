import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed / placeholder product photography (development only) — swap
      // for your own CDN (Cloudinary et al.) before going to production.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
