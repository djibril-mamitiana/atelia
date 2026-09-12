import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductSection } from "@/components/product/product-section";
import { SpecialProductsMarquee } from "@/components/product/special-products-marquee";
import {
  getBestSellers,
  getNewProducts,
  getPromotedProducts,
  getPopularCategories,
  getActiveBrands,
  getFeaturedProducts,
} from "@/server/queries/catalog.queries";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";

export default async function HomePage() {
  const [bestSellers, newProducts, promoted, categories, brands, tutorials, featured, t] = await Promise.all([
    getBestSellers(8),
    getNewProducts(8),
    getPromotedProducts(8),
    getPopularCategories(12),
    getActiveBrands(10),
    getPublishedTutorials(3),
    getFeaturedProducts(12),
    getTranslations("Home"),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="container-page relative flex min-h-[420px] flex-col items-start justify-center gap-6 py-16 lg:min-h-[560px] lg:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-accent-soft">{t("heroKicker")}</p>
          <h1 className="max-w-xl font-display text-4xl leading-tight text-white lg:text-6xl">{t("heroTitle")}</h1>
          <p className="max-w-md text-base text-white/70 lg:text-lg">{t("heroSubtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/produits" size="lg">
              {t("discoverProducts")} <ArrowRight size={17} />
            </LinkButton>
            <LinkButton href="/tutoriels" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              <PlayCircle size={17} /> {t("viewTutorials")}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="container-page py-12 lg:py-16">
        <h2 className="mb-7 font-display text-2xl text-ink lg:text-3xl">{t("ourCategories")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-md bg-paper"
            >
              {cat.imageUrl && (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="relative z-10 p-4">
                <p className="font-medium text-white">{cat.name}</p>
                <p className="text-xs text-white/70">{t("productsCount", { count: cat._count.products })}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SpecialProductsMarquee products={featured} />

      <ProductSection title={t("bestSellers")} subtitle={t("bestSellersSubtitle")} href="/produits?tri=note" products={bestSellers} />

      <section className="bg-accent-soft">
        <ProductSection
          title={t("currentPromotions")}
          subtitle={t("currentPromotionsSubtitle")}
          href="/produits?promotion=1"
          products={promoted}
        />
      </section>

      <ProductSection title={t("newProducts")} subtitle={t("newProductsSubtitle")} href="/produits?tri=nouveaute" products={newProducts} />

      {/* Tutorials */}
      {tutorials.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-page py-12 lg:py-16">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink lg:text-3xl">{t("tutorialsTitle")}</h2>
                <p className="mt-1.5 text-sm text-muted">{t("tutorialsSubtitle")}</p>
              </div>
              <Link href="/tutoriels" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-accent-dark hover:underline sm:flex">
                {t("allTutorials")} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {tutorials.map((tutorial) => (
                <Link key={tutorial.id} href={`/tutoriels/${tutorial.slug}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-paper">
                    {tutorial.thumbnailUrl && (
                      <Image
                        src={tutorial.thumbnailUrl}
                        alt={tutorial.title}
                        fill
                        sizes="33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                      <PlayCircle size={38} className="text-white" strokeWidth={1.3} />
                    </div>
                  </div>
                  <p className="font-medium text-ink group-hover:text-accent-dark">{tutorial.title}</p>
                  <p className="line-clamp-2 text-sm text-muted">{tutorial.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container-page py-12">
          <h2 className="mb-7 font-display text-2xl text-ink lg:text-3xl">{t("ourBrands")}</h2>
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/produits?marque=${b.slug}`}
                className="flex aspect-[3/2] items-center justify-center rounded-md border border-border bg-surface px-3 text-center text-sm font-medium text-ink-soft hover:border-border-strong"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
