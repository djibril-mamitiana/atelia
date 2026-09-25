import { adminTitle } from "@/lib/admin-metadata";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminOrders } from "@/server/queries/admin.queries";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { Pagination } from "@/components/catalog/pagination";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";

export const generateMetadata = () => adminTitle("navOrders");

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const t = await getTranslations("Admin.Orders");
  const tStatus = await getTranslations("Admin.OrderStatus");
  const locale = await getLocale();
  const { q, status, page } = await searchParams;
  const { orders, total, pageCount } = await getAdminOrders({
    q,
    status: status as OrderStatus | undefined,
    page: page ? Number(page) : 1,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{t("title", { count: total })}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder={t("searchPlaceholder")} />
        <div className="flex flex-wrap gap-1.5">
          <Link href="/admin/orders" className={`rounded-full border px-3 py-1 text-xs ${!status ? "border-ink bg-ink text-white" : "border-border-strong text-muted"}`}>
            {t("filterAll")}
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`rounded-full border px-3 py-1 text-xs ${status === s ? "border-ink bg-ink text-white" : "border-border-strong text-muted"}`}
            >
              {tStatus(s)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("colOrder")}</th>
              <th className="px-4 py-3">{t("colCustomer")}</th>
              <th className="px-4 py-3">{t("colDate")}</th>
              <th className="px-4 py-3">{t("colAmount")}</th>
              <th className="px-4 py-3">{t("colPayment")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="cursor-pointer hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:text-accent-dark">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{order.user.firstName} {order.user.lastName}</td>
                <td className="px-4 py-3 text-muted">{formatDate(order.createdAt, locale)}</td>
                <td className="px-4 py-3 text-ink">{formatPrice(Number(order.total), locale)}</td>
                <td className="px-4 py-3 text-muted">{order.payment?.status ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={order.status === "DELIVERED" ? "sage" : order.status === "CANCELLED" || order.status === "REFUNDED" ? "danger" : "accent"}>
                    {tStatus(order.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page ? Number(page) : 1} pageCount={pageCount} basePath="/admin/orders" searchParams={{ q, status }} />
    </div>
  );
}
