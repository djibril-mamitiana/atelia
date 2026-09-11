import type { Metadata } from "next";
import { getAdminCoupons } from "@/server/queries/admin.queries";
import { db } from "@/lib/db";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponRowActions } from "@/components/admin/coupon-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Promotions — Admin" };

export default async function AdminPromotionsPage() {
  const [coupons, categories, products] = await Promise.all([
    getAdminCoupons(),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 200 }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Promotions</h1>
      </div>

      <div className="mt-4">
        <CouponForm categories={categories} products={products} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Réduction</th>
              <th className="px-4 py-3">Validité</th>
              <th className="px-4 py-3">Utilisations</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-ink">{c.code}</td>
                <td className="px-4 py-3 text-ink">{c.type === "PERCENT" ? `-${Number(c.value)}%` : `-${formatPrice(Number(c.value))}`}</td>
                <td className="px-4 py-3 text-muted">{formatDate(c.startsAt)} → {formatDate(c.endsAt)}</td>
                <td className="px-4 py-3 text-muted">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.isActive && c.endsAt > new Date() ? "sage" : "neutral"}>
                    {c.endsAt < new Date() ? "Expiré" : c.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3"><CouponRowActions id={c.id} isActive={c.isActive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
