import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/produits", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tutoriels", changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/faq", changeFrequency: "yearly", priority: 0.3 },
];

// URL segments (slugs) aren't translated, only the /{locale} prefix — so
// every route gets one sitemap entry per locale, cross-linked via
// `alternates.languages` for hreflang.
function localizedEntries(
  path: string,
  changeFrequency: ChangeFrequency,
  priority: number,
  lastModified?: Date
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_ROUTES.flatMap((r) => localizedEntries(r.path, r.changeFrequency, r.priority));

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
      ...staticEntries,
      ...products.flatMap((p) => localizedEntries(`/produits/${p.slug}`, "weekly", 0.6, p.updatedAt)),
      ...categories.flatMap((c) => localizedEntries(`/categories/${c.slug}`, "weekly", 0.5, c.updatedAt)),
      ...tutorials.flatMap((t) => localizedEntries(`/tutoriels/${t.slug}`, "monthly", 0.4, t.updatedAt)),
    ];
  } catch (err) {
    console.error("sitemap: database unavailable, returning static routes only", err);
    return staticEntries;
  }
}
