"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import { formatPrice, discountPercent } from "@/lib/format";
import { addToCartAction } from "@/server/actions/cart.actions";
import { toggleFavoriteAction } from "@/server/actions/favorite.actions";
import { useToast } from "@/components/ui/toast";
import type { ProductCard as ProductCardData } from "@/server/queries/catalog.queries";

export function ProductCard({
  product,
  isFavorite = false,
  className,
}: {
  product: ProductCardData;
  isFavorite?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(isFavorite);

  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = discountPercent(price, compareAtPrice);
  const outOfStock = product.stock <= 0;
  const image = product.images[0];

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addToCartAction(product.id, 1);
      toast(result.success ? "Ajouté au panier." : result.error, result.success ? "success" : "error");
    });
  }

  function handleToggleFavorite() {
    setFavorite((f) => !f); // optimistic
    startTransition(async () => {
      const result = await toggleFavoriteAction(product.id);
      if (!result.success) {
        setFavorite((f) => !f); // revert
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-paper">
        <Link href={`/produits/${product.slug}`} className="block h-full w-full">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted text-sm">Photo indisponible</div>
          )}
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.isNew && <Badge tone="sage">Nouveau</Badge>}
          {product.isBestSeller && <Badge tone="gold">Meilleure vente</Badge>}
          {discount && <Badge tone="accent">-{discount}%</Badge>}
          {outOfStock && <Badge tone="danger">Rupture</Badge>}
        </div>

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={favorite}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink-soft shadow-sm transition-colors hover:text-accent"
        >
          <Heart size={17} className={favorite ? "fill-accent text-accent" : ""} />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted">{product.brand.name}</p>
        <Link href={`/produits/${product.slug}`} className="line-clamp-2 text-sm font-medium text-ink hover:text-accent-dark">
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <RatingStars rating={Number(product.avgRating)} size={12} />
            <span className="text-xs text-muted">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="text-sm text-muted line-through">{formatPrice(compareAtPrice)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || pending}
          className={cn(
            "mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
            "bg-ink text-white hover:bg-ink-soft disabled:opacity-40"
          )}
        >
          <ShoppingCart size={15} />
          {outOfStock ? "Indisponible" : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}
