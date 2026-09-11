import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getFavoriteProducts } from "@/server/queries/catalog.queries";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const session = await requireUser("/compte/favoris");
  const products = await getFavoriteProducts(session.userId);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Aucun favori pour le moment"
        description="Ajoutez des produits à vos favoris pour les retrouver facilement."
        action={<LinkButton href="/produits" className="mt-2">Découvrir les produits</LinkButton>}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Mes favoris</h1>
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} isFavorite />
        ))}
      </div>
    </div>
  );
}
