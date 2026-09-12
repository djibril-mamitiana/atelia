import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin and /api aren't localized (no /{locale} prefix); /compte
        // and /checkout live under every /{locale}/** storefront route.
        disallow: ["/admin", "/api", "/*/compte", "/*/checkout"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
