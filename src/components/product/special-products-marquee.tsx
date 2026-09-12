import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/server/queries/catalog.queries";

/**
 * Slowly, continuously auto-scrolling strip of featured ("produits
 * spéciaux") products — distinct from the fixed bottom `PromoTicker`.
 * Pauses on hover (`.marquee-track:hover`, globals.css) so items stay
 * clickable.
 */
export async function SpecialProductsMarquee({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  const t = await getTranslations("SpecialProducts");
  const items = [...products, ...products];

  return (
    <section className="overflow-hidden border-y border-border bg-accent-soft py-10">
      <div className="container-page mb-6">
        <h2 className="font-display text-2xl text-ink lg:text-3xl">{t("title")}</h2>
        <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="marquee-track marquee-slow flex w-max gap-5 px-4 sm:px-6">
        {items.map((product, i) => {
          const image = product.images[0];
          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/produits/${product.slug}`}
              className="group flex w-44 shrink-0 flex-col gap-2 rounded-md border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:w-52"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? product.name}
                    fill
                    sizes="208px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">Photo indisponible</div>
                )}
              </div>
              <p className="line-clamp-2 text-sm font-medium text-ink group-hover:text-accent-dark">{product.name}</p>
              <p className="text-sm font-semibold text-ink">{formatPrice(Number(product.price))}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
