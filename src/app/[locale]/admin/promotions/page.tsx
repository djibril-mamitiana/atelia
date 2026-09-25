import { adminTitle } from "@/lib/admin-metadata";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminCoupons } from "@/server/queries/admin.queries";
import { db } from "@/lib/db";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponRowActions } from "@/components/admin/coupon-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

export const generateMetadata = () => adminTitle("navPromotions");

export default async function AdminPromotionsPage() {
  const t = await getTranslations("Admin.Promotions");
  const locale = await getLocale();
  const [coupons, categories, products] = await Promise.all([
    getAdminCoupons(),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 200 }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">{t("title")}</h1>
      </div>

      <div className="mt-4">
        <CouponForm categories={categories} products={products} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colCode")}</th>
              <th className="px-4 py-3">{t("colDiscount")}</th>
              <th className="px-4 py-3">{t("colValidity")}</th>
              <th className="px-4 py-3">{t("colUsage")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-ink">{c.code}</td>
                <td className="px-4 py-3 text-ink">{c.type === "PERCENT" ? `-${Number(c.value)}%` : `-${formatPrice(Number(c.value), locale)}`}</td>
                <td className="px-4 py-3 text-muted">{formatDate(c.startsAt, locale)} → {formatDate(c.endsAt, locale)}</td>
                <td className="px-4 py-3 text-muted">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.isActive && c.endsAt > new Date() ? "sage" : "neutral"}>
                    {c.endsAt < new Date() ? t("statusExpired") : c.isActive ? t("statusActive") : t("statusInactive")}
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
