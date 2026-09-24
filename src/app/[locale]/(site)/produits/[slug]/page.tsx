import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PlayCircle } from "lucide-react";
import { getProductBySlug } from "@/server/queries/catalog.queries";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartPanel } from "@/components/product/add-to-cart-panel";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductCard } from "@/components/product/product-card";
import { ReviewList } from "@/components/product/review-list";
import { ReviewForm } from "@/components/product/review-form";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/format";
import { SITE_URL } from "@/lib/constants";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    // product.name/shortDescription are already locale-resolved by
    // getProductBySlug — seoTitle/seoDescription are stored once at seed
    // time in German only, so they'd override the localized title/
    // description with stale German text on every other locale.
    title: product.name,
    description: product.shortDescription || undefined,
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const t = await getTranslations("Product");
  const locale = await getLocale();

  const session = await getSession();
  const [isFavorite, canReview] = await Promise.all([
    session
      ? db.favorite.findUnique({ where: { userId_productId: { userId: session.userId, productId: product.id } } }).then(Boolean)
      : Promise.resolve(false),
    session
      ? db.orderItem
          .findFirst({ where: { productId: product.id, order: { userId: session.userId, status: "DELIVERED" } } })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = discountPercent(price, compareAtPrice);

  const media = [
    ...product.images.map((img) => ({ type: "image" as const, url: img.url, alt: img.alt })),
    ...product.videos.map((v) => ({ type: "video" as const, url: v.url, alt: v.title })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand.name },
    offers:
      product.sizes.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: Math.min(...product.sizes.map((sz) => sz.price)).toFixed(2),
            highPrice: Math.max(...product.sizes.map((sz) => sz.price)).toFixed(2),
            offerCount: product.sizes.length,
            availability: product.sizes.some((sz) => sz.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/produits/${product.slug}`,
          }
        : {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: price.toFixed(2),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/produits/${product.slug}`,
          },
    ...(product.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.avgRating), reviewCount: product.reviewCount } }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("home"), item: SITE_URL },
      { "@type": "ListItem", position: 2, name: product.category.name, item: `${SITE_URL}/categories/${product.category.slug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/produits/${product.slug}` },
    ],
  };

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="mb-6 flex gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-ink">{t("home")}</Link> /
        <Link href={`/categories/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link> /
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery media={media} productName={product.name} />

        <div>
          <p className="text-sm uppercase tracking-wide text-muted">{product.brand.name}</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{product.name}</h1>
          {product.sizes.length === 0 && <p className="mt-1 text-xs text-muted">{t("ref", { sku: product.sku })}</p>}

          <div className="mt-3 flex items-center gap-2">
            {product.reviewCount > 0 && (
              <>
                <RatingStars rating={Number(product.avgRating)} />
                <span className="text-sm text-muted">{t("reviewsCount", { count: product.reviewCount })}</span>
              </>
            )}
            {discount && product.sizes.length === 0 && <Badge tone="accent">-{discount}%</Badge>}
          </div>

          <div className="mt-3">
            <FavoriteButton productId={product.id} initialFavorite={isFavorite} />
          </div>

          {compareAtPrice && product.sizes.length === 0 && (
            <p className="mt-4 text-sm text-muted line-through">{formatPrice(compareAtPrice, locale)}</p>
          )}

          <div className="mt-4">
            <AddToCartPanel
              productId={product.id}
              basePrice={price}
              baseStock={product.stock}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, sku: v.sku, priceDelta: Number(v.priceDelta), stock: v.stock }))}
              sizes={product.sizes.map((sz) => ({
                id: sz.id,
                sku: sz.sku,
                sizeLabel: sz.sizeLabel,
                specs: sz.specs,
                price: sz.price,
                compareAtPrice: sz.compareAtPrice,
                stock: sz.stock,
              }))}
              initialSizeId={product.id}
            />
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-3 font-display text-xl text-ink">{t("description")}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.description}</p>
          </section>

          {product.attributes.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl text-ink">{t("specs")}</h2>
              <dl className="divide-y divide-border rounded-md border border-border">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex justify-between gap-4 px-4 py-2.5 text-sm odd:bg-paper/60">
                    <dt className="text-muted">{attr.name}</dt>
                    <dd className="text-right font-medium text-ink">{attr.values.map((v) => v.value).join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {product.tutorials.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl text-ink">{t("relatedTutorials")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {product.tutorials.map((tp) => (
                  <Link key={tp.tutorial.id} href={`/tutoriels/${tp.tutorial.slug}`} className="group flex gap-3 rounded-md border border-border p-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-paper">
                      {tp.tutorial.thumbnailUrl && (
                        <Image src={tp.tutorial.thumbnailUrl} alt="" fill sizes="96px" className="object-cover" />
                      )}
                      <PlayCircle size={20} className="absolute inset-0 m-auto text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-accent-dark">{tp.tutorial.title}</p>
                      <p className="text-xs text-muted">{tp.tutorial.durationMinutes} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-xl text-ink">{t("customerReviews")}</h2>
            <ReviewList reviews={product.reviews} />
          </section>
        </div>

        <div>
          {canReview ? (
            <ReviewForm productId={product.id} />
          ) : (
            <p className="rounded-md border border-border bg-paper/60 p-4 text-sm text-muted">
              {session ? t("reviewGateDelivered") : t("reviewGateLogin")}
            </p>
          )}
        </div>
      </div>

      {product.complementaryTo.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl text-ink">{t("complementary")}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4">
            {product.complementaryTo.map((rel) => (
              <ProductCard key={rel.relatedProduct.id} product={rel.relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {product.relatedFrom.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl text-ink">{t("similar")}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4">
            {product.relatedFrom.map((rel) => (
              <ProductCard key={rel.baseProduct.id} product={rel.baseProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
