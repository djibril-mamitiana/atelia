import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/produits`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/tutoriels`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/faq`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Falls back to the static routes alone if the database is unreachable
  // (e.g. DATABASE_URL not yet configured, or a transient outage during a
  // build) rather than failing the whole build.
  try {
    const [products, categories, tutorials] = await Promise.all([
      db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.tutorial.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((p) => ({ url: `${SITE_URL}/produits/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...categories.map((c) => ({ url: `${SITE_URL}/categories/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
      ...tutorials.map((t) => ({ url: `${SITE_URL}/tutoriels/${t.slug}`, lastModified: t.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    ];
  } catch (err) {
    console.error("sitemap: database unavailable, returning static routes only", err);
    return staticRoutes;
  }
}
