import { getBestSellers, getFamilyPreviewImages, getPopularCategories, getSpecialBandItems } from "@/server/queries/catalog.queries";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { CLEANER_CATEGORY_SLUG } from "@/lib/constants";
import { ProductSection } from "@/components/product/product-section";
import { Hero } from "@/components/home/hero";
import { ProblemSolution } from "@/components/home/problem-solution";
import { SpecialBand } from "@/components/home/special-band";
import { CategoryBento } from "@/components/home/category-bento";
import { Process } from "@/components/home/process";
import { BrandBand } from "@/components/home/brand-band";
import { Guides } from "@/components/home/guides";
import { FaqPreview } from "@/components/home/faq-preview";
import { FinalCta } from "@/components/home/final-cta";

/** Max. tiles in "Parcourir par usage" (one big + three rows of four). */
const MAX_FAMILY_TILES = 13;

export default async function HomePage() {
  const [bestSellers, categories, guides, referencesCount, brand, cleanerCategory, specialItems, t] = await Promise.all([
    getBestSellers(8),
    getPopularCategories(60),
    getPublishedTutorials(),
    db.product.count({ where: { isActive: true } }),
    db.brand.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" }, select: { slug: true } }),
    db.category.findUnique({
      where: { slug: CLEANER_CATEGORY_SLUG },
      select: { isActive: true, videoUrl: true, products: { where: { isActive: true }, orderBy: { sizeOrder: "asc" }, take: 1, select: { slug: true } } },
    }),
    getSpecialBandItems(),
    getTranslations("Home"),
  ]);

  // The tree also holds empty grouping nodes; only families with products (or
  // a photo gallery) are worth a tile — in the admin's order (Catégories → Ordre).
  const families = categories.filter((c) => c._count.products > 0 || c.photos > 0).slice(0, MAX_FAMILY_TILES);
  const previews = await getFamilyPreviewImages(families.map((f) => f.id));

  const cleaner =
    cleanerCategory?.isActive && cleanerCategory.videoUrl
      ? { videoUrl: cleanerCategory.videoUrl, productHref: cleanerCategory.products[0] ? `/produits/${cleanerCategory.products[0].slug}` : null }
      : null;

  return (
    <>
      <Hero referencesCount={referencesCount} guidesCount={guides.length} cleaner={cleaner} />
      <SpecialBand items={specialItems} />
      <ProblemSolution />
      <CategoryBento categories={families.map((f) => ({ ...f, previews: previews.get(f.id) ?? [] }))} />
      <ProductSection
        eyebrow={t("bestSellersEyebrow")}
        title={t("bestSellers")}
        subtitle={t("bestSellersSubtitle")}
        href="/produits?tri=note"
        products={bestSellers}
      />
      <Process />
      <BrandBand brandSlug={brand?.slug ?? null} />
      <Guides guides={guides.slice(0, 3)} />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
