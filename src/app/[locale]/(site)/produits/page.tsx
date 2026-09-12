import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCatalogPage, type SortOption } from "@/server/queries/catalog.queries";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageSearch } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Catalog");
  return { title: t("allProducts") };
}

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

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const t = await getTranslations("Catalog");

  const result = await getCatalogPage({
    q: sp.q,
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
      <h1 className="font-display text-3xl text-ink">{t("allProducts")}</h1>
      <p className="mt-1.5 text-sm text-muted">{t("productsCount", { count: result.total })}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <CatalogFilters categories={result.categories} brands={result.brands} priceBounds={result.priceBounds} />

        <div>
          {result.products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={t("noResultsTitle")}
              description={t("noResultsDescription")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
              {result.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/produits"
            searchParams={sp}
          />
        </div>
      </div>
    </div>
  );
}
