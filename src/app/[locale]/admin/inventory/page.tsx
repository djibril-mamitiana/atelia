import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminInventory } from "@/server/queries/admin.queries";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { InventoryRow } from "@/components/admin/inventory-row";
import { Pagination } from "@/components/catalog/pagination";

export const metadata: Metadata = { title: "Stocks — Admin" };

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const t = await getTranslations("Admin.Inventory");
  const { q, page } = await searchParams;
  const { products, total, pageCount } = await getAdminInventory({ q, page: page ? Number(page) : 1 });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title", { count: total })}</h1>
      <div className="mt-4">
        <AdminSearchBar placeholder={t("searchPlaceholder")} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colProduct")}</th>
              <th className="px-4 py-3">{t("colStock")}</th>
              <th className="px-4 py-3">{t("colThreshold")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <InventoryRow key={p.id} productId={p.id} name={p.name} sku={p.sku} stock={p.stock} lowStockThreshold={p.lowStockThreshold} isActive={p.isActive} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/admin/inventory" searchParams={{ q }} />
    </div>
  );
}
