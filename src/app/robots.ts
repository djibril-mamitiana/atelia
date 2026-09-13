import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api isn't localized (no /{locale} prefix); /admin, /compte and
        // /checkout all live under every /{locale}/** route now.
        disallow: ["/api", "/*/admin", "/*/compte", "/*/checkout"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
