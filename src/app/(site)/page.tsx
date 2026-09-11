import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PlayCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ProductSection } from "@/components/product/product-section";
import {
  getBestSellers,
  getNewProducts,
  getPromotedProducts,
  getPopularCategories,
  getActiveBrands,
} from "@/server/queries/catalog.queries";
import { getPublishedTutorials } from "@/server/queries/tutorials.queries";
import { SITE_TAGLINE } from "@/lib/constants";

export default async function HomePage() {
  const [bestSellers, newProducts, promoted, categories, brands, tutorials] = await Promise.all([
    getBestSellers(8),
    getNewProducts(8),
    getPromotedProducts(8),
    getPopularCategories(12),
    getActiveBrands(10),
    getPublishedTutorials(3),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="container-page relative flex min-h-[420px] flex-col items-start justify-center gap-6 py-16 lg:min-h-[560px] lg:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-accent-soft">Bricolage · Jardin · Maison</p>
          <h1 className="max-w-xl font-display text-4xl leading-tight text-white lg:text-6xl">{SITE_TAGLINE}</h1>
          <p className="max-w-md text-base text-white/70 lg:text-lg">
            Des produits de qualité, des conseils et des tutoriels pour vous accompagner, du premier coup de
            perceuse à la touche finale.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/produits" size="lg">
              Découvrir les produits <ArrowRight size={17} />
            </LinkButton>
            <LinkButton href="/tutoriels" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              <PlayCircle size={17} /> Voir les tutoriels
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="container-page py-12 lg:py-16">
        <h2 className="mb-7 font-display text-2xl text-ink lg:text-3xl">Nos univers</h2>
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
                <p className="text-xs text-white/70">{cat._count.products} produits</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title="Meilleures ventes" subtitle="Les produits préférés de nos clients" href="/produits?tri=note" products={bestSellers} />

      <section className="bg-accent-soft">
        <ProductSection title="Promotions en cours" subtitle="Profitez de nos meilleures offres" href="/produits?promotion=1" products={promoted} />
      </section>

      <ProductSection title="Nouveautés" subtitle="Les derniers produits arrivés en catalogue" href="/produits?tri=nouveaute" products={newProducts} />

      {/* Tutorials */}
      {tutorials.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-page py-12 lg:py-16">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-ink lg:text-3xl">Conseils &amp; tutoriels</h2>
                <p className="mt-1.5 text-sm text-muted">Réussissez vos projets pas à pas, avec le bon matériel.</p>
              </div>
              <Link href="/tutoriels" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-accent-dark hover:underline sm:flex">
                Tous les tutoriels <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {tutorials.map((t) => (
                <Link key={t.id} href={`/tutoriels/${t.slug}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-paper">
                    {t.thumbnailUrl && (
                      <Image src={t.thumbnailUrl} alt={t.title} fill sizes="33vw" className="object-cover transition-transform group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
                      <PlayCircle size={38} className="text-white" strokeWidth={1.3} />
                    </div>
                  </div>
                  <p className="font-medium text-ink group-hover:text-accent-dark">{t.title}</p>
                  <p className="line-clamp-2 text-sm text-muted">{t.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container-page py-12">
          <h2 className="mb-7 font-display text-2xl text-ink lg:text-3xl">Nos marques</h2>
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
