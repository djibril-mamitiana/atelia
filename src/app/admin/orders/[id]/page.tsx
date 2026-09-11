import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderForAdmin } from "@/server/queries/orders.queries";
import { OrderStatusTimeline } from "@/components/order/order-status-timeline";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Détail commande — Admin" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  return (
    <div>
      <p className="text-sm text-muted">Commande</p>
      <h1 className="font-display text-2xl text-ink">{order.orderNumber}</h1>
      <p className="text-sm text-muted">Passée le {formatDate(order.createdAt)} par {order.user.firstName} {order.user.lastName} ({order.user.email})</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">Suivi</h2>
            <OrderStatusTimeline currentStatus={order.status} history={order.statusHistory} />
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">Produits</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">{item.productName}</span>
                  <span className="text-muted">Qté {item.quantity} × {formatPrice(Number(item.unitPrice))}</span>
                  <span className="font-medium text-ink">{formatPrice(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-3 font-medium text-ink">Adresses</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted">
              <div>
                <p className="mb-1 font-medium text-ink">Livraison</p>
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />{order.shippingAddress.line1}<br />{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-ink">Facturation</p>
                <p>{order.billingAddress.firstName} {order.billingAddress.lastName}<br />{order.billingAddress.line1}<br />{order.billingAddress.postalCode} {order.billingAddress.city}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border bg-surface p-5">
            <p className="mb-3 font-medium text-ink">Montant</p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd>{formatPrice(Number(order.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Réduction</dt><dd>-{formatPrice(Number(order.discount))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd>{formatPrice(Number(order.shippingCost))}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink"><dt>Total</dt><dd>{formatPrice(Number(order.total))}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Paiement : {order.payment?.status ?? "—"}</p>
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
