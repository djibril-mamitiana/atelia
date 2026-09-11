import Link from "next/link";
import type { Metadata } from "next";
import { Euro, ShoppingBag, Users, Package, AlertTriangle, Clock } from "lucide-react";
import { getDashboardKpis, getSalesByDay, getTopProducts, getTopCategories } from "@/server/queries/admin-dashboard.queries";
import { BarChart } from "@/components/admin/bar-chart";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [kpis, salesByDay, topProducts, topCategories] = await Promise.all([
    getDashboardKpis(),
    getSalesByDay(14),
    getTopProducts(5),
    getTopCategories(5),
  ]);

  const cards = [
    { label: "Chiffre d'affaires", value: formatPrice(kpis.revenue), icon: Euro },
    { label: "Commandes", value: kpis.orderCount, icon: ShoppingBag },
    { label: "Clients", value: kpis.customerCount, icon: Users },
    { label: "Produits actifs", value: kpis.productCount, icon: Package },
    { label: "Panier moyen", value: formatPrice(kpis.averageBasket), icon: Euro },
    { label: "Commandes à traiter", value: kpis.ordersToProcess, icon: Clock },
    { label: "Ruptures de stock", value: kpis.outOfStockCount, icon: AlertTriangle },
    { label: "Stock bientôt épuisé", value: kpis.lowStockCount, icon: AlertTriangle },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border border-border bg-surface p-4">
            <c.icon size={18} className="text-accent" strokeWidth={1.6} />
            <p className="mt-2 text-xl font-semibold text-ink">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Ventes des 14 derniers jours</p>
          <BarChart data={salesByDay.map((d) => ({ label: d.date.slice(5), value: d.total }))} />
        </div>

        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">Catégories les plus vendues</p>
          <div className="flex flex-col gap-3">
            {topCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{c.name}</span>
                <span className="font-medium text-ink">{formatPrice(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-medium text-ink">Produits les plus vendus</p>
          <Link href="/admin/products" className="text-sm text-accent-dark hover:underline">Gérer les produits</Link>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {topProducts.map((item) => (
            <div key={item.product?.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{item.product?.name ?? "Produit supprimé"}</span>
              <span className="text-muted">{item.quantity} vendus</span>
              <span className="font-medium text-ink">{formatPrice(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
