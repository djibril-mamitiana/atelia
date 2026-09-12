import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

export default withNextIntl(nextConfig);
