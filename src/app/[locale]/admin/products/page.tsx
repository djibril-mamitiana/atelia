import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
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
  const t = await getTranslations("Admin.Products");
  const locale = await getLocale();
  const { q, page } = await searchParams;
  const { products, total, pageCount } = await getAdminProducts({ q, page: page ? Number(page) : 1 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">{t("title", { count: total })}</h1>
        <LinkButton href="/admin/products/new" size="sm">
          <Plus size={15} /> {t("newProduct")}
        </LinkButton>
      </div>

      <div className="mt-4">
        <AdminSearchBar placeholder={t("searchPlaceholder")} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colProduct")}</th>
              <th className="px-4 py-3">{t("colCategory")}</th>
              <th className="px-4 py-3">{t("colBrand")}</th>
              <th className="px-4 py-3">{t("colPrice")}</th>
              <th className="px-4 py-3">{t("colStock")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
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
                <td className="px-4 py-3 text-ink">{formatPrice(Number(p.price), locale)}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? (
                    <Badge tone="danger">{t("outOfStock")}</Badge>
                  ) : p.stock <= p.lowStockThreshold ? (
                    <Badge tone="gold">{t("lowStock", { stock: p.stock })}</Badge>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.isActive ? "sage" : "neutral"}>{p.isActive ? t("active") : t("inactive")}</Badge>
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
