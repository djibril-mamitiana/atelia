import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminCustomerById } from "@/server/queries/admin.queries";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Client — Admin" };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Admin.CustomerDetail");
  const tStatus = await getTranslations("Admin.OrderStatus");
  const customer = await getAdminCustomerById(id);
  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">{customer.firstName} {customer.lastName}</h1>
      <p className="text-sm text-muted">{customer.email} · {t("since", { date: formatDate(customer.createdAt) })}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{customer.orders.length}</p>
          <p className="text-xs text-muted">{t("kpiOrders")}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{formatPrice(totalSpent)}</p>
          <p className="text-xs text-muted">{t("kpiTotalSpent")}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xl font-semibold text-ink">{customer.addresses.length}</p>
          <p className="text-xs text-muted">{t("kpiAddresses")}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-medium text-ink">{t("ordersSection")}</h2>
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
          {customer.orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-paper">
              <span className="font-medium text-ink">{order.orderNumber}</span>
              <span className="text-muted">{formatDate(order.createdAt)}</span>
              <Badge tone="neutral">{tStatus(order.status)}</Badge>
              <span className="font-medium text-ink">{formatPrice(Number(order.total))}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-medium text-ink">{t("addressesSection")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {customer.addresses.map((addr) => (
            <div key={addr.id} className="rounded-md border border-border bg-surface p-4 text-sm text-muted">
              <p className="font-medium text-ink">{addr.firstName} {addr.lastName}</p>
              <p>{addr.line1}, {addr.postalCode} {addr.city}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
