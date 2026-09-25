import { getBestSellers, getPopularCategories } from "@/server/queries/catalog.queries";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ProductSection } from "@/components/product/product-section";
import { Hero } from "@/components/home/hero";
import { ProblemSolution } from "@/components/home/problem-solution";
import { CategoryBento } from "@/components/home/category-bento";
import { Process } from "@/components/home/process";
import { BrandBand } from "@/components/home/brand-band";
import { Guides } from "@/components/home/guides";
import { FaqPreview } from "@/components/home/faq-preview";
import { FinalCta } from "@/components/home/final-cta";

export default async function HomePage() {
  const [bestSellers, categories, guides, referencesCount, brand, t] = await Promise.all([
    getBestSellers(8),
    getPopularCategories(60),
    getPublishedTutorials(),
    db.product.count({ where: { isActive: true } }),
    db.brand.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" }, select: { slug: true } }),
    getTranslations("Home"),
  ]);

  // The tree also holds empty grouping nodes; only families with products
  // are worth a tile, biggest first.
  const families = categories.filter((c) => c._count.products > 0).sort((a, b) => b._count.products - a._count.products);

  return (
    <>
      <Hero referencesCount={referencesCount} guidesCount={guides.length} />
      <ProblemSolution />
      <CategoryBento categories={families} />
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
