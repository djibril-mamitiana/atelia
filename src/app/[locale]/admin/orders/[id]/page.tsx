import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getOrderForAdmin } from "@/server/queries/orders.queries";
import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Détail commande — Admin" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Admin.Orders");
  const locale = await getLocale();
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div>
      <p className="text-sm text-muted">{t("detailEyebrow")}</p>
      <h1 className="font-display text-2xl text-ink">{order.orderNumber}</h1>
      <p className="text-sm text-muted">
        {t("placedOn", { date: formatDate(order.createdAt, locale), name: `${order.user.firstName} ${order.user.lastName}`, email: order.user.email })}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">{t("tracking")}</h2>
            <OrderStatusTimeline currentStatus={order.status} history={order.statusHistory} />
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">{t("productsSection")}</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">{item.productName}</span>
                  <span className="text-muted">{t("qtyLine", { qty: item.quantity, price: formatPrice(Number(item.unitPrice), locale) })}</span>
                  <span className="font-medium text-ink">{formatPrice(Number(item.total), locale)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">{t("addresses")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted">
              <div>
                <p className="mb-1 font-medium text-ink">{t("shippingLabel")}</p>
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />{order.shippingAddress.line1}<br />{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-ink">{t("billingLabel")}</p>
                <p>{order.billingAddress.firstName} {order.billingAddress.lastName}<br />{order.billingAddress.line1}<br />{order.billingAddress.postalCode} {order.billingAddress.city}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="mb-3 font-medium text-ink">{t("amount")}</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t("subtotal")}</dt><dd>{formatPrice(Number(order.subtotal), locale)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("discount")}</dt><dd>-{formatPrice(Number(order.discount), locale)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("shippingCost")}</dt><dd>{formatPrice(Number(order.shippingCost), locale)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink"><dt>{t("total")}</dt><dd>{formatPrice(Number(order.total), locale)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">{t("payment", { status: order.payment?.status ?? "—" })}</p>
          </div>

          <OrderStatusControl
            orderId={order.id}
            currentStatus={order.status}
            paymentProvider={order.payment?.provider}
            paymentStatus={order.payment?.status}
            carrier={order.shipment?.carrier}
            trackingNumber={order.shipment?.trackingNumber}
          />
        </div>
      </div>
    </div>
  );
}
