import type { Metadata } from "next";
import { getCatalogPage, type SortOption } from "@/server/queries/catalog.queries";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";

type SearchParams = {
  q?: string;
  categorie?: string;
  marque?: string;
  prix_min?: string;
  prix_max?: string;
  stock?: string;
  promotion?: string;
  tri?: string;
  page?: string;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Résultats pour « ${q} »` : "Recherche" };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const result = await getCatalogPage({
    q,
    categorySlug: sp.categorie,
    brandSlugs: sp.marque?.split(",").filter(Boolean),
    minPrice: sp.prix_min ? Number(sp.prix_min) : undefined,
    maxPrice: sp.prix_max ? Number(sp.prix_max) : undefined,
    inStockOnly: sp.stock === "1",
    onSaleOnly: sp.promotion === "1",
    sort: (sp.tri as SortOption) ?? "pertinence",
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl text-ink">
        {q ? <>Résultats pour « {q} »</> : "Recherche"}
      </h1>
      <p className="mt-1.5 text-sm text-muted">{result.total} produit{result.total !== 1 ? "s" : ""} trouvé{result.total !== 1 ? "s" : ""}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <CatalogFilters categories={result.categories} brands={result.brands} priceBounds={result.priceBounds} />

        <div>
          {result.products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Aucun résultat"
              description="Vérifiez l'orthographe ou essayez des termes plus généraux."
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination page={result.page} pageCount={result.pageCount} basePath="/recherche" searchParams={sp} />
        </div>
      </div>
    </div>
  );
}
