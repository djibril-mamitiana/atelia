import Image from "next/image";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/server/queries/admin.queries";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Pagination } from "@/components/catalog/pagination";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Produits — Admin" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const { products, total, pageCount } = await getAdminProducts({ q, page: page ? Number(page) : 1 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Produits ({total})</h1>
        <LinkButton href="/admin/products/new" size="sm">
          <Plus size={15} /> Nouveau produit
        </LinkButton>
      </div>

      <div className="mt-4">
        <AdminSearchBar placeholder="Nom ou SKU…" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Marque</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="flex items-center gap-2.5 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-paper">
                    {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{p.sku}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{p.category.name}</td>
                <td className="px-4 py-3 text-muted">{p.brand.name}</td>
                <td className="px-4 py-3 text-ink">{formatPrice(Number(p.price))}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? (
                    <Badge tone="danger">Rupture</Badge>
                  ) : p.stock <= p.lowStockThreshold ? (
                    <Badge tone="gold">{p.stock} — faible</Badge>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.isActive ? "sage" : "neutral"}>{p.isActive ? "Actif" : "Inactif"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <ProductRowActions id={p.id} isActive={p.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/admin/products" searchParams={{ q }} />
    </div>
  );
}
