import { adminTitle } from "@/lib/admin-metadata";
import { getLocale, getTranslations } from "next-intl/server";
import { getSalesByDay, getSalesByMonth, getTopProducts, getTopCategories } from "@/server/queries/admin-dashboard.queries";
import { BarChart } from "@/components/admin/bar-chart";
import { formatPrice } from "@/lib/format";

export const generateMetadata = () => adminTitle("navAnalytics");

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("Admin.Analytics");
  const locale = await getLocale();
  const [salesByDay, salesByMonth, topProducts, topCategories] = await Promise.all([
    getSalesByDay(30),
    getSalesByMonth(6),
    getTopProducts(10),
    getTopCategories(10),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">{t("revenue30Days")}</p>
          <BarChart data={salesByDay.map((d) => ({ label: d.date.slice(8), value: d.total }))} locale={locale} />
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">{t("revenue6Months")}</p>
          <BarChart data={salesByMonth.map((d) => ({ label: d.month.slice(5), value: d.total }))} locale={locale} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">{t("topProducts")}</p>
          <div className="flex flex-col divide-y divide-border">
            {topProducts.map((item) => (
              <div key={item.product?.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{item.product?.name ?? t("deletedProduct")}</span>
                <span className="text-muted">{t("unitsSold", { count: item.quantity })}</span>
                <span className="font-medium text-ink">{formatPrice(item.revenue, locale)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="mb-4 font-medium text-ink">{t("topCategories")}</p>
          <div className="flex flex-col divide-y divide-border">
            {topCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{c.name}</span>
                <span className="font-medium text-ink">{formatPrice(c.revenue, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
