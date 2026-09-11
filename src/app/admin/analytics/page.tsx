import type { Metadata } from "next";
import { getSalesByDay, getSalesByMonth, getTopProducts, getTopCategories } from "@/server/queries/admin-dashboard.queries";
import { BarChart } from "@/components/admin/bar-chart";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Statistiques — Admin" };

export default async function AdminAnalyticsPage() {
  const [salesByDay, salesByMonth, topProducts, topCategories] = await Promise.all([
    getSalesByDay(30),
    getSalesByMonth(6),
    getTopProducts(10),
    getTopCategories(10),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Statistiques</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Chiffre d&apos;affaires — 30 derniers jours</p>
          <BarChart data={salesByDay.map((d) => ({ label: d.date.slice(8), value: d.total }))} />
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Chiffre d&apos;affaires — 6 derniers mois</p>
          <BarChart data={salesByMonth.map((d) => ({ label: d.month.slice(5), value: d.total }))} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Produits les plus vendus</p>
          <div className="flex flex-col divide-y divide-border">
            {topProducts.map((item) => (
              <div key={item.product?.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{item.product?.name ?? "Produit supprimé"}</span>
                <span className="text-muted">{item.quantity} vendus</span>
                <span className="font-medium text-ink">{formatPrice(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Catégories les plus vendues</p>
          <div className="flex flex-col divide-y divide-border">
            {topCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{c.name}</span>
                <span className="font-medium text-ink">{formatPrice(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
